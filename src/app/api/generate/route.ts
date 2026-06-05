import { aiRateLimit } from "@/lib/rateLimit/rateLimit";
import {
  SummarizeNoteError,
  summarizeNoteForUser,
} from "@/lib/summarizeNoteServer";
import { createClient } from "@/lib/server";

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

  let noteId: string | number;
  try {
    const body = await req.json();
    noteId = body.noteId;
    if (noteId === undefined || noteId === null || noteId === "") {
      return Response.json({ error: "noteId is required" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const object = await summarizeNoteForUser(supabase, noteId, user.id);
    return Response.json(object);
  } catch (err) {
    if (err instanceof SummarizeNoteError) {
      return Response.json({ error: err.message }, { status: err.status });
    }

    console.error("summarizeNoteForUser failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 500 },
    );
  }
}
