/* eslint-disable @next/next/no-img-element -- library tiles are plain static files */
"use client";

import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { appCopy } from "@/lib/appContent";
import {
  getPopulatedGroups,
  searchLibrary,
  type LibraryPreset,
} from "@/lib/referenceLibrary";
import { cn } from "@/lib/utils";

type LibraryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Choosing the preset that is already selected clears the choice. */
  onSelect: (preset: LibraryPreset) => void;
  selectedId: string | null;
};

export function LibraryDialog({
  open,
  onOpenChange,
  onSelect,
  selectedId,
}: LibraryDialogProps) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const matches = new Set(searchLibrary(query).map((preset) => preset.id));

    return getPopulatedGroups()
      .map((entry) => ({
        ...entry,
        presets: entry.presets.filter((preset) => matches.has(preset.id)),
      }))
      .filter((entry) => entry.presets.length > 0);
  }, [query]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      {/*
        `overflow-hidden` is a safety net, not decoration: DialogContent is
        `overflow: visible` by default, so without it the inner scroller is the
        only thing keeping content inside the dialog.
      */}
      <DialogContent
        className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
        onOpenAutoFocus={(event) => {
          // Radix focuses the search box, which on a phone or tablet pops the
          // on-screen keyboard over half the dialog. Keep focus inside the
          // dialog, but on the dialog itself.
          if (window.matchMedia("(pointer: coarse)").matches) {
            event.preventDefault();
            (event.currentTarget as HTMLElement | null)?.focus();
          }
        }}
        tabIndex={-1}
      >
        <DialogHeader className="border-b p-6 pb-4">
          <DialogTitle>{appCopy.library.title}</DialogTitle>
          <DialogDescription>{appCopy.library.description}</DialogDescription>
          <div className="relative mt-3">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={appCopy.library.searchPlaceholder}
              value={query}
            />
          </div>
        </DialogHeader>

        {/*
          Native scrolling on purpose: Radix ScrollArea leaves its root at
          `overflow: visible` and wraps children in a `display: table` box, so
          the grid escaped the dialog and painted over the footer.
        */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-8 p-6">
            {groups.length === 0 && (
              <p className="text-muted-foreground py-12 text-center text-sm">
                {appCopy.library.empty}
              </p>
            )}

            {groups.map(({ group, presets }) => (
              <section key={group.id}>
                <div className="mb-3">
                  <h3 className="text-sm font-semibold">{group.label}</h3>
                  <p className="text-muted-foreground text-xs">{group.hint}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {presets.map((preset) => {
                    const isSelected = preset.id === selectedId;

                    return (
                      <button
                        aria-pressed={isSelected}
                        className={cn(
                          "group ring-border hover:ring-ring focus-visible:ring-ring relative overflow-hidden rounded-xl text-left ring-1 transition focus-visible:ring-2 focus-visible:outline-none",
                          isSelected && "ring-primary ring-2",
                        )}
                        key={preset.id}
                        onClick={() => onSelect(preset)}
                        type="button"
                      >
                        <div className="bg-muted aspect-4/3 overflow-hidden">
                          <img
                            alt={preset.name}
                            className="size-full object-cover transition duration-300 group-hover:scale-105"
                            loading="lazy"
                            src={preset.image}
                          />
                        </div>
                        <div className="space-y-0.5 p-2.5">
                          <p className="truncate text-sm font-medium">
                            {preset.name}
                          </p>
                          <p className="text-muted-foreground line-clamp-2 text-xs">
                            {preset.description}
                          </p>
                        </div>
                        {isSelected && (
                          <Badge className="absolute top-2 right-2">
                            <Check />
                            {appCopy.library.selected}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t p-4">
          <Button onClick={() => onOpenChange(false)} size="lg" variant="outline">
            {appCopy.library.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
