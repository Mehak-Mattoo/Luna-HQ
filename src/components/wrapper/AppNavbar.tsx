"use client";

import Navbar from "@/components/helpers/Navbar";
import { useNoteNavbarStore } from "@/store/useNoteNavbarStore";

export function AppNavbar() {
  const note = useNoteNavbarStore((s) => s.note);

  return <Navbar note={note ?? undefined} />;
}
