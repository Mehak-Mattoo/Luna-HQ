import { notFound } from "next/navigation";

import { NoteDetailPage } from "@/components/pages/NoteDetailPage";
import { loadNoteFromSharedToken } from "@/lib/noteContextServer";
import { createClient } from "@/lib/server";

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const result = await loadNoteFromSharedToken(supabase, token);

  if (!result) notFound();

  const { note, access } = result;

  return (
    <NoteDetailPage
      noteId={String(note.id)}
      initialNote={note}
      trimmed
      readOnly={access === "view"}
    />
  );
}
