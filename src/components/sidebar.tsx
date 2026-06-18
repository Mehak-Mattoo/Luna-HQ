"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { SidebarFolders } from "@/components/helpers/SidebarFolders";
import SearchModal from "@/components/modals/SearchModal";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { notePath } from "@/components/helpers/routes";
import { useCreateNote } from "@/hooks/useNotes";

export function AppSidebar() {
  const router = useRouter();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const createNote = useCreateNote();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchModalOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleNewNote() {
    const created = await createNote.mutateAsync({
      title: "Untitled",
      content: "",
      folder_id: null,
    });
    if (created?.[0]) {
      router.push(notePath(created[0]));
    }
  }

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-border/60 ">
        <SidebarHeader className="gap-3 p-3">
          <SidebarMenu className="flex flex-col gap-3">
            <SidebarMenuItem>
              <div className="flex w-full items-center rounded-lg px-1 bg-accent text-background">
                <SidebarMenuButton
                  className="flex-1 "
                  onClick={() => void handleNewNote()}
                  disabled={createNote.isPending}
                >
                  <h6>New Note</h6>
                </SidebarMenuButton>
                <div
                  // size="icon"
                  className="size-9 shrink-0 flex items-center justify-center "
                  onClick={() => void handleNewNote()}
                  // disabled={createNote.isPending}
                >
                  <Plus className="size-5" />
                </div>
              </div>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-violet-500/30 hover:bg-muted/40"
              >
                <span className="flex items-center gap-2">
                  <Search className="size-4 shrink-0" />
                  <span className="truncate group-data-[collapsible=icon]:hidden">
                    Search
                  </span>
                </span>
                <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium group-data-[collapsible=icon]:hidden md:inline-block">
                  ⌘ K
                </kbd>
              </button>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="px-1">
          <Suspense fallback={null}>
            <SidebarFolders />
          </Suspense>
        </SidebarContent>
      </Sidebar>

      <SearchModal open={searchModalOpen} onOpenChange={setSearchModalOpen} />
    </>
  );
}
