"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Note } from "@/hooks/useNotes";

type NoteNavbarContextValue = {
  note: Note | null;
  setNote: (note: Note | null) => void;
};

const NoteNavbarContext = createContext<NoteNavbarContextValue | null>(null);

export function NoteNavbarProvider({ children }: { children: ReactNode }) {
  const [note, setNote] = useState<Note | null>(null);

  const value = useMemo(() => ({ note, setNote }), [note]);

  return (
    <NoteNavbarContext.Provider value={value}>
      {children}
    </NoteNavbarContext.Provider>
  );
}

export function useNavbarNote() {
  return useContext(NoteNavbarContext)?.note ?? null;
}

export function useSetNavbarNote(note: Note | undefined) {
  const context = useContext(NoteNavbarContext);

  useEffect(() => {
    if (!context) return;

    context.setNote(note ?? null);
    return () => context.setNote(null);
  }, [context, note]);
}
