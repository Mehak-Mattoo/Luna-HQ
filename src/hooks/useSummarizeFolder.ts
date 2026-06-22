import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRoutes } from "@/components/helpers/routes";
import { noteSummarySchema, type NoteSummary } from "@/lib/schema/noteSummary";
import { AI_ACTIONS_QUERY_KEY } from "@/hooks/useAIActions";

export type { NoteSummary };

async function summarizeFolder(folderId: string): Promise<NoteSummary> {
  const res = await fetch(apiRoutes.GENERATE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folderId: folderId }),
  });

  if (res.status === 429) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error ?? "Too many requests. Please wait and try again.",
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "AI request failed");
  }

  const data = await res.json();
  return noteSummarySchema.parse(data);
}

export function useSummarizeFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["summarize-folder"],
    mutationFn: summarizeFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_ACTIONS_QUERY_KEY });
    },
  });
}
