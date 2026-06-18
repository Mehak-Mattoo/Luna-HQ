"use client";

import Image from "next/image";
import { useMemo, useState, type FormEvent } from "react";
import type { UIMessage } from "ai";
import {
  ArrowUp,
  FileText,
  Lightbulb,
  List,
  Loader2,
  Search,
  Sparkles,
  CircleHelp,
} from "lucide-react";

import { icons } from "@/assets";
import {
  formatUIFriendlyDate,
  getFolderTagStyle,
  LUNA,
} from "@/components/helpers/constants";
import { useNoteChat } from "@/hooks/useNoteChat";
import { type Note } from "@/hooks/useNotes";
import { useFolders } from "@/hooks/useFolders";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type NoteChatPanelProps = {
  note: Note;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type QuickAction = {
  id: string;
  label: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "summarize",
    label: "Summarize this note",
    prompt: "Summarize this note in clear, concise paragraphs.",
    icon: FileText,
  },
  {
    id: "key-points",
    label: "Extract key points",
    prompt: "Extract the key points from this note as a bullet list.",
    icon: List,
  },
  {
    id: "interview",
    label: "Generate interview questions",
    prompt:
      "Generate thoughtful interview questions based on the topics in this note.",
    icon: CircleHelp,
  },
  {
    id: "explain",
    label: "Explain a concept",
    prompt:
      "Explain the main concepts in this note in simple terms with examples.",
    icon: Lightbulb,
  },
  {
    id: "related",
    label: "Find related notes",
    prompt:
      "Based on this note, suggest related topics I should explore or notes I might want to create.",
    icon: Search,
  },
];

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

function formatNoteDate(date: string): string {
  const then = new Date(date);
  if (Number.isNaN(then.getTime())) return "—";
  return then.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getNoteStats(content: string) {
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readingMinutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / 200));
  return { words, readingMinutes };
}

function isChatRequestError(
  error: Error,
): error is Error & { status: number } {
  return "status" in error && typeof error.status === "number";
}

function ContextRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

export function NoteChatPanel({
  note,
  open,
  onOpenChange,
}: NoteChatPanelProps) {
  const { messages, sendMessage, status, error, stop } = useNoteChat(note.id);
  const { data: folders = [] } = useFolders();
  const [input, setInput] = useState("");

  const isBusy = status === "submitted" || status === "streaming";

  const folderName = useMemo(() => {
    if (!note.folder_id) return null;
    return folders.find((f) => f.id === note.folder_id)?.name ?? null;
  }, [folders, note.folder_id]);

  const { words, readingMinutes } = useMemo(
    () => getNoteStats(note.content),
    [note.content],
  );

  const attachmentCount = note.attachment_path ? 1 : 0;

  async function submitPrompt(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    setInput("");
    await sendMessage({ text: trimmed });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await submitPrompt(input);
  }

  async function handleQuickAction(action: QuickAction) {
    await submitPrompt(action.prompt);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-sm"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{LUNA} — {note.title}</SheetTitle>
          <SheetDescription>Chat and AI actions for this note</SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* Luna greeting */}
            <div className="flex items-start gap-3 p-5 pb-3">
              <div className="relative shrink-0">
                <Image
                  src={icons.luna}
                  alt={LUNA}
                  width={44}
                  height={44}
                  className="rounded-full ring-2 ring-accent/30"
                />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-medium leading-snug">
                  I can help you with this note!
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Here are some things you can do:
                </p>
              </div>
            </div>

            {/* Quick actions */}
            <ul className="space-y-0.5 px-3 pb-4" role="menu">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <li key={action.id} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      disabled={isBusy}
                      onClick={() => void handleQuickAction(action)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                        "hover:bg-violet-500/10 hover:text-foreground",
                        "disabled:pointer-events-none disabled:opacity-50",
                      )}
                    >
                      <Icon className="size-4 shrink-0 text-violet-400" />
                      {action.label}
                    </button>
                  </li>
                );
              })}
            </ul>

            <Separator />

          

            {/* Chat thread */}
            {(messages.length > 0 || error) && (
              <>
              
                <div className="space-y-4 p-5">
                

                  {messages.map((message) => (
                    <div key={message.id} className="space-y-1">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        {message.role === "user" ? "You" : LUNA}
                      </p>
                      <div
                        className={cn(
                          "rounded-xl px-3 py-2.5 text-sm leading-relaxed",
                          message.role === "user"
                            ? "bg-violet-600/20 text-foreground"
                            : "bg-muted/60 text-foreground",
                        )}
                      >
                        <p className="whitespace-pre-wrap">
                          {getMessageText(message)}
                        </p>
                      </div>
                    </div>
                  ))}

                  {error && (
                    <p className="text-sm text-destructive" role="alert">
                      {isChatRequestError(error) && error.status === 429
                        ? "Too many requests. Please wait and try again."
                        : isChatRequestError(error) && error.status === 404
                          ? "Note not found."
                          : isChatRequestError(error) && error.status === 401
                            ? "Please sign in again."
                            : error.message || "Something went wrong."}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Ask anything footer */}
          <div className="shrink-0 border-t border-border/60 bg-card/50 p-4">
            <form onSubmit={handleSubmit} className="relative">
              <Sparkles className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-violet-400" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything!"
                disabled={isBusy}
                className={cn(
                  "w-full rounded-xl border border-border/60 bg-muted/30 py-3 pr-12 pl-10 text-sm",
                  "placeholder:text-muted-foreground focus:border-violet-500/40 focus:outline-none focus:ring-2 focus:ring-violet-500/20",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              />
              <Button
                type="submit"
                size="icon-sm"
                disabled={isBusy || !input.trim()}
                className="absolute top-1/2 right-1.5 size-8 -translate-y-1/2 rounded-lg bg-violet-600 hover:bg-violet-500"
              >
                {isBusy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
              </Button>
            </form>
            {isBusy && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 w-full text-muted-foreground"
                onClick={() => stop()}
              >
                Stop generating
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
