"use client";

import { Note } from "@/hooks/useNotes";
import { useEffect } from "react";
import { create } from "zustand";

type NoteNavbarState = {
  note: Note | null;
  setNote: (note: Note | null) => void;
};

export const useNoteNavbarStore = create<NoteNavbarState>((set) => ({
  note: null,
  setNote: (note) => set({ note }),
}));

export function useSetNavbarNote(note: Note | undefined) {
  const setNote = useNoteNavbarStore((s) => s.setNote);
  useEffect(() => {
    setNote(note ?? null);
    return () => setNote(null);
  }, [note, setNote]);
}