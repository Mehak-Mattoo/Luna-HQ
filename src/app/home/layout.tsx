import { AppSidebar } from "@/components/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/lib/server";
import { authRoutes } from "../../components/helpers/routes";
import { getProfileFromUser } from "@/lib/profileUtils";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {


  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8 ">
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-col flex-1 w-full ">
          <SidebarTrigger className="md:hidden" />
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
}
