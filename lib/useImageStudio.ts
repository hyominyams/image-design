"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { appCopy, fillCopy } from "@/lib/appContent";
import {
  defaultImageSize,
  queueConfig,
  uploadConfig,
  type ImageSize,
} from "@/lib/config";
import { prepareUpload } from "@/lib/imageUpload";
import { getLibraryPreset } from "@/lib/referenceLibrary";
import {
  addHistory,
  clearHistory as clearStoredHistory,
  loadDraft,
  loadHistory,
  removeHistory as removeStoredHistory,
  saveDraft,
} from "@/lib/storage";
import type {
  DraftState,
  GenerationResponse,
  HistoryItem,
  ReferenceItem,
} from "@/lib/types";

function downloadImage(dataUrl: string) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = `design-studio-${stamp}.png`;
  anchor.click();
}

/** A cancellable wait. Resolves false when the student gave up. */
function waitUnless(ms: number, cancelled: () => boolean) {
  return new Promise<boolean>((resolve) => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (cancelled()) {
        window.clearInterval(timer);
        resolve(false);
      } else if (Date.now() - startedAt >= ms) {
        window.clearInterval(timer);
        resolve(true);
      }
    }, 200);
  });
}

/**
 * How long to wait before trying again. OpenAI's own `retry-after` wins; the
 * jitter keeps a class that pressed together from colliding on every round.
 */
function nextWaitMs(retryAfterSeconds: number | undefined, attempt: number) {
  const backoff = Math.min(
    queueConfig.maxRetryMs,
    queueConfig.minRetryMs * 1.5 ** (attempt - 1),
  );
  const base = retryAfterSeconds
    ? Math.max(retryAfterSeconds * 1000, queueConfig.minRetryMs)
    : backoff;

  return Math.round(base + Math.random() * queueConfig.jitterMs);
}

/**
 * Every piece of studio state and behaviour.
 *
 * Generations are independent by design: a request carries only the current
 * prompt, ratio, uploads and chosen design. A previous result is never sent
 * back to the model — the canvas shows it, and that is all it does.
 */
