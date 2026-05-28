import { AppSidebar } from "@/components/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/lib/server";
import { authRoutes } from "../routes";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { redirect } from "next/navigation";

const Navbar = () => {
  return (
    <div className="flex w-full justify-between items-center h-fit  gap-2 px-2 py-4">
      <div>Logo</div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
      </div>
    </div>
  );
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.email) {
    redirect(authRoutes.LOGIN);
  }
  return (
    <div className="w-full">
      <SidebarProvider>
        <AppSidebar
          email={data.claims.email}
          name={data.claims.name}
          avatar={data.claims.avatar_url || data.claims.picture}
        />
        <main className="flex flex-col flex-1 w-full ">
          <div className="flex w-full items-center border-b">
            <SidebarTrigger  />
            <Navbar />
          </div>
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
}
