"use client";

import type { Note } from "@/hooks/useNotes";
import type { NoteSummary } from "@/lib/schema/noteSummary";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "./ui/button";

export type SummarizeDrawerProps = {
  note: Note;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: NoteSummary | undefined;
  error: string | null;
  isPending: boolean;
};

function summarizeButtonLabel(note: Note, isPending: boolean) {
  if (isPending) return "Summarizing...";

  return "Summarize";
}

export function SummarizeDrawer({
  note,
  open,
  onOpenChange,
  summary,
  error,
  isPending,
}: SummarizeDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          {/* <DrawerTitle>Summary — {note.title}</DrawerTitle> */}
          <DrawerDescription asChild>
            <div className="space-y-4 text-left">
              {isPending && (
                <p className="text-sm text-muted-foreground">
                  Generating summary…
                </p>
              )}

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              {!isPending && !error && summary && (
                <div className="space-y-2">
                  <p className="font-medium text-foreground">
                    {summary.summary}
                  </p>
                  {summary.bulletPoints.length > 0 && (
                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {summary.bulletPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {!isPending && !error && !summary && (
                <p className="text-sm text-muted-foreground">No summary yet.</p>
              )}
            </div>
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="flex justify-end items-end">
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export { summarizeButtonLabel };
