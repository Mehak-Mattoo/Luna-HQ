import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { TABLE_KEYS } from "@/components/helpers/constants";
import { useAuth } from "@/components/wrapper/AuthProvider";

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string | null;
}

export const fetchFolders = async (userId: string): Promise<Folder[]> => {
  const { data, error } = await supabase
    .from(TABLE_KEYS.FOLDERS)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    throw error;
  }
  return data ?? [];
};

export function useFolders() {
  const { userId, isLoading: authLoading } = useAuth();

  return useQuery<Folder[]>({
    queryKey: [TABLE_KEYS.FOLDERS, userId],
    queryFn: () => fetchFolders(userId!),
    enabled: !authLoading && !!userId,
  });
}

export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (newFolder: { name: string }) => {
      if (!userId) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from(TABLE_KEYS.FOLDERS)
        .insert([
          {
            name: newFolder.name.trim(),
            user_id: userId,
          },
        ])
        .select();
      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TABLE_KEYS.FOLDERS] });
    },
  });
};

export const useUpdateFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from(TABLE_KEYS.FOLDERS)
        .update({
          name: name.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TABLE_KEYS.FOLDERS] });
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from(TABLE_KEYS.FOLDERS)
        .delete()
        .eq("id", id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TABLE_KEYS.FOLDERS] });
      queryClient.invalidateQueries({ queryKey: [TABLE_KEYS.NOTES] });
    },
  });
};
