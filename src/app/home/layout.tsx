import { HomeShell } from "@/components/wrapper/HomeShell";
import { linkInvitesForUser } from "@/lib/noteContextServer";
import { createClient } from "@/lib/server";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await linkInvitesForUser(supabase, user.id, user.email);
  }

  return (
    <div className="w-full">
      <HomeShell>{children}</HomeShell>
    </div>
  );
}
