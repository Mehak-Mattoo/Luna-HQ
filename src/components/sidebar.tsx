"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { Suspense, useState } from "react";
import { SidebarFolders } from "@/components/helpers/SidebarFolders";
import { PanelLeft, PanelLeftClose, PlusCircle, Search } from "lucide-react";
import SearchModal from "./modals/SearchModal";

export function AppSidebar() {
  const { isMobile, setOpen, open } = useSidebar();
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  return (
    <>
    <Sidebar
      collapsible="icon"
      // onMouseEnter={() => {
      //   if (!isMobile) setOpen(true);
      // }}
      // onMouseLeave={() => {
      //   if (!isMobile) setOpen(false);
      // }}
    >
      <SidebarMenuButton className="justify-end ">
        <PanelLeft
          className="size-5 text-primary"
          onClick={() => setOpen(!open)}
        />
      </SidebarMenuButton>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem className="flex justify-between gap-2">
              <SidebarMenuButton>
                <PlusCircle className="size-5 text-primary" />
                <span>New Note</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setSearchModalOpen(true)}>
                <Search className="size-5 text-tertiary" />
                <span>Search</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarContent>
        <Suspense fallback={null}>
          <SidebarFolders />
        </Suspense>
      </SidebarContent>
    </Sidebar>
    <SearchModal open={searchModalOpen} onOpenChange={setSearchModalOpen} />
    </>
  );
}
