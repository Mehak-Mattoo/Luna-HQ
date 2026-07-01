import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { TABLE_KEYS } from "@/components/helpers/constants";
import type { Note } from "./useNotes";
import {
  linkInvitesForUser,
} from "@/lib/noteContextServer";
import {
  fetchFavoriteNoteIds,
  withFavoriteState,
} from "@/hooks/useNoteFavorites";

export type SharePermission = "view" | "edit";

export type NoteShare = {
  id: string | null;
  note_id: string | number;
  owner_id: string;
  shared_with_email: string;
  shared_with_user_id: string | null;
  permission: SharePermission;
  created_at: string;
};

function isValidNoteId(
  noteId: string | number | undefined | null,
): noteId is string | number {
  if (noteId === null || noteId === undefined || noteId === "") return false;
  if (noteId === "null" || noteId === "undefined") return false;
  const n = typeof noteId === "number" ? noteId : Number(noteId);
  return Number.isFinite(n);
}

/** Coerce note id for Postgres bigint columns (avoids eq.null / string "null"). */
export function normalizeNoteId(noteId: string | number): number {
  if (!isValidNoteId(noteId)) {
    throw new Error("Invalid note id");
  }
  return typeof noteId === "number" ? noteId : Number(noteId);
}

export function useNoteShares(noteId: string | number | undefined) {
  const normalizedId = isValidNoteId(noteId)
    ? normalizeNoteId(noteId)
    : null;

  return useQuery({
    queryKey: [TABLE_KEYS.NOTE_SHARES, normalizedId],
    queryFn: async (): Promise<NoteShare[]> => {
      const { data, error } = await supabase
        .from(TABLE_KEYS.NOTE_SHARES)
        .select("*")
        .eq("note_id", normalizedId!)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: normalizedId !== null,
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
          note_id: normalizeNoteId(noteId),
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
        queryKey: [TABLE_KEYS.NOTE_SHARES, normalizeNoteId(variables.noteId)],
      });
    },
  });
}

export function useUpdateSharePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      sharedWithEmail,
      permission,
    }: {
      noteId: string | number;
      sharedWithEmail: string;
      permission: SharePermission;
    }) => {
      const email = sharedWithEmail.trim().toLowerCase();
      if (!email) throw new Error("Invalid collaborator email");

      const { data, error } = await supabase
        .from(TABLE_KEYS.NOTE_SHARES)
        .update({ permission })
        .eq("note_id", normalizeNoteId(noteId))
        .eq("shared_with_email", email)
        .select()
        .single();

      if (error) throw error;
      return { data, noteId: normalizeNoteId(noteId) };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [TABLE_KEYS.NOTE_SHARES, result.noteId],
      });
      queryClient.invalidateQueries({
        queryKey: [TABLE_KEYS.NOTE_SHARES, "access", result.noteId],
      });
      queryClient.invalidateQueries({
        queryKey: [TABLE_KEYS.NOTE_SHARES, "shared-with-me"],
      });
    },
  });
}

export function useRemoveShare() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noteId,
      sharedWithEmail,
    }: {
      noteId: string | number;
      sharedWithEmail: string;
    }) => {
      const email = sharedWithEmail.trim().toLowerCase();
      if (!email) throw new Error("Invalid collaborator email");

      const { error } = await supabase
        .from(TABLE_KEYS.NOTE_SHARES)
        .delete()
        .eq("note_id", normalizeNoteId(noteId))
        .eq("shared_with_email", email);

      if (error) throw error;
      return { noteId: normalizeNoteId(noteId) };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: [TABLE_KEYS.NOTE_SHARES, result.noteId],
      });
      queryClient.invalidateQueries({
        queryKey: [TABLE_KEYS.NOTE_SHARES, "access", result.noteId],
      });
      queryClient.invalidateQueries({
        queryKey: [TABLE_KEYS.NOTE_SHARES, "shared-with-me"],
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
        .eq("id", normalizeNoteId(noteId))
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

export async function linkInvitesToCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await linkInvitesForUser(supabase, user.id, user.email);
}

async function fetchCollaboratorPermission(
  noteId: string | number,
): Promise<SharePermission | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isValidNoteId(noteId)) return null;

  const normalizedId = normalizeNoteId(noteId);

  const { data: byUserId, error: byUserIdError } = await supabase
    .from(TABLE_KEYS.NOTE_SHARES)
    .select("permission")
    .eq("note_id", normalizedId)
    .eq("shared_with_user_id", user.id)
    .maybeSingle();

  if (byUserIdError) throw byUserIdError;
  if (byUserId?.permission) return byUserId.permission;

  const email = user.email?.trim().toLowerCase() ?? "";
  if (!email) return null;

  const { data: byEmail, error: byEmailError } = await supabase
    .from(TABLE_KEYS.NOTE_SHARES)
    .select("permission")
    .eq("note_id", normalizedId)
    .eq("shared_with_email", email)
    .maybeSingle();

  if (byEmailError) throw byEmailError;
  return byEmail?.permission ?? null;
}

/** Live collaborator permission for a shared note (client-side refresh). */
export function useCollaboratorAccess(noteId: string | number | undefined) {
  const normalizedId = isValidNoteId(noteId)
    ? normalizeNoteId(noteId)
    : null;

  return useQuery({
    queryKey: [TABLE_KEYS.NOTE_SHARES, "access", normalizedId],
    queryFn: () => fetchCollaboratorPermission(normalizedId!),
    enabled: normalizedId !== null,
  });
}

export type SharedWithMeNote = {
  shareId: string;
  permission: "view" | "edit";
  sharedAt: string;
  note: Note;
};

export function useSharedWithMeNotes() {
  return useQuery({
    queryKey: [TABLE_KEYS.NOTE_SHARES, "shared-with-me"],
    queryFn: async (): Promise<SharedWithMeNote[]> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      await linkInvitesToCurrentUser();

      const email = user.email?.trim().toLowerCase() ?? "";

      let query = supabase
        .from(TABLE_KEYS.NOTE_SHARES)
        .select(
          `
          id,
          permission,
          created_at,
          notes (
            id, title, content, user_id, folder_id, folder_name,
            is_favorite, attachment_path, attachment_name, attachment_mime,
            created_at, share_token, is_shared, share_permission
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (email) {
        query = query.or(
          `shared_with_user_id.eq.${user.id},shared_with_email.eq.${email}`,
        );
      } else {
        query = query.eq("shared_with_user_id", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const favoriteIds = await fetchFavoriteNoteIds(user.id);

      return (data ?? [])
        .filter((row) => row.notes)
        .map((row) => ({
          shareId: row.id,
          permission: row.permission,
          sharedAt: row.created_at,
          note: withFavoriteState(
            [row.notes as unknown as Note],
            favoriteIds,
          )[0],
        }));
    },
  });
}
