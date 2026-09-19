/* eslint-disable @next/next/no-img-element -- references are data URLs and static tiles */
"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { appCopy } from "@/lib/appContent";
import { generationConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { ReferenceItem } from "@/lib/types";

type ReferenceCardProps = {
  reference: ReferenceItem;
  index: number;
  onNoteChange: (id: string, note: string) => void;
  onRemove: (id: string) => void;
  className?: string;
};

/**
 * One uploaded picture plus the note that decides how it gets used.
 * The note is the whole point of this card — it is what the prompt enhancer
 * reads to tell "this is my drawing" apart from "copy this colour only".
 */
export function ReferenceCard({
  reference,
  index,
  onNoteChange,
  onRemove,
  className,
}: ReferenceCardProps) {
  const noteId = `reference-note-${reference.id}`;

  return (
    // Grid, not flex: on a phone the note drops under the thumbnail and gets
    // the full card width. Side by side, it was squeezed to ~200px and a long
    // note ran seven lines tall.
    <div
      className={cn(
        "bg-card ring-border grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 gap-y-3 rounded-xl p-3 ring-1 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-x-4",
        className,
      )}
    >
      <div className="bg-muted relative size-18 overflow-hidden rounded-lg sm:row-span-2 sm:size-28">
        <img
          alt={reference.label}
          className="size-full object-cover"
          src={reference.src}
        />
        <span className="bg-background/85 text-foreground absolute top-1 left-1 rounded px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
          {index + 1}
        </span>
      </div>

      <div className="flex min-w-0 items-start justify-between gap-2">
        <p
          className="min-w-0 truncate pt-1 text-sm font-medium"
          title={reference.label}
        >
          {reference.label}
        </p>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={appCopy.references.removeLabel}
              onClick={() => onRemove(reference.id)}
              size="icon-sm"
              variant="ghost"
            >
              <X />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{appCopy.references.removeLabel}</TooltipContent>
        </Tooltip>
      </div>

      <div className="col-span-2 space-y-1.5 sm:col-span-1 sm:col-start-2">
        <Label className="text-muted-foreground text-xs" htmlFor={noteId}>
          {appCopy.references.noteLabel}
        </Label>
        <Textarea
          className="min-h-16 resize-none text-sm"
          id={noteId}
          maxLength={generationConfig.maxNoteLength}
          onChange={(event) => onNoteChange(reference.id, event.target.value)}
          placeholder={appCopy.references.notePlaceholder}
          value={reference.note}
        />
        <div className="flex flex-wrap gap-1">
          {appCopy.noteSuggestions.map((suggestion) => (
            <Button
              className="text-muted-foreground"
              key={suggestion.label}
              onClick={() => onNoteChange(reference.id, suggestion.note)}
              size="xs"
              type="button"
              variant="outline"
            >
              {suggestion.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
