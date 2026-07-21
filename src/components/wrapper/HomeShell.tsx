"use client";

import type { ReactNode } from "react";

import { AppSidebar } from "@/components/sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppNavbar } from "@/components/wrapper/AppNavbar";
import { NoteChatLayoutPanel } from "@/components/wrapper/NoteChatLayoutPanel";

export function HomeShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
        <AppSidebar />
        <div className="flex min-h-svh min-w-0 flex-1">
          <SidebarInset className="min-w-0 flex-1">
            <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center gap-2 border-b border-border px-4 backdrop-blur supports-backdrop-filter:bg-background/60 sm:px-6 ">
              <SidebarTrigger className="md:hidden" />
              <AppNavbar />
            </header>
            <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8 ">
              {children}
            </div>
          </SidebarInset>

          <NoteChatLayoutPanel />
        </div>
    </SidebarProvider>
  );
}
