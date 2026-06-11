"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

import { Suspense } from "react";
import { SidebarFolders } from "@/components/helpers/SidebarFolders";

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
        <Suspense fallback={null}>
          <SidebarFolders />
        </Suspense>
      </SidebarContent>
    </Sidebar>
  );
}
