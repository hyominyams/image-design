/* eslint-disable @next/next/no-img-element -- the result is an in-memory data URL */
"use client";

import {
  Download,
  ImageIcon,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { appCopy } from "@/lib/appContent";
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
        {studio.isGenerating && <GeneratingState />}

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
