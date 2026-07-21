"use client";

import { Note } from "@/hooks/useNotes";
import { create } from "zustand";

type NoteChatState = {
  isOpen: boolean;
  note: Note | null;
  pendingPrompt: string | null;
  openChat: (note: Note, prompt?: string) => void;
  closeChat: () => void;
  clearPendingPrompt: () => void;
};

export const useNoteChatStore = create<NoteChatState>((set) => ({
  isOpen: false,
  note: null,
  pendingPrompt: null,
  openChat: (note, prompt) =>
    set({ isOpen: true, note, pendingPrompt: prompt ?? null }),
  closeChat: () => set({ isOpen: false, note: null, pendingPrompt: null }),
  clearPendingPrompt: () => set({ pendingPrompt: null }),
}));
