/* eslint-disable @next/next/no-img-element -- the result is an in-memory data URL */
"use client";

import {
  Clock,
  Download,
  ImageIcon,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { appCopy, fillCopy } from "@/lib/appContent";
import { cn } from "@/lib/utils";
import type { ImageStudio } from "@/lib/useImageStudio";

export function ResultCanvas({
  studio,
  className,
}: {
  studio: ImageStudio;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-0 flex-col gap-4", className)}>
      {/* `min-h-64` keeps the picture from collapsing on short screens. */}
      <div className="bg-muted/40 ring-border relative flex min-h-64 flex-1 items-center justify-center overflow-hidden rounded-xl p-4 ring-1">
        {studio.isQueued && (
          <QueuedState
            attempt={studio.queueAttempt}
            key={studio.queueRetryAt}
            onCancel={studio.cancelQueue}
            retryAt={studio.queueRetryAt}
          />
        )}

        {studio.isGenerating && !studio.isQueued && <GeneratingState />}

        {!studio.isGenerating && studio.resultUrl && (
          <img
            alt={appCopy.result.imageAlt}
            className="max-h-full max-w-full rounded-lg object-contain shadow-sm"
            src={studio.resultUrl}
          />
        )}

        {!studio.isGenerating && !studio.resultUrl && <EmptyState />}
      </div>

      {studio.errorMessage && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>{studio.errorMessage}</AlertDescription>
        </Alert>
      )}

      {studio.resultUrl && !studio.isGenerating && (
        <div className="flex flex-wrap gap-2">
          <Button className="h-10" onClick={() => studio.download()} size="lg">
            <Download />
            {appCopy.actions.download}
          </Button>
          <Button
            className="h-10"
            disabled={!studio.canGenerate}
            onClick={() => void studio.generate()}
            size="lg"
            variant="outline"
          >
            <RefreshCw />
            {appCopy.actions.regenerate}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Shown while the API is busy with other students. The student does nothing:
 * the next attempt fires on its own when the countdown ends.
 */
function QueuedState({
  attempt,
  onCancel,
  retryAt,
}: {
  attempt: number;
  onCancel: () => void;
  retryAt: number | null;
}) {
  const [secondsLeft, setSecondsLeft] = useState(() => remainingSeconds(retryAt));

  useEffect(() => {
    const timer = window.setInterval(
      () => setSecondsLeft(remainingSeconds(retryAt)),
      500,
    );

    return () => window.clearInterval(timer);
  }, [retryAt]);

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
      <span className="bg-accent text-accent-foreground flex size-12 items-center justify-center rounded-full">
        <Clock className="size-6" />
      </span>
      <p className="text-sm font-medium">{appCopy.result.queuedTitle}</p>
      <p className="text-muted-foreground text-xs">
        {appCopy.result.queuedDescription}
      </p>
      <p className="text-sm font-medium tabular-nums">
        {secondsLeft > 0
          ? fillCopy(appCopy.result.queuedCountdown, { seconds: secondsLeft })
          : appCopy.result.queuedRetrying}
      </p>
      <p className="text-muted-foreground text-xs">
        {fillCopy(appCopy.result.queuedAttempt, { count: attempt })}
      </p>
      <Button className="mt-1" onClick={onCancel} size="sm" variant="ghost">
        {appCopy.result.queuedCancel}
      </Button>
    </div>
  );
}

function remainingSeconds(retryAt: number | null) {
  return retryAt ? Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)) : 0;
}

function GeneratingState() {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" />
        <p className="text-sm font-medium">{appCopy.result.loadingTitle}</p>
      </div>
      <p className="text-muted-foreground text-xs">
        {appCopy.result.loadingDescription}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center">
      <ImageIcon className="text-muted-foreground mx-auto size-8" />
      <p className="mt-3 text-sm font-medium">{appCopy.result.emptyTitle}</p>
      <p className="text-muted-foreground mt-1 text-xs">
        {appCopy.result.emptyDescription}
      </p>
    </div>
  );
}
