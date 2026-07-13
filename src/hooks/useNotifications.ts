import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { TABLE_KEYS } from "@/components/helpers/constants";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/wrapper/AuthProvider";

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

export async function fetchNotifications(
  userId: string,
  limit = 20,
): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from(TABLE_KEYS.NOTIFICATIONS)
    .select(NOTIFICATION_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function fetchUnreadNotificationCount(
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from(TABLE_KEYS.NOTIFICATIONS)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
}

export function useNotifications(limit = 20) {
  const { userId, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, userId, "list", limit],
    queryFn: () => fetchNotifications(userId!, limit),
    enabled: !authLoading && !!userId,
  });
}

// export function useUnreadNotificationCount() {
//   const { userId, isLoading: authLoading } = useAuth();

//   return useQuery({
//     queryKey: [...NOTIFICATIONS_QUERY_KEY, userId, "unread-count"],
//     queryFn: () => fetchUnreadNotificationCount(userId!),
//     enabled: !authLoading && !!userId,
//   });
// }

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
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
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async () => {
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
