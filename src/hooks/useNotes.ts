import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { TABLE_KEYS } from "@/components/helpers/constants";
import { BUCKET } from "@/components/helpers/constants";

export type NoteFormPayload = {
  title: string;
  content: string;
  file?: File | null;
};

export interface Note {
  id: string | number;
  user_id: string;
  title: string;
  content: string;
  is_favorite: boolean;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_mime: string | null;
  folder_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export type NotesFilter = "all" | "uncategorized" | string;

const fetchNotes = async (filter: NotesFilter = "all"): Promise<Note[]> => {
  let query = supabase
    .from(TABLE_KEYS.NOTES)
    .select("*")
    .order("created_at", { ascending: false });

  if (filter === "uncategorized") {
    query = query.is("folder_id", null);
  } else if (filter !== "all") {
    query = query.eq("folder_id", filter);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return data ?? [];
};

export function useNotes(filter: NotesFilter = "all") {
  return useQuery<Note[]>({
    queryKey: [TABLE_KEYS.NOTES, filter],
    queryFn: () => fetchNotes(filter),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newNote: {
      title: string;
      content: string;
      folder_id?: string | null;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from(TABLE_KEYS.NOTES)
        .insert([
          {
            title: newNote.title,
            content: newNote.content,
            folder_id: newNote.folder_id ?? null,
            user_id: user.id,
            is_favorite: false,
          },
        ])
        .select();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TABLE_KEYS.NOTES] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (note: Note) => {
      const { data, error } = await supabase
        .from(TABLE_KEYS.NOTES)
        .update({
          title: note.title,
          content: note.content,
          folder_id: note.folder_id ?? null,
          is_favorite: note.is_favorite,
        })
        .eq("id", note.id)
        .select();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TABLE_KEYS.NOTES] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      const { data, error } = await supabase
        .from(TABLE_KEYS.NOTES)
        .delete()
        .eq("id", id)
        .select("id");

      if (error) {
        throw new Error("Delete blocked — 0 rows removed (check RLS or id)");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TABLE_KEYS.NOTES] });
    },
  });
}

export async function uploadFileWithinNote(
  file: File,
  noteId: string | number,
  userId: string,
) {
  const path = `${userId}/${noteId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(
      `Storage upload failed: ${uploadError.message}. Ensure the "${BUCKET}" bucket exists and storage policies allow uploads.`,
    );
  }

  const { data, error: dbError } = await supabase
    .from(TABLE_KEYS.NOTES)
    .update({
      attachment_path: path,
      attachment_name: file.name,
      attachment_mime: file.type,
    })
    .eq("id", noteId)
    .select("id, attachment_path, attachment_name, attachment_mime")
    .single();

  if (dbError) {
    throw new Error(`Failed to save attachment metadata: ${dbError.message}`);
  }

  if (!data) {
    throw new Error(
      "Attachment metadata was not saved (check notes table UPDATE RLS policies).",
    );
  }

  return path;
}

export function useUploadNoteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      noteId,
      userId,
    }: {
      file: File;
      noteId: string | number;
      userId: string;
    }) => uploadFileWithinNote(file, noteId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TABLE_KEYS.NOTES] });
    },
  });
}
