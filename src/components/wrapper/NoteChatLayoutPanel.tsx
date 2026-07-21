"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

import { useNoteChatStore } from "@/store/useNoteChatStore";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const NoteChatPanel = dynamic(
  () =>
    import("@/components/NoteChatPanel").then((mod) => ({
      default: mod.NoteChatPanel,
    })),
  { ssr: false },
);

export function NoteChatLayoutPanel() {
  const { isOpen, note, pendingPrompt, closeChat, clearPendingPrompt } =
    useNoteChatStore();

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
          <Suspense
            fallback={
              <>
                <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="size-4 animate-spin" />
                </div>
              </>
            }
          >
            <NoteChatPanel
              note={note}
              pendingPrompt={pendingPrompt}
              onPendingPromptSent={clearPendingPrompt}
              onClose={closeChat}
            />
          </Suspense>
        )}
      </div>
    </aside>
  );
}
