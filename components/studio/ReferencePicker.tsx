/* eslint-disable @next/next/no-img-element -- featured tiles are plain static files */
"use client";

import { ImagePlus, LibraryBig, Upload } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

import { LibraryDialog } from "@/components/studio/LibraryDialog";
import { ReferenceCard } from "@/components/studio/ReferenceCard";
import { Button } from "@/components/ui/button";
import { appCopy, fillCopy } from "@/lib/appContent";
import { uploadConfig } from "@/lib/config";
import { featuredPresets } from "@/lib/referenceLibrary";
import { cn } from "@/lib/utils";
import type { ImageStudio } from "@/lib/useImageStudio";

/**
 * The whole "put pictures on the table" surface: drop zone, library shortcuts,
 * and the list of attached references with their notes.
 */
export function ReferencePicker({
  studio,
  className,
}: {
  studio: ImageStudio;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const isFull = studio.remainingSlots <= 0;
  const selectedPresetIds = studio.references
    .map((item) => item.presetId)
    .filter((id): id is string => Boolean(id));

  // No early return when full: addFiles explains the limit. Returning silently
  // here made a dropped file just vanish.
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void studio.addFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "rounded-xl border border-dashed p-6 text-center transition-colors",
          isDragging ? "border-ring bg-accent" : "border-border bg-muted/40",
          isFull && "opacity-60",
        )}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isFull) setIsDragging(true);
        }}
        onDrop={handleDrop}
      >
        <ImagePlus className="text-muted-foreground mx-auto size-7" />
        <p className="mt-3 text-sm font-medium">
          {isFull ? appCopy.references.fullTitle : appCopy.references.uploadHint}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          {isFull
            ? appCopy.references.fullDescription
            : fillCopy(appCopy.references.uploadMeta, {
                size: uploadConfig.maxFileSizeLabel,
                count: uploadConfig.maxReferenceCount,
              })}
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button
            className="h-10"
            disabled={isFull}
            onClick={() => inputRef.current?.click()}
            size="lg"
          >
            <Upload />
            {appCopy.references.uploadTitle}
          </Button>
          <Button
            className="h-10"
            disabled={isFull}
            onClick={() => setIsLibraryOpen(true)}
            size="lg"
            variant="outline"
          >
            <LibraryBig />
            {appCopy.references.libraryButton}
          </Button>
        </div>

        <input
          accept={uploadConfig.acceptAttribute}
          className="hidden"
          multiple
          onChange={(event) => {
            void studio.addFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
          ref={inputRef}
          type="file"
        />
      </div>

      {studio.references.length === 0 && (
        <div>
          <p className="text-muted-foreground mb-2 text-xs">
            {appCopy.references.libraryHint}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {featuredPresets.map((preset) => (
              <button
                className="group ring-border hover:ring-ring focus-visible:ring-ring overflow-hidden rounded-lg text-left ring-1 transition focus-visible:ring-2 focus-visible:outline-none"
                key={preset.id}
                onClick={() => studio.addLibraryPreset(preset)}
                type="button"
              >
                <div className="bg-muted aspect-square overflow-hidden">
                  <img
                    alt={preset.name}
                    className="size-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                    src={preset.image}
                  />
                </div>
                <p className="line-clamp-2 px-2 py-1.5 text-xs leading-tight font-medium">
                  {preset.name}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {studio.references.length > 0 && (
        <div className="space-y-3">
          {studio.references.map((reference, index) => (
            <ReferenceCard
              index={index}
              key={reference.id}
              onNoteChange={studio.updateNote}
              onRemove={studio.removeReference}
              reference={reference}
            />
          ))}
        </div>
      )}

      <LibraryDialog
        onOpenChange={setIsLibraryOpen}
        onSelect={studio.addLibraryPreset}
        open={isLibraryOpen}
        selectedIds={selectedPresetIds}
      />
    </div>
  );
}
