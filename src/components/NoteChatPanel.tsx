"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { UIMessage } from "ai";
import { ArrowUp, Loader2, X } from "lucide-react";

import { LUNA } from "@/components/helpers/constants";
import { useNoteChat } from "@/hooks/useNoteChat";
import { type Note } from "@/hooks/useNotes";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";

export type NoteChatPanelProps = {
  note: Note;
  /** Sent once when the panel opens (e.g. from Luna quick actions). */
  pendingPrompt?: string | null;
  onPendingPromptSent?: () => void;
  onClose?: () => void;
};

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

function isChatRequestError(error: Error): error is Error & { status: number } {
  return "status" in error && typeof error.status === "number";
}

export function NoteChatPanel({
  note,
  pendingPrompt,
  onPendingPromptSent,
  onClose,
}: NoteChatPanelProps) {
  const { messages, sendMessage, status, error } = useNoteChat(note.id);
  const [input, setInput] = useState("");
  const sentPendingRef = useRef<string | null>(null);

  const isBusy = status === "submitted" || status === "streaming";

  async function submitPrompt(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    setInput("");
    await sendMessage({ text: trimmed });
  }

  useEffect(() => {
    if (!pendingPrompt?.trim()) return;
    if (sentPendingRef.current === pendingPrompt) return;

    sentPendingRef.current = pendingPrompt;
    void sendMessage({ text: pendingPrompt.trim() }).then(() =>
      onPendingPromptSent?.(),
    );
  }, [pendingPrompt, onPendingPromptSent, sendMessage]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await submitPrompt(input);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex items-start justify-between gap-2 p-3 pb-3">
            <div className=" flex flex-col gap-2 min-w-0 pt-0.5">
              <span className="font-medium leading-snug">
                I can help you with this note!
              </span>
              <span className="text-muted-foreground">
                Ask a question or request a summary below.
              </span>
            </div>
            <div>
              {onClose && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onClose}
                  aria-label="Close chat"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {(messages.length > 0 || error) && (
            <div className="space-y-4 p-5">
              {messages.map((message) => {
                const isUser = message.role === "user";

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex flex-col gap-1",
                      isUser ? "items-end" : "items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg px-3 py-2 leading-relaxed",
                        isUser
                          ? "bg-accent/20 text-foreground"
                          : "bg-muted text-foreground",
                      )}
                    >
                      <h6 className="whitespace-pre-wrap">
                        {getMessageText(message)}
                      </h6>
                    </div>
                    <span className="font-medium text-muted-foreground">
                      {isUser ? "You" : LUNA}
                    </span>
                  </div>
                );
              })}

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {isChatRequestError(error) && error.status === 429
                    ? "Too many requests. Please wait and try again."
                    : isChatRequestError(error) && error.status === 404
                      ? "Note not found."
                      : "Something went wrong."}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border/60 bg-card/50 p-4">
          <form onSubmit={handleSubmit} className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything!"
              disabled={isBusy}
              className="py-3 px-2"
            />
            <Button
              type="submit"
              size="icon-sm"
              disabled={isBusy || !input.trim()}
              className="absolute top-1/2 right-1.5 size-8 -translate-y-1/2 rounded-lg bg-accent/60 hover:bg-accent/50"
            >
              {isBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
