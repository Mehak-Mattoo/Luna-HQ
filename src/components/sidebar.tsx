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

import { Home } from "lucide-react";
import { protectedRoutes } from "@/components/helpers/routes";
import { Suspense } from "react";
import { SidebarFolders } from "@/components/helpers/SidebarFolders";

const navItems = [{ label: "Home", icon: Home, href: protectedRoutes.HOME }];

export function AppSidebar() {
  const { isMobile, setOpen } = useSidebar();

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
    </Sidebar>
  );
}
