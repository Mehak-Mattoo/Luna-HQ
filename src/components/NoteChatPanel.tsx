"use client";

import { useState, type FormEvent } from "react";
import type { UIMessage } from "ai";
import { useNoteChat } from "@/hooks/useNoteChat";
import { type Note } from "@/hooks/useNotes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "./ui/input";
import { ArrowUp, Loader2 } from "lucide-react";
import { LUNA } from "@/lib/constants/constants";

export type NoteChatPanelProps = {
  note: Note;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

export function NoteChatPanel({
  note,
  open,
  onOpenChange,
}: NoteChatPanelProps) {
  const { messages, sendMessage, status, error, stop } = useNoteChat(note.id);
  const [input, setInput] = useState("");

  const isBusy = status === "submitted" || status === "streaming";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;

    setInput("");
    await sendMessage({ text });
  }

  function isChatRequestError(
    error: Error,
  ): error is Error & { status: number } {
    return "status" in error && typeof error.status === "number";
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 sm:max-w-md"
      >
        <SheetHeader className="border-b pb-4">
          {/* <SheetTitle>Chat about this note</SheetTitle> */}
          <SheetDescription>{note.title}</SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">empty</p>
            )}

            {messages.map((message) => (
              <>
                <div
                  key={message.id}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "ml-8 bg-primary text-primary-foreground"
                      : "mr-8 bg-muted text-foreground"
                  }`}
                >
                  <h6 className="whitespace-pre-wrap">
                    {getMessageText(message)}
                  </h6>
                </div>
                <span
                  className={`mb-1 flex font-medium opacity-50 w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "user" ? "You" : LUNA}
                </span>
              </>
            ))}

            {error && (
              <div
                className={`rounded-lg px-3 py-2 text-sm mr-8 bg-muted text-foreground`}
              >
                <p className="text-sm text-destructive" role="alert">
                  {isChatRequestError(error) && error.status === 429
                    ? "Too many requests. Please wait and try again."
                    : isChatRequestError(error) && error.status === 404
                      ? "Note not found."
                      : isChatRequestError(error) && error.status === 401
                        ? "Please sign in again."
                        : error.message || "Oops! Something went wrong."}
                </p>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border p-2 rounded-md"
          >
            <Textarea
              className="h-fit border-none resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Luna about this note"
              disabled={isBusy}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={isBusy || !input.trim()}>
                {isBusy ? <Loader2 className="animate-spin" /> : <ArrowUp />}
              </Button>
              {isBusy && (
                <Button type="button" variant="outline" onClick={() => stop()}>
                  Stop
                </Button>
              )}
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
