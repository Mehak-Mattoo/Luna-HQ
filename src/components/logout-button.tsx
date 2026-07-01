"use client";

import { Button } from "@/components/ui/button";
import { useSignOut } from "@/hooks/useSignOut";

export function LogoutButton() {
  const signOut = useSignOut();

  return <Button onClick={signOut}>Logout</Button>;
}