export function useImageStudio() {
  const hasLoadedDraft = useRef(false);

  const [references, setReferences] = useState<ReferenceItem[]>([]);
  /** A library preset picked as the design direction. No note — see types. */
  const [designId, setDesignId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [imageSize, setImageSize] = useState<ImageSize>(defaultImageSize);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  /** Set while waiting out a rate limit: when the next attempt fires, and which. */
  const [queue, setQueue] = useState<{ retryAt: number; attempt: number } | null>(
    null,
  );
  const cancelledRef = useRef(false);
  const [currentResult, setCurrentResult] = useState<HistoryItem | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const resultUrl = currentResult?.imageUrl ?? "";

  // Restore the previous session once, then keep the draft in sync.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [draft, saved] = await Promise.all([loadDraft(), loadHistory()]);

      if (cancelled) return;

      if (draft) {
        setPrompt(draft.prompt);
        setImageSize(draft.imageSize);
        setReferences(draft.references);
        setDesignId(draft.designId);
      }

      setHistory(saved);
      // Reopen on the most recent result so a refresh doesn't look like lost
      // work. Display only — it is not an input to the next generation.
      setCurrentResult(saved[0] ?? null);
      hasLoadedDraft.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedDraft.current) {
      return;
    }

    const draft: DraftState = { prompt, imageSize, references, designId };
    const timeout = window.setTimeout(() => void saveDraft(draft), 400);

    return () => window.clearTimeout(timeout);
  }, [designId, imageSize, prompt, references]);

  const design = useMemo(
    () => (designId ? (getLibraryPreset(designId) ?? null) : null),
    [designId],
  );
  const remainingSlots = uploadConfig.maxReferenceCount - references.length;
  const canGenerate = prompt.trim().length > 0 && !isGenerating;

  const addFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      if (files.length > remainingSlots) {
        toast.error(
          fillCopy(appCopy.errors.tooManyReferences, {
            count: uploadConfig.maxReferenceCount,
          }),
        );
        return;
      }

      if (
        files.some(
          (file) => !uploadConfig.acceptedMimeTypes.includes(file.type as never),
        )
      ) {
        toast.error(appCopy.errors.invalidFileType);
        return;
      }

      if (files.some((file) => file.size > uploadConfig.maxSourceFileBytes)) {
        toast.error(
          fillCopy(appCopy.errors.fileTooLarge, {
            size: uploadConfig.maxSourceFileLabel,
          }),
        );
        return;
      }

      try {
        const added = await Promise.all(
          // Shrunk here, not sent raw: see lib/imageUpload.ts.
          files.map(async (file) => ({
            id: crypto.randomUUID(),
            src: await prepareUpload(file),
            label: file.name,
            note: "",
          })),
        );

        setReferences((current) => [...current, ...added]);
      } catch {
        toast.error(appCopy.errors.readFailed);
      }
    },
    [remainingSlots],
  );

  // Picking the design that is already chosen clears it.
  const selectDesign = useCallback((id: string | null) => {
    const preset = id ? getLibraryPreset(id) : undefined;

    setDesignId((current) => (id === null || current === id ? null : id));

    // Some layouts only read correctly at a specific ratio.
    if (preset?.suggestedSize && id !== designId) {
      setImageSize(preset.suggestedSize);
    }
  }, [designId]);

  const updateNote = useCallback((id: string, note: string) => {
    setReferences((current) =>
      current.map((item) => (item.id === id ? { ...item, note } : item)),
    );
  }, []);

  const removeReference = useCallback((id: string) => {
    setReferences((current) => current.filter((item) => item.id !== id));
  }, []);

  const generate = useCallback(async () => {
    const trimmed = prompt.trim();

    if (!trimmed) {
      toast.error(appCopy.errors.promptRequired);
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");
    cancelledRef.current = false;

    const startedAt = Date.now();
    const cancelled = () => cancelledRef.current;

    try {
      // Retry the same request while the API is busy, instead of failing. The
      // waiting happens here in the browser so no server function is held open.
      for (let attempt = 1; ; attempt++) {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: trimmed,
            imageSize,
            references: references.map((item) => ({
              note: item.note,
              label: item.label,
              dataUrl: item.src,
            })),
            designId: designId ?? undefined,
          }),
        });
        const result = (await response.json().catch(() => null)) as
          | GenerationResponse
          | null;

        if (result?.code === "rate_limited") {
          if (cancelled()) return;

          if (Date.now() - startedAt > queueConfig.maxWaitMs) {
            throw new Error(appCopy.errors.queueTimedOut);
          }

          const waitMs = nextWaitMs(result.retryAfterSeconds, attempt);

          setQueue({ retryAt: Date.now() + waitMs, attempt });

          if (!(await waitUnless(waitMs, cancelled))) return;

          setQueue(null);
          continue;
        }

        if (!response.ok || !result?.success || !result.imageBase64) {
          throw new Error(result?.error ?? appCopy.errors.generationFailed);
        }

        const item: HistoryItem = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          prompt: trimmed,
          imageSize,
          imageUrl: `data:${result.mimeType ?? "image/png"};base64,${result.imageBase64}`,
          referenceLabels: [
            ...references.map((reference) => reference.label),
            ...(design ? [design.name] : []),
          ],
        };

        // Set directly, not from the store: without IndexedDB the history comes
        // back empty, but the student should still see what they just made.
        setCurrentResult(item);
        setHistory(await addHistory(item));
        toast.success(appCopy.toasts.generated);
        return;
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : appCopy.errors.generationFailed,
      );
    } finally {
      setIsGenerating(false);
      setQueue(null);
      cancelledRef.current = false;
    }
  }, [design, designId, imageSize, prompt, references]);

  /** Only offered while queued: a request already in flight is left to finish. */
  const cancelQueue = useCallback(() => {
    cancelledRef.current = true;
    setQueue(null);
    setIsGenerating(false);
    toast.info(appCopy.toasts.queueCancelled);
  }, []);

  const download = useCallback(
    (url = resultUrl) => {
      if (!url) return;
      downloadImage(url);
      toast.success(appCopy.toasts.saved);
    },
    [resultUrl],
  );

  // Deleting the picture on the canvas moves it to the next most recent one,
  // rather than leaving a deleted image on screen.
  const removeHistoryItem = useCallback(async (id: string) => {
    const remaining = await removeStoredHistory(id);

    setHistory(remaining);
    setCurrentResult((current) =>
      current?.id === id ? (remaining[0] ?? null) : current,
    );
  }, []);

  const clearHistory = useCallback(async () => {
    setHistory(await clearStoredHistory());
    setCurrentResult(null);
    toast.success(appCopy.toasts.historyCleared);
  }, []);

  const openHistoryItem = useCallback((item: HistoryItem) => {
    setCurrentResult(item);
  }, []);

  const startOver = useCallback(() => {
    setReferences([]);
    setDesignId(null);
    setPrompt("");
    setImageSize(defaultImageSize);
    setCurrentResult(null);
    setErrorMessage("");
  }, []);


  return {
    // state
    references,
    designId,
    design,
    prompt,
    imageSize,
    history,
    isGenerating,
    isQueued: queue !== null,
    queueRetryAt: queue?.retryAt ?? null,
    queueAttempt: queue?.attempt ?? 0,
    resultUrl,
    currentResultId: currentResult?.id ?? null,
    errorMessage,
    remainingSlots,
    canGenerate,
    // actions
    setPrompt,
    setImageSize,
    addFiles,
    selectDesign,
    updateNote,
    removeReference,
    generate,
    cancelQueue,
    download,
    removeHistoryItem,
    clearHistory,
    openHistoryItem,
    startOver,
  };
}

export type ImageStudio = ReturnType<typeof useImageStudio>;
