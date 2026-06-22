"use client";

import { NoteChatPanel } from "@/components/NoteChatPanel";
import { useNoteChatPanel } from "@/components/wrapper/NoteChatContext";
import { cn } from "@/lib/utils";

export function NoteChatLayoutPanel() {
  const { isOpen, note, pendingPrompt, closeChat, clearPendingPrompt } =
    useNoteChatPanel();

  const showPanel = isOpen && note;

  return (
    <aside
      aria-hidden={!showPanel}
      className={cn(
        "sticky top-0 h-svh shrink-0 overflow-hidden border-l border-border bg-background transition-[width] duration-300 ease-in-out",
        showPanel ? "w-80 sm:w-96" : "w-0 border-l-transparent",
      )}
    >
      <div className="flex h-full w-80 flex-col sm:w-96">
        {showPanel && (
          <NoteChatPanel
            note={note}
            pendingPrompt={pendingPrompt}
            onPendingPromptSent={clearPendingPrompt}
            onClose={closeChat}
          />
        )}
      </div>
    </aside>
  );
}
