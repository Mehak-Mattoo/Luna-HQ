import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import type { SupabaseClient } from "@supabase/supabase-js";
import { noteSummarySchema } from "@/lib/schema/noteSummary";
import { MODEL_NAME, TABLE_KEYS } from "@/components/helpers/constants";
import { SummarizeNoteError } from "@/lib/summarizeNoteServer";

const MAX_NOTE_CHARS = 2000;

function buildFolderInstruction(
  folderName: string,
  notes: { title: string; content: string }[],
) {
  const noteBlocks = notes
    .map(
      (note, i) =>
        `Note ${i + 1} — "${note.title}":\n${note.content.slice(0, MAX_NOTE_CHARS)}`,
    )
    .join("\n\n");
  return `Summarize all notes in the folder "${folderName}".
Give one overall summary sentence and about 3–5 bullet points covering themes across all notes.
${noteBlocks}`;
}

export const summarizeFolderForUser = async (
  supabase: SupabaseClient,
  folderId: string,
  userId: string,
) => {
  const { data: folder, error } = await supabase
    .from(TABLE_KEYS.FOLDERS)
    .select("id, name, user_id")
    .eq("id", folderId)
    .single();

  if (error || !folder) {
    throw new SummarizeNoteError("Folder not found", 404);
  }

  if (folder.user_id !== userId) {
    throw new SummarizeNoteError("Forbidden", 403);
  }

  // 2. Load all notes in folder
  const { data: notes, error: notesError } = await supabase
    .from(TABLE_KEYS.NOTES)
    .select("id, title, content, user_id")
    .eq("folder_id", folderId)
    .order("created_at", { ascending: true });

  if (notesError) {
    throw new SummarizeNoteError("Failed to load notes", 500);
  }

  if (!notes || notes.length === 0) {
    throw new SummarizeNoteError("Folder has no notes to summarize", 400);
  }

  // 3. Build prompt and call AI
  const instruction = buildFolderInstruction(folder.name, notes);
  const { object } = await generateObject({
    model: google(MODEL_NAME),
    schema: noteSummarySchema,
    prompt: instruction,
  });
  return object;
};
