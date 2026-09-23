"use client";

import { ImagePlus, Upload } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

import { ReferenceCard } from "@/components/studio/ReferenceCard";
import { Button } from "@/components/ui/button";
import { appCopy, fillCopy } from "@/lib/appContent";
import { uploadConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { ImageStudio } from "@/lib/useImageStudio";

/**
 * The student's own pictures: drop zone plus one card per upload, each with
 * the note that tells the model how to use it. Library designs live in
 * DesignPicker and carry no note.
 */
export function UploadPicker({
  studio,
  className,
}: {
  studio: ImageStudio;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isFull = studio.remainingSlots <= 0;

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
                size: uploadConfig.maxSourceFileLabel,
                count: uploadConfig.maxReferenceCount,
              })}
        </p>

        <Button
          className="mt-4 h-10"
          disabled={isFull}
          onClick={() => inputRef.current?.click()}
          size="lg"
        >
          <Upload />
          {appCopy.references.uploadTitle}
        </Button>

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
    </div>
  );
}
