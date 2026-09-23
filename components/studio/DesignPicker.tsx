/* eslint-disable @next/next/no-img-element -- library tiles are plain static files */
"use client";

import { Check, LibraryBig } from "lucide-react";
import { useMemo, useState } from "react";

import { LibraryDialog } from "@/components/studio/LibraryDialog";
import { Button } from "@/components/ui/button";
import { appCopy, fillCopy } from "@/lib/appContent";
import { featuredPresets, libraryPresets } from "@/lib/referenceLibrary";
import { cn } from "@/lib/utils";
import type { ImageStudio } from "@/lib/useImageStudio";

/**
 * Choosing a design is a single pick with no note: tap a tile to choose it,
 * tap it again to go back to "no design". The full library opens in a dialog.
 */
export function DesignPicker({
  studio,
  className,
}: {
  studio: ImageStudio;
  className?: string;
}) {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Keep the grid the same size and the product cuts in front: a design chosen
  // from the full library takes the first slot after them, so the current
  // choice is always visible here.
  const tiles = useMemo(() => {
    const chosen = studio.design;

    if (!chosen || featuredPresets.some((preset) => preset.id === chosen.id)) {
      return featuredPresets;
    }

    const pinned = featuredPresets.filter((preset) => preset.group === "product");
    const rest = featuredPresets.filter((preset) => preset.group !== "product");

    return [...pinned, chosen, ...rest.slice(0, -1)];
  }, [studio.design]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {tiles.map((preset) => {
          const isSelected = preset.id === studio.designId;

          return (
            <button
              aria-pressed={isSelected}
              className={cn(
                "group relative overflow-hidden rounded-lg text-left ring-1 transition focus-visible:outline-none focus-visible:ring-2",
                isSelected
                  ? "ring-primary ring-2"
                  : "ring-border hover:ring-ring focus-visible:ring-ring",
              )}
              key={preset.id}
              onClick={() => studio.selectDesign(preset.id)}
              title={preset.description}
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
              {isSelected && (
                <span className="bg-primary text-primary-foreground absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full">
                  <Check className="size-3.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Button
        className="h-10 w-full"
        onClick={() => setIsLibraryOpen(true)}
        size="lg"
        variant="outline"
      >
        <LibraryBig />
        {fillCopy(appCopy.library.openAll, { count: libraryPresets.length })}
      </Button>

      <LibraryDialog
        onOpenChange={setIsLibraryOpen}
        onSelect={(preset) => {
          studio.selectDesign(preset.id);
          setIsLibraryOpen(false);
        }}
        open={isLibraryOpen}
        selectedId={studio.designId}
      />
    </div>
  );
}
