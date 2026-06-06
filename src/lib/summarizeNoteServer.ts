import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import type { SupabaseClient } from "@supabase/supabase-js";
import { noteSummarySchema, type NoteSummary } from "@/lib/schema/noteSummary";
import { BUCKET, MODEL_NAME } from "./constants/constants";
import { Note } from "@/hooks/useNotes";

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

type AttachmentFile = {
  data: Buffer;
  mediaType: string;
  name: string;
};

export class SummarizeNoteError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function loadAttachment(
  supabase: SupabaseClient,
  note: Note,
): Promise<AttachmentFile | null> {
  if (!note.attachment_path || !note.attachment_mime) {
    return null;
  }

  const mime = note.attachment_mime;
  const isPdf = mime === "application/pdf";
  const isImage = mime.startsWith("image/");

  if (!isPdf && !isImage) {
    return null;
  }

  const { data: file, error } = await supabase.storage
    .from(BUCKET)
    .download(note.attachment_path);

  if (error || !file) {
    throw new SummarizeNoteError("Failed to load attachment", 500);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.byteLength > MAX_ATTACHMENT_BYTES) {
    throw new SummarizeNoteError(
      "Attachment too large to summarize (max 10 MB)",
      400,
    );
  }

  return {
    data: buffer,
    mediaType: mime,
    name: note.attachment_name ?? "attachment",
  };
}

function buildTextInstruction(note: Note, attachment: AttachmentFile | null) {
  if (attachment?.mediaType === "application/pdf") {
    return `Summarize this note titled "${note.title}".

User-written content:
${note.content}

Read the attached PDF ("${attachment.name}") and combine it with the note content into one coherent summary with about 3 bullet points.`;
  }

  if (attachment?.mediaType.startsWith("image/")) {
    return `Summarize this note titled "${note.title}".

User-written content:
${note.content }

Read the attached image ("${attachment.name}") and combine it with the note content into one coherent summary with about 3 bullet points.`;
  }

  return `Summarize this note in about 3 concise bullet points.

Title: ${note.title}
Content: ${note.content}`;
}

export async function summarizeNoteForUser(
  supabase: SupabaseClient,
  noteId: string | number,
  userId: string,
): Promise<NoteSummary> {
  const { data: note, error } = await supabase
    .from("notes")
    .select(
      "id, title, content, attachment_path, attachment_name, attachment_mime, user_id",
    )
    .eq("id", noteId)
    .single();

  if (!note) {
    throw new SummarizeNoteError("Note not found", 404);
  }

  if (note.user_id !== userId) {
    throw new SummarizeNoteError("Forbidden", 403);
  }

  const attachment = await loadAttachment(supabase, note as Note);
  const instruction = buildTextInstruction(note as Note, attachment);

  if (attachment) {
    const { object } = await generateObject({
      model: google(MODEL_NAME),
      schema: noteSummarySchema,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: instruction },
            {
              type: "file",
              data: attachment.data,
              mediaType: attachment.mediaType,
            },
          ],
        },
      ],
    });

    return object;
  }

  const { object } = await generateObject({
    model: google(MODEL_NAME),
    schema: noteSummarySchema,
    prompt: instruction,
  });

  return object;
}
