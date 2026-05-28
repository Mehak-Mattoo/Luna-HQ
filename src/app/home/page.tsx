import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/server";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { authRoutes } from "@/app/routes";

export default async function Home() {
  return (
    <div className="flex justify-center items-center h-full gap-2 ">
      <p>home </p>
    </div>
  );
}
