import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { TABLE_KEYS } from "@/components/helpers/constants";

export type SharePermission = "view" | "edit";

export type NoteShare = {
  id: string;
  note_id: string | number;
  owner_id: string;
  shared_with_email: string;
  shared_with_user_id: string | null;
  permission: SharePermission;
  created_at: string;
};

export function useNoteShares(noteId: string | number | undefined) {
  return useQuery({
    queryKey: [TABLE_KEYS.NOTE_SHARES, noteId],
    queryFn: async (): Promise<NoteShare[]> => {
      const { data, error } = await supabase
        .from(TABLE_KEYS.NOTE_SHARES)
        .select("*")
        .eq("note_id", noteId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: noteId !== undefined && noteId !== "",
  });
}

export function useInviteToNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      email,
      permission = "view",
    }: {
      noteId: string | number;
      email: string;
      permission?: SharePermission;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const trimmed = email.trim().toLowerCase();
      if (!trimmed) throw new Error("Email is required");

      const { data, error } = await supabase
        .from(TABLE_KEYS.NOTE_SHARES)
        .insert({
          note_id: noteId,
          owner_id: user.id,
          shared_with_email: trimmed,
          permission,
        })
        .select()
        .single();

      if (error) throw error;
      return data as NoteShare;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [TABLE_KEYS.NOTE_SHARES, variables.noteId],
      });
    },
  });
}

export function useUpdateSharePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shareId,
      noteId,
      permission,
    }: {
      shareId: string;
      noteId: string | number;
      permission: SharePermission;
    }) => {
      const { data, error } = await supabase
        .from(TABLE_KEYS.NOTE_SHARES)
        .update({ permission })
        .eq("id", shareId)
        .select()
        .single();

      if (error) throw error;
      return { data, noteId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [TABLE_KEYS.NOTE_SHARES, result.noteId],
      });
    },
  });
}

export function useRemoveShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      shareId,
      noteId,
    }: {
      shareId: string;
      noteId: string | number;
    }) => {
      const { error } = await supabase
        .from(TABLE_KEYS.NOTE_SHARES)
        .delete()
        .eq("id", shareId);

      if (error) throw error;
      return { noteId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [TABLE_KEYS.NOTE_SHARES, result.noteId],
      });
    },
  });
}

export function useUpdateNoteLinkShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      enabled,
      permission = "view",
    }: {
      noteId: string | number;
      enabled: boolean;
      permission?: SharePermission;
    }) => {
      const payload = enabled
        ? {
            share_token: crypto.randomUUID(),
            is_shared: true,
            share_permission: permission,
          }
        : {
            is_shared: false,
            share_permission: "private",
          };

      const { data, error } = await supabase
        .from("notes")
        .update(payload)
        .eq("id", noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TABLE_KEYS.NOTES] });
    },
  });
}
