import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { TABLE_KEYS } from "@/components/helpers/constants";
import { supabase } from "@/lib/supabase";

export const NOTIFICATIONS_QUERY_KEY = [TABLE_KEYS.NOTIFICATIONS] as const;

export type NotificationType = "note_shared";

export type AppNotification = {
  id: string;
  user_id: string;
  type: NotificationType;
  note_id: number | null;
  from_user_id: string | null;
  message: string | null;
  read_at: string | null;
  created_at: string;
};

const NOTIFICATION_COLUMNS =
  "id, user_id, type, note_id, from_user_id, message, read_at, created_at";

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function fetchNotifications(
  limit = 20,
): Promise<AppNotification[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from(TABLE_KEYS.NOTIFICATIONS)
    .select(NOTIFICATION_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const userId = await getCurrentUserId();
  if (!userId) return 0;

  const { count, error } = await supabase
    .from(TABLE_KEYS.NOTIFICATIONS)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
}

export function useNotifications(limit = 20) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, "list", limit],
    queryFn: () => fetchNotifications(limit),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, "unread-count"],
    queryFn: fetchUnreadNotificationCount,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from(TABLE_KEYS.NOTIFICATIONS)
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("user_id", userId)
        .is("read_at", null)
        .select(NOTIFICATION_COLUMNS)
        .maybeSingle();

      if (error) throw error;
      return data as AppNotification | null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error("Not authenticated");

      const { error } = await supabase
        .from(TABLE_KEYS.NOTIFICATIONS)
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("read_at", null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}
