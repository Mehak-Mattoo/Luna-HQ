import { useQuery, useQueryClient } from "@tanstack/react-query";

import { TABLE_KEYS } from "@/components/helpers/constants";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/wrapper/AuthProvider";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const AI_ACTIONS_QUERY_KEY = [TABLE_KEYS.AI_ACTIONS] as const;

async function fetchAiActionStats(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthStart = startOfMonth.toISOString();
  const weekStart = new Date(Date.now() - WEEK_MS).toISOString();

  const [monthRes, weekRes] = await Promise.all([
    supabase
      .from(TABLE_KEYS.AI_ACTIONS)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", monthStart),
    supabase
      .from(TABLE_KEYS.AI_ACTIONS)
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", weekStart),
  ]);

  if (monthRes.error) throw monthRes.error;
  if (weekRes.error) throw weekRes.error;

  return {
    thisMonth: monthRes.count ?? 0,
    thisWeek: weekRes.count ?? 0,
  };
}

export function useAiActionStats() {
  const { userId, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: [...AI_ACTIONS_QUERY_KEY, userId],
    queryFn: () => fetchAiActionStats(userId!),
    enabled: !authLoading && !!userId,
  });
}

export function useInvalidateAiActions() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: AI_ACTIONS_QUERY_KEY });
}
