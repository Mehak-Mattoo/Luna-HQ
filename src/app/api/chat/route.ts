import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { google } from "@ai-sdk/google";
import { aiRateLimit } from "@/lib/rateLimit/rateLimit";
import {
  buildNoteChatSystemPrompt,
  loadNoteForUser,
  NoteContextError,
} from "@/lib/noteContextServer";
import { createClient } from "@/lib/server";
import { MODEL_NAME } from "@/lib/constants/constants";

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success, limit, remaining, reset } = await aiRateLimit.limit(user.id);

  if (!success) {
    return Response.json(
      {
        error: "Rate limit exceeded. Try again later.",
        limit,
        remaining,
        reset,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
        },
      },
    );
  }

  let body: { messages?: UIMessage[]; noteId?: string | number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { messages, noteId } = body;

  if (noteId === undefined || noteId === null || noteId === "") {
    return Response.json({ error: "noteId is required" }, { status: 400 });
  }

  if (!messages?.length) {
    return Response.json({ error: "messages are required" }, { status: 400 });
  }

  try {
    const note = await loadNoteForUser(supabase, noteId, user.id);

    const result = streamText({
      model: google(MODEL_NAME),
      system: buildNoteChatSystemPrompt(note),
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    if (err instanceof NoteContextError) {
      return Response.json({ error: err.message }, { status: err.status });
    }

    console.error("chat route failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Chat request failed" },
      { status: 500 },
    );
  }
}
