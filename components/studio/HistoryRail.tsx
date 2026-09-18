/* eslint-disable @next/next/no-img-element -- history holds in-memory data URLs */
"use client";

import { Download, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { appCopy, fillCopy } from "@/lib/appContent";
import { generationConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { ImageStudio } from "@/lib/useImageStudio";

export function HistoryRail({
  studio,
  className,
  orientation = "horizontal",
}: {
  studio: ImageStudio;
  className?: string;
  orientation?: "horizontal" | "grid";
}) {
  return (
    <section className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{appCopy.history.title}</h2>
          <p className="text-muted-foreground text-xs">
            {fillCopy(appCopy.history.description, {
              count: generationConfig.maxHistoryCount,
            })}
          </p>
        </div>
        {studio.history.length > 0 && (
          <Button
            onClick={() => void studio.clearHistory()}
            size="xs"
            variant="ghost"
          >
            {appCopy.history.clear}
          </Button>
        )}
      </div>

      {studio.history.length === 0 ? (
        <p className="text-muted-foreground bg-muted/40 rounded-lg px-3 py-6 text-center text-xs">
          {appCopy.history.empty}
        </p>
      ) : (
        <ul
          className={cn(
            orientation === "horizontal"
              ? "flex gap-2 overflow-x-auto pb-1"
              : "grid grid-cols-3 gap-2 sm:grid-cols-4",
          )}
        >
          {studio.history.map((item) => (
            <li
              className={cn(
                "group relative overflow-hidden rounded-lg ring-1",
                // Marks the picture currently on the canvas, which after a
                // refresh is the most recent one.
                item.id === studio.currentResultId
                  ? "ring-primary ring-2"
                  : "ring-border",
                orientation === "horizontal" && "size-24 shrink-0",
              )}
              key={item.id}
            >
              <button
                aria-current={item.id === studio.currentResultId || undefined}
                className="block size-full focus-visible:outline-none"
                onClick={() => studio.openHistoryItem(item)}
                title={item.prompt}
                type="button"
              >
                <img
                  alt={item.prompt}
                  className={cn(
                    "size-full object-cover",
                    orientation === "grid" && "aspect-square",
                  )}
                  src={item.imageUrl}
                />
              </button>

              {/*
                Touch screens have no hover, so the actions stay visible there;
                only a fine pointer (mouse) hides them until hover or focus.
                Hover-only made history impossible to delete on a tablet.
              */}
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-0.5 bg-gradient-to-t from-black/60 to-transparent p-1 transition-opacity pointer-fine:pointer-events-none pointer-fine:opacity-0 pointer-fine:group-focus-within:pointer-events-auto pointer-fine:group-focus-within:opacity-100 pointer-fine:group-hover:pointer-events-auto pointer-fine:group-hover:opacity-100">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label={appCopy.actions.download}
                      className="text-white hover:bg-white/20 hover:text-white"
                      onClick={() => studio.download(item.imageUrl)}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <Download />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{appCopy.actions.download}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label={appCopy.history.remove}
                      className="text-white hover:bg-white/20 hover:text-white"
                      onClick={() => void studio.removeHistoryItem(item.id)}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <Trash2 />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{appCopy.history.remove}</TooltipContent>
                </Tooltip>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
