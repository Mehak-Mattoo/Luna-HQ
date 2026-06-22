import { aiRateLimit } from "@/lib/rateLimit/rateLimit";
import {
  SummarizeNoteError,
  summarizeNoteForUser,
} from "@/lib/summarizeNoteServer";
import { createClient } from "@/lib/server";
import { logAiAction } from "@/lib/logAiAction";
import { summarizeFolderForUser } from "@/lib/summarizeFolderServer";

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

 let body: { noteId?: string | number; folderId?: string };
 try {
   body = await req.json();
 } catch {
   return Response.json({ error: "Invalid request body" }, { status: 400 });
 }

 try {
   if (body.folderId) {
     const object = await summarizeFolderForUser(
       supabase,
       body.folderId,
       user.id,
     );

     await logAiAction(supabase, {
       userId: user.id,
       actionType: "summarize_folder",
       folderId: body.folderId,
     });

     return Response.json(object);
   }

   if (body.noteId) {
     const object = await summarizeNoteForUser(supabase, body.noteId, user.id);

     await logAiAction(supabase, {
       userId: user.id,
       actionType: "summarize_note",
       noteId: body.noteId,
     });

     return Response.json(object);
   }

   return Response.json(
     { error: "noteId or folderId is required" },
     { status: 400 },
   );
 } catch (err) {
   if (err instanceof SummarizeNoteError) {
     return Response.json({ error: err.message }, { status: err.status });
   }

   console.error("summarize failed:", err);
   return Response.json(
     { error: err instanceof Error ? err.message : "AI request failed" },
     { status: 500 },
   );
 }
}
