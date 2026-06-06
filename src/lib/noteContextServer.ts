import type { SupabaseClient } from "@supabase/supabase-js";
import type { Note } from "@/hooks/useNotes";

export class NoteContextError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function loadNoteForUser(
  supabase: SupabaseClient,
  noteId: string | number,
  userId: string,
): Promise<Note> {
  const { data: note, error } = await supabase
    .from("notes")
    .select(
      "id, title, content, attachment_path, attachment_name, attachment_mime, user_id, created_at",
    )
    .eq("id", noteId)
    .single();

  if (error || !note) {
    throw new NoteContextError("Note not found", 404);
  }

  if (note.user_id !== userId) {
    throw new NoteContextError("Forbidden", 403);
  }

  return note as Note;
}

export function buildNoteChatSystemPrompt(note: Note): string {
  return `You are a helpful assistant that answers questions about a single note.
Answer only using the note content below. If the answer is not in the note, say you cannot find it in this note.
Keep answers concise and conversational.

Title: ${note.title}
Content:
${note.content || "(empty)"}`;
}
