"use client";

import { RotateCcw } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { appCopy } from "@/lib/appContent";
import { cn } from "@/lib/utils";

export function StudioHeader({
  onStartOver,
  hasUnsavedWork = false,
  className,
  children,
}: {
  onStartOver?: () => void;
  /** Uploads, notes and the prompt are wiped with no undo, so confirm first. */
  hasUnsavedWork?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const startOverButton = (
    <Button
      onClick={hasUnsavedWork ? undefined : onStartOver}
      size="sm"
      variant="ghost"
    >
      <RotateCcw />
      <span className="hidden sm:inline">{appCopy.actions.startOver}</span>
    </Button>
  );

  return (
    <header
      className={cn(
        "bg-background/90 sticky top-0 z-20 border-b backdrop-blur",
        className,
      )}
    >
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{appCopy.app.name}</p>
          <p className="text-muted-foreground hidden truncate text-xs sm:block">
            {appCopy.app.tagline}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          {children}
          {onStartOver &&
            (hasUnsavedWork ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>{startOverButton}</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{appCopy.startOver.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {appCopy.startOver.description}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{appCopy.startOver.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={onStartOver} variant="destructive">
                      {appCopy.startOver.confirm}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              startOverButton
            ))}
        </div>
      </div>
    </header>
  );
}
