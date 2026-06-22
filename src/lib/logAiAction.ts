import type { SupabaseClient } from "@supabase/supabase-js";

import { TABLE_KEYS } from "@/components/helpers/constants";

export type AiActionType = "chat" | "summarize_note" | "summarize_folder";

type LogAiActionParams = {
  userId: string;
  actionType: AiActionType;
  noteId?: string | number | null;
  folderId?: string | null;
};

export async function logAiAction(
  supabase: SupabaseClient,
  { userId, actionType, noteId, folderId }: LogAiActionParams,
) {
  const { error } = await supabase.from(TABLE_KEYS.AI_ACTIONS).insert({
    user_id: userId,
    action_type: actionType,
    note_id: noteId ?? null,
    folder_id: folderId ?? null,
  });

  if (error) {
    console.error("Failed to log AI action:", error.message);
  }
}
