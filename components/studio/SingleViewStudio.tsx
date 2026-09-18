"use client";

import { Check, Sparkles } from "lucide-react";
import { useRef } from "react";

import { HistoryRail } from "@/components/studio/HistoryRail";
import { PromptComposer } from "@/components/studio/PromptComposer";
import { ReferencePicker } from "@/components/studio/ReferencePicker";
import { ResultCanvas } from "@/components/studio/ResultCanvas";
import { StudioHeader } from "@/components/studio/StudioHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { appCopy, fillCopy } from "@/lib/appContent";
import { cn } from "@/lib/utils";
import { useImageStudio } from "@/lib/useImageStudio";

/**
 * 시안 B — everything on one screen.
 * The left column keeps the same 1-2 ordering as the stepper, but as accordion
 * sections, so the result stays visible while inputs are edited.
 */
export function SingleViewStudio() {
  const studio = useImageStudio();
  const resultRef = useRef<HTMLDivElement>(null);

  const hasReferences = studio.references.length > 0;
  const hasPrompt = studio.prompt.trim().length > 0;

  // When the layout stacks (narrow screens), the result sits below every input,
  // so a student would tap "만들기" and see nothing happen. Bring it into view.
  // Measured rather than tied to a breakpoint, so it follows the real layout.
  function handleGenerate() {
    const top = resultRef.current?.getBoundingClientRect().top ?? 0;

    if (top > window.innerHeight / 2) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    void studio.generate();
  }

  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
      <StudioHeader
        hasUnsavedWork={hasReferences || hasPrompt}
        onStartOver={studio.startOver}
      />

      <main className="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]">
        {/* ------------------------------------------------------ inputs */}
        <div className="flex flex-col border-b lg:min-h-0 lg:border-r lg:border-b-0">
          <div className="flex-1 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">
            <Accordion
              className="px-4 sm:px-6"
              defaultValue={["references", "prompt"]}
              type="multiple"
            >
              <AccordionItem value="references">
                <AccordionTrigger className="hover:no-underline">
                  <SectionLabel
                    complete={hasReferences}
                    index={1}
                    label={appCopy.steps.references.label}
                    meta={
                      hasReferences
                        ? fillCopy(appCopy.references.countLabel, {
                            count: studio.references.length,
                          })
                        : appCopy.sections.optional
                    }
                  />
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground mb-3 text-xs">
                    {appCopy.steps.references.description}
                  </p>
                  <ReferencePicker studio={studio} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem className="border-b-0" value="prompt">
                <AccordionTrigger className="hover:no-underline">
                  <SectionLabel
                    complete={hasPrompt}
                    index={2}
                    label={appCopy.steps.prompt.label}
                    meta={appCopy.sections.required}
                  />
                </AccordionTrigger>
                <AccordionContent>
                  <PromptComposer
                    imageSize={studio.imageSize}
                    onImageSizeChange={studio.setImageSize}
                    onPromptChange={studio.setPrompt}
                    prompt={studio.prompt}
                    showTips={!hasPrompt}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="p-4 sm:p-6">
              <HistoryRail studio={studio} />
            </div>
          </div>

          <div className="bg-background/90 sticky bottom-0 border-t p-4 backdrop-blur sm:px-6">
            <Button
              className="h-12 w-full text-base"
              disabled={!studio.canGenerate}
              onClick={handleGenerate}
              size="lg"
            >
              <Sparkles />
              {studio.isGenerating
                ? appCopy.actions.generating
                : studio.resultUrl
                  ? appCopy.actions.regenerate
                  : appCopy.actions.generate}
            </Button>
          </div>
        </div>

        {/* ------------------------------------------------------ result */}
        <div
          className="flex scroll-mt-14 flex-col p-4 sm:p-6 lg:min-h-0 lg:overflow-y-auto"
          ref={resultRef}
        >
          <ResultCanvas className="min-h-[22rem] flex-1" studio={studio} />
        </div>
      </main>
    </div>
  );
}

function SectionLabel({
  complete,
  index,
  label,
  meta,
}: {
  complete: boolean;
  index: number;
  label: string;
  meta: string;
}) {
  return (
    <span className="flex flex-1 items-center gap-2.5">
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          complete
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {complete ? <Check className="size-3.5" /> : index}
      </span>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-muted-foreground ml-auto mr-2 text-xs font-normal">
        {meta}
      </span>
    </span>
  );
}
