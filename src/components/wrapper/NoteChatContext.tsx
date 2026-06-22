"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Note } from "@/hooks/useNotes";

type NoteChatContextValue = {
  isOpen: boolean;
  note: Note | null;
  pendingPrompt: string | null;
  openChat: (note: Note, prompt?: string) => void;
  closeChat: () => void;
  clearPendingPrompt: () => void;
};

const NoteChatContext = createContext<NoteChatContextValue | null>(null);

export function NoteChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState<Note | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const openChat = useCallback((nextNote: Note, prompt?: string) => {
    setNote(nextNote);
    setPendingPrompt(prompt ?? null);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setPendingPrompt(null);
  }, []);

  const clearPendingPrompt = useCallback(() => {
    setPendingPrompt(null);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      note,
      pendingPrompt,
      openChat,
      closeChat,
      clearPendingPrompt,
    }),
    [
      isOpen,
      note,
      pendingPrompt,
      openChat,
      closeChat,
      clearPendingPrompt,
    ],
  );

  return (
    <NoteChatContext.Provider value={value}>
      {children}
    </NoteChatContext.Provider>
  );
}

const noop = () => {};

const defaultContext: NoteChatContextValue = {
  isOpen: false,
  note: null,
  pendingPrompt: null,
  openChat: noop,
  closeChat: noop,
  clearPendingPrompt: noop,
};

export function useNoteChatPanel() {
  return useContext(NoteChatContext) ?? defaultContext;
}
