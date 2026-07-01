"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authRoutes } from "@/components/helpers/routes";
import { supabase } from "@/lib/supabase";

export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    router.push(authRoutes.LOGIN);
  };
}
