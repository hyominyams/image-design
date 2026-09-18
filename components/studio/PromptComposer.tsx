"use client";

import { Lightbulb } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { appCopy, fillCopy } from "@/lib/appContent";
import { generationConfig, imageSizeOptions, type ImageSize } from "@/lib/config";
import { cn } from "@/lib/utils";

type PromptComposerProps = {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  imageSize: ImageSize;
  onImageSizeChange: (size: ImageSize) => void;
  className?: string;
  /** Hide the inline writing tips where space is tight. */
  showTips?: boolean;
};

export function PromptComposer({
  prompt,
  onPromptChange,
  imageSize,
  onImageSizeChange,
  className,
  showTips = true,
}: PromptComposerProps) {
  return (
    <div className={cn("space-y-5", className)}>
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="studio-prompt">{appCopy.prompt.label}</Label>
          <span className="text-muted-foreground text-xs tabular-nums">
            {fillCopy(appCopy.prompt.counter, {
              current: prompt.length,
              max: generationConfig.maxPromptLength,
            })}
          </span>
        </div>
        <Textarea
          className="min-h-32 resize-y text-base leading-relaxed"
          id="studio-prompt"
          maxLength={generationConfig.maxPromptLength}
          onChange={(event) => onPromptChange(event.target.value)}
          placeholder={appCopy.prompt.placeholder}
          value={prompt}
        />
        <p className="text-muted-foreground text-xs">{appCopy.prompt.help}</p>
      </div>

      {showTips && (
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium">
            <Lightbulb className="size-3.5" />
            {appCopy.prompt.tipsTitle}
          </p>
          <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
            {appCopy.prompt.tips.map((tip) => (
              <li className="flex gap-1.5" key={tip}>
                <span aria-hidden>·</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <Label>{appCopy.size.label}</Label>
        <ToggleGroup
          className="flex-wrap justify-start"
          onValueChange={(value) => {
            if (value) onImageSizeChange(value as ImageSize);
          }}
          type="single"
          value={imageSize}
          variant="outline"
        >
          {imageSizeOptions.map((option) => (
            <ToggleGroupItem
              className="h-10 flex-col gap-0 px-3"
              key={option.value}
              value={option.value}
            >
              <span className="text-xs font-medium">{option.label}</span>
              <span className="text-muted-foreground text-[10px]">
                {option.ratio}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-muted-foreground text-xs">{appCopy.size.help}</p>
      </div>
    </div>
  );
}
