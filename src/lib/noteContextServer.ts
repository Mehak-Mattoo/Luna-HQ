import type { SupabaseClient } from "@supabase/supabase-js";
import { TABLE_KEYS } from "@/components/helpers/constants";
import type { Note } from "@/hooks/useNotes";

export class NoteContextError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type NoteAccess = "owner" | "view" | "edit";

export type NoteAccessResult = {
  note: Note;
  access: NoteAccess;
};

export type LoadNoteWithAccessOptions = {
  shareToken?: string | null;
  userId?: string | null;
  requireEdit?: boolean;
};

const NOTE_COLUMNS =
  "id, title, content, attachment_path, attachment_name, attachment_mime, user_id, folder_id, folder_name, is_favorite, created_at, share_token, is_shared, share_permission";

function assertCanEdit(access: NoteAccess, requireEdit: boolean) {
  if (!requireEdit) return;
  if (access === "owner" || access === "edit") return;
  throw new NoteContextError("Forbidden", 403);
}

export async function loadNoteWithAccess(
  supabase: SupabaseClient,
  noteId: string | number,
  options: LoadNoteWithAccessOptions = {},
): Promise<NoteAccessResult> {
  const { shareToken, userId, requireEdit = false } = options;

  const { data: note, error } = await supabase
    .from("notes")
    .select(NOTE_COLUMNS)
    .eq("id", noteId)
    .maybeSingle();

  if (error) throw new NoteContextError(error.message, 500);
  if (!note) throw new NoteContextError("Note not found", 404);

  const typedNote = note as Note;

  if (userId && note.user_id === userId) {
    const access: NoteAccess = "owner";
    assertCanEdit(access, requireEdit);
    return { note: typedNote, access };
  }

  if (
    shareToken &&
    note.share_token &&
    String(note.share_token) === String(shareToken) &&
    note.is_shared === true &&
    note.share_permission !== "private"
  ) {
    const access: NoteAccess =
      note.share_permission === "edit" ? "edit" : "view";
    assertCanEdit(access, requireEdit);
    return { note: typedNote, access };
  }

  if (userId) {
    const { data: share, error: shareError } = await supabase
      .from(TABLE_KEYS.NOTE_SHARES)
      .select("permission")
      .eq("note_id", noteId)
      .eq("shared_with_user_id", userId)
      .maybeSingle();

    if (shareError) throw new NoteContextError(shareError.message, 500);

    if (share) {
      const access: NoteAccess = share.permission === "edit" ? "edit" : "view";
      assertCanEdit(access, requireEdit);
      return { note: typedNote, access };
    }
  }

  throw new NoteContextError("Forbidden", 403);
}

export async function loadNoteForUser(
  supabase: SupabaseClient,
  noteId: string | number,
  userId: string,
  shareToken?: string | null,
): Promise<Note> {
  const { note } = await loadNoteWithAccess(supabase, noteId, {
    userId,
    shareToken,
  });
  return note;
}

export async function loadNoteFromSharedToken(
  supabase: SupabaseClient,
  shareToken: string,
): Promise<NoteAccessResult | null> {
  const { data: note, error } = await supabase
    .from("notes")
    .select(NOTE_COLUMNS)
    .eq("share_token", shareToken)
    .eq("is_shared", true)
    .neq("share_permission", "private")
    .maybeSingle();

  if (error) throw new NoteContextError(error.message, 500);
  if (!note) return null;

  const access: NoteAccess =
    note.share_permission === "edit" ? "edit" : "view";

  return { note: note as Note, access };
}

export function buildNoteChatSystemPrompt(note: Note): string {
  return `You are a helpful assistant that answers questions about a single note.
Answer only using the note content below. If the answer is not in the note, say you cannot find it in this note.
Keep answers concise and conversational.

Title: ${note.title}
Content:
${note.content || "(empty)"}`;
}
