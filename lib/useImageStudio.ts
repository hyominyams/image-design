"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { appCopy, fillCopy } from "@/lib/appContent";
import { defaultImageSize, uploadConfig, type ImageSize } from "@/lib/config";
import { getLibraryPreset, type LibraryPreset } from "@/lib/referenceLibrary";
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

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function downloadImage(dataUrl: string) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = `design-studio-${stamp}.png`;
  anchor.click();
}

/**
 * Every piece of studio state and behaviour.
 *
 * Generations are independent by design: a request carries only the current
 * prompt, ratio and references. A previous result is never sent back to the
 * model — the canvas shows it, and that is all it does.
 */
export function useImageStudio() {
  const hasLoadedDraft = useRef(false);

  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [prompt, setPrompt] = useState("");
  const [imageSize, setImageSize] = useState<ImageSize>(defaultImageSize);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
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

    const draft: DraftState = { prompt, imageSize, references };
    const timeout = window.setTimeout(() => void saveDraft(draft), 400);

    return () => window.clearTimeout(timeout);
  }, [imageSize, prompt, references]);

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

      if (files.some((file) => file.size > uploadConfig.maxFileSizeBytes)) {
        toast.error(
          fillCopy(appCopy.errors.fileTooLarge, {
            size: uploadConfig.maxFileSizeLabel,
          }),
        );
        return;
      }

      try {
        const added = await Promise.all(
          files.map(async (file) => ({
            id: crypto.randomUUID(),
            kind: "upload" as const,
            src: await readFileAsDataUrl(file),
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

  const addLibraryPreset = useCallback(
    (preset: LibraryPreset) => {
      if (remainingSlots <= 0) {
        toast.error(
          fillCopy(appCopy.errors.tooManyReferences, {
            count: uploadConfig.maxReferenceCount,
          }),
        );
        return;
      }

      setReferences((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          kind: "library",
          src: preset.image,
          label: preset.name,
          note: preset.defaultNote,
          presetId: preset.id,
        },
      ]);

      // Some layouts only read correctly at a specific ratio.
      if (preset.suggestedSize) {
        setImageSize(preset.suggestedSize);
      }

      toast.success(appCopy.toasts.referenceAdded);
    },
    [remainingSlots],
  );

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

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          imageSize,
          references: references.map((item) => ({
            kind: item.kind,
            note: item.note,
            label: item.label,
            dataUrl: item.kind === "upload" ? item.src : undefined,
            presetId: item.presetId,
          })),
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | GenerationResponse
        | null;

      if (!response.ok || !result?.success || !result.imageBase64) {
        throw new Error(result?.error ?? appCopy.errors.generationFailed);
      }

      const item: HistoryItem = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        prompt: trimmed,
        imageSize,
        imageUrl: `data:${result.mimeType ?? "image/png"};base64,${result.imageBase64}`,
        referenceLabels: references.map((reference) => reference.label),
      };

      // Set directly, not from the store: without IndexedDB the history comes
      // back empty, but the student should still see what they just made.
      setCurrentResult(item);
      setHistory(await addHistory(item));
      toast.success(appCopy.toasts.generated);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : appCopy.errors.generationFailed,
      );
    } finally {
      setIsGenerating(false);
    }
  }, [imageSize, prompt, references]);

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
    setPrompt("");
    setImageSize(defaultImageSize);
    setCurrentResult(null);
    setErrorMessage("");
  }, []);

  const referencePresets = useMemo(
    () =>
      references
        .map((item) => (item.presetId ? getLibraryPreset(item.presetId) : null))
        .filter((preset): preset is LibraryPreset => preset !== null),
    [references],
  );

  return {
    // state
    references,
    referencePresets,
    prompt,
    imageSize,
    history,
    isGenerating,
    resultUrl,
    currentResultId: currentResult?.id ?? null,
    errorMessage,
    remainingSlots,
    canGenerate,
    // actions
    setPrompt,
    setImageSize,
    addFiles,
    addLibraryPreset,
    updateNote,
    removeReference,
    generate,
    download,
    removeHistoryItem,
    clearHistory,
    openHistoryItem,
    startOver,
  };
}

export type ImageStudio = ReturnType<typeof useImageStudio>;
