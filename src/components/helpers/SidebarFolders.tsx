"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  FileText,
  Folder,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { notePath, protectedRoutes } from "@/components/helpers/routes";
import { NewFolder } from "@/components/modals/NewFolder";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  useDeleteFolder,
  useFolders,
  type Folder as FolderType,
} from "@/hooks/useFolders";
import { useNotes } from "@/hooks/useNotes";

function notesHref(folderId?: string, create?: boolean) {
  const params = new URLSearchParams();
  if (folderId) params.set("folder", folderId);
  if (create) params.set("create", "1");
  const query = params.toString();
  return query
    ? `${protectedRoutes.ALL_NOTES}?${query}`
    : protectedRoutes.ALL_NOTES;
}

export function SidebarFolders() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeFolderId = searchParams.get("folder");
  const { data: folders = [], isLoading: foldersLoading } = useFolders();
  const { data: allNotes = [] } = useNotes("all");

  const deleteFolder = useDeleteFolder();

  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);

  function openCreateFolderDialog() {
    setEditingFolder(null);
    setFolderDialogOpen(true);
  }

  function openRenameFolderDialog(folder: FolderType) {
    setEditingFolder(folder);
    setFolderDialogOpen(true);
  }

  function handleFolderDialogChange(open: boolean) {
    setFolderDialogOpen(open);
    if (!open) setEditingFolder(null);
  }

  const favoriteNotes = useMemo(
    () => allNotes.filter((note) => note.is_favorite),
    [allNotes],
  );

  const isAllNotesActive =
    pathname === protectedRoutes.ALL_NOTES && !activeFolderId;

  async function handleDeleteFolder(folder: FolderType) {
    try {
      await deleteFolder.mutateAsync(folder.id);
      toast.success("Folder deleted");
    } catch {
      toast.error("Failed to delete folder");
    }
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Favorites</SidebarGroupLabel>
        <SidebarGroupAction title="New note" asChild>
        
        </SidebarGroupAction>
        <SidebarGroupContent>
          <SidebarMenu>
            {favoriteNotes.length === 0 ? (
              <SidebarMenuItem>
                <SidebarMenuButton disabled className="text-muted-foreground">
                  <FileText className="size-4 opacity-50" />
                  <span>No favorites yet</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : (
              favoriteNotes.map((note) => (
                <SidebarMenuItem key={note.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === notePath(note)}
                    className="data-[active=true]:bg-violet-600/20 data-[active=true]:text-violet-300"
                  >
                    <Link href={notePath(note)}>
                      <FileText className="size-4" />
                      <span className="truncate">{note.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarSeparator />

      <SidebarGroup>
        <SidebarGroupLabel>My Folders</SidebarGroupLabel>
        <SidebarGroupAction title="New folder" onClick={openCreateFolderDialog}>
          <Plus className="size-4" />
        </SidebarGroupAction>
        <SidebarGroupContent>
          <SidebarMenu>
            {foldersLoading ? (
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <span className="text-muted-foreground">Loading…</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : folders.length === 0 ? (
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={openCreateFolderDialog}
                  className="text-muted-foreground"
                >
                  <Plus className="size-4" />
                  <span>Create a folder</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : (
              folders.map((folder) => (
                <SidebarMenuItem key={folder.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeFolderId === folder.id}
                    tooltip={folder.name}
                    className="data-[active=true]:bg-violet-600/20 data-[active=true]:text-violet-300"
                  >
                    <Link href={notesHref(folder.id)}>
                      <Folder className="size-4 text-foreground/70" />
                      <span className="truncate">{folder.name}</span>
                    </Link>
                  </SidebarMenuButton>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Folder actions</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      <DropdownMenuItem asChild>
                        <Link
                          href={notesHref(folder.id, true)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="size-4" />
                          Add note
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openRenameFolderDialog(folder)}
                        className="flex items-center gap-2"
                      >
                        <Pencil className="size-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => void handleDeleteFolder(folder)}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarSeparator />

      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isAllNotesActive}
                className="data-[active=true]:bg-accent/20 data-[active=true]:text-accent"
              >
                <Link href={protectedRoutes.ALL_NOTES}>
                  <FileText className="size-4" />
                  <span>All Notes</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {/* <SidebarMenuItem>
              <SidebarMenuButton
                disabled
                className="text-muted-foreground opacity-60"
                tooltip="Coming soon"
              >
                <Trash2 className="size-4" />
                <span>Trash</span>
              </SidebarMenuButton>
            </SidebarMenuItem> */}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <NewFolder
        open={folderDialogOpen}
        onOpenChange={handleFolderDialogChange}
        folder={editingFolder}
      />
    </>
  );
}
