"use client";

import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Settings,
  Bell,
  ChevronUp,
  User,
  LogOut,
  StickyNote,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";
import { authRoutes, protectedRoutes } from "@/app/routes";
import { getInitials } from "@/lib/constants/constants";
import { Suspense } from "react";
import { SidebarFolders } from "@/components/sidebar/SidebarFolders";

const navItems = [{ label: "Home", icon: Home, href: protectedRoutes.HOME }];

interface AppSidebarProps {
  email: string;
  name?: string;
  avatar?: string;
}

export function AppSidebar({ email, name, avatar }: AppSidebarProps) {
  const router = useRouter();
  const initials = getInitials(name ?? "");
  const { isMobile, setOpen } = useSidebar();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(authRoutes.LOGIN);
  }

  return (
    <Sidebar
      collapsible="icon"
      // onMouseEnter={() => {
      //   if (!isMobile) setOpen(true);
      // }}
      // onMouseLeave={() => {
      //   if (!isMobile) setOpen(false);
      // }}
    >
      <SidebarHeader />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ label, icon: Icon, href }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton asChild tooltip={label}>
                    <Link href={href}>
                      <Icon className="size-4" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Suspense fallback={null}>
          <SidebarFolders />
        </Suspense>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" tooltip={name}>
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={avatar} alt={name} />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col gap-1 text-left">
                    <span className="truncate font-semibold">{name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent side="top" align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link
                    href={protectedRoutes.PROFILE}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <User className="size-4" />
                    View Profile
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="flex cursor-pointer items-center gap-2 text-destructive "
                  onClick={handleSignOut}
                >
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
