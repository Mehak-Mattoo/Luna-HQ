import { useQuery, useQueryClient } from "@tanstack/react-query";

import { TABLE_KEYS } from "@/components/helpers/constants";
import { supabase } from "@/lib/supabase";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const AI_ACTIONS_QUERY_KEY = [TABLE_KEYS.AI_ACTIONS] as const;

async function fetchAiActionStats() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthStart = startOfMonth.toISOString();
  const weekStart = new Date(Date.now() - WEEK_MS).toISOString();

  const [monthRes, weekRes] = await Promise.all([
    supabase
      .from(TABLE_KEYS.AI_ACTIONS)
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart),
    supabase
      .from(TABLE_KEYS.AI_ACTIONS)
      .select("*", { count: "exact", head: true })
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
  return useQuery({
    queryKey: AI_ACTIONS_QUERY_KEY,
    queryFn: fetchAiActionStats,
  });
}

export function useInvalidateAiActions() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: AI_ACTIONS_QUERY_KEY });
}
