import { useMutation } from "@tanstack/react-query";
import type { Note } from "@/hooks/useNotes";
import { apiRoutes } from "@/app/routes";
import {
  noteSummarySchema,
  type NoteSummary,
} from "@/lib/schema/noteSummary";

export type { NoteSummary };

async function summarizeNote(note: Note): Promise<NoteSummary> {
  const res = await fetch(apiRoutes.GENERATE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ noteId: note.id }),
  });

  if (res.status === 429) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error ?? "Too many requests. Please wait and try again.",
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "AI request failed");
  }

  const data = await res.json();
  return noteSummarySchema.parse(data);
}

export function useSummarizeNote() {
  return useMutation({
    mutationKey: ["summarize-note"],
    mutationFn: summarizeNote,
  });
}
