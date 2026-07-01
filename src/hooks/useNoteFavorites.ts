import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { TABLE_KEYS } from "@/components/helpers/constants";
import { supabase } from "@/lib/supabase";

export const NOTE_FAVORITES_QUERY_KEY = [TABLE_KEYS.NOTE_FAVORITES] as const;

export async function fetchFavoriteNoteIds(
  userId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from(TABLE_KEYS.NOTE_FAVORITES)
    .select("note_id")
    .eq("user_id", userId);

  if (error) throw error;

  return new Set((data ?? []).map((row) => String(row.note_id)));
}

export function withFavoriteState<T extends { id: string | number }>(
  items: T[],
  favoriteIds: Set<string>,
): (T & { is_favorite: boolean })[] {
  return items.map((item) => ({
    ...item,
    is_favorite: favoriteIds.has(String(item.id)),
  }));
}

export function useFavoriteNoteIds() {
  return useQuery({
    queryKey: NOTE_FAVORITES_QUERY_KEY,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return new Set<string>();
      return fetchFavoriteNoteIds(user.id);
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      favorited,
    }: {
      noteId: string | number;
      favorited: boolean;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (favorited) {
        const { error } = await supabase.from(TABLE_KEYS.NOTE_FAVORITES).upsert(
          { user_id: user.id, note_id: noteId },
          { onConflict: "user_id,note_id" },
        );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(TABLE_KEYS.NOTE_FAVORITES)
          .delete()
          .eq("user_id", user.id)
          .eq("note_id", noteId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTE_FAVORITES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [TABLE_KEYS.NOTES] });
    },
  });
}
