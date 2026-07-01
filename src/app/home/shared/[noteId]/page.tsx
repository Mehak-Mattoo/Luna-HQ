import { notFound, redirect } from "next/navigation";

import { NoteDetailPage } from "@/components/pages/NoteDetailPage";
import { notePath } from "@/components/helpers/routes";
import {
  linkInvitesForUser,
  loadNoteWithAccess,
  NoteContextError,
} from "@/lib/noteContextServer";
import { createClient } from "@/lib/server";

export const dynamic = "force-dynamic";

export default async function SharedWithMeNotePage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  await linkInvitesForUser(supabase, user.id, user.email);

  try {
    const { note, access } = await loadNoteWithAccess(supabase, noteId, {
      userId: user.id,
      userEmail: user.email,
    });

    if (access === "owner") {
      redirect(notePath(note));
    }

    return (
      <NoteDetailPage
        noteId={noteId}
        initialNote={note}
        access={access}
        readOnly={access !== "edit"}
        sharedView
      />
    );
  } catch (error) {
    if (error instanceof NoteContextError) {
      if (error.status === 403 || error.status === 404) {
        notFound();
      }
    }
    throw error;
  }
}
