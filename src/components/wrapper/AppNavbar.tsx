"use client";

import Navbar from "@/components/helpers/Navbar";
import { useNavbarNote } from "@/components/wrapper/NoteNavbarContext";

export function AppNavbar() {
  const note = useNavbarNote();

  return <Navbar note={note ?? undefined} />;
}
