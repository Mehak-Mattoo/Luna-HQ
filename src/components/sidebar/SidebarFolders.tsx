"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  File,
  FileText,
  Folder,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { notePath, protectedRoutes } from "@/app/routes";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  useDeleteFolder,
  useFolders,
  type Folder as FolderType,
} from "@/hooks/useFolders";
import { useNotes } from "@/hooks/useNotes";
import { cn } from "@/lib/utils";

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

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
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

  const notesByFolder = useMemo(() => {
    const map = new Map<string, typeof allNotes>();
    for (const folder of folders) {
      map.set(folder.id, []);
    }
    const uncategorized: typeof allNotes = [];
    for (const note of allNotes) {
      if (note.folder_id && map.has(note.folder_id)) {
        map.get(note.folder_id)!.push(note);
      } else if (!note.folder_id) {
        uncategorized.push(note);
      }
    }
    return { map, uncategorized };
  }, [folders, allNotes]);

  function isExpanded(folderId: string) {
    return expanded[folderId] ?? activeFolderId === folderId;
  }

  function toggleFolder(folderId: string) {
    setExpanded((prev) => ({
      ...prev,
      [folderId]: !isExpanded(folderId),
    }));
  }

  async function handleDeleteFolder(folder: FolderType) {
    // const confirmed = window.confirm(
    //   `Delete "${folder.name}"? Notes inside will move to Uncategorized.`,
    // );
    // if (!confirmed) return;

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
        <SidebarGroupLabel>Folders</SidebarGroupLabel>
        <SidebarGroupAction title="New folder" onClick={openCreateFolderDialog}>
          <Plus className="size-4" />
        </SidebarGroupAction>
        <SidebarGroupContent>
          <SidebarMenu>
            {foldersLoading ? (
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <span className="text-xs text-muted-foreground">
                    Loading folders…
                  </span>
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
              folders.map((folder) => {
                const folderNotes = notesByFolder.map.get(folder.id) ?? [];
                const open = isExpanded(folder.id);

                return (
                  <SidebarMenuItem key={folder.id} className=" items-center">
                    <SidebarMenuButton
                      asChild
                      isActive={activeFolderId === folder.id}
                      tooltip={folder.name}
                      className="flex-1"
                    >
                      <Link href={notesHref(folder.id)}>
                        <ChevronRight
                          className={cn(
                            "size-4 transition-transform",
                            open && "rotate-90",
                          )}
                          onClick={() => toggleFolder(folder.id)}
                        />
                        <h6 className="truncate">{folder.name}</h6>
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
                          onClick={() => handleDeleteFolder(folder)}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {open && (
                      <SidebarMenuSub>
                        {folderNotes.length === 0 ? (
                          <SidebarMenuSubItem>
                            <SidebarMenuSubButton className="text-muted-foreground">
                              <span className="text-xs">No notes yet</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ) : (
                          folderNotes.map((note) => (
                            <SidebarMenuSubItem key={note.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === notePath(note)}
                              >
                                <Link href={notePath(note)}>
                                  <FileText className="size-3.5" />
                                  <h6>{note.title}</h6>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))
                        )}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {notesByFolder.uncategorized.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Uncategorized</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {notesByFolder.uncategorized.map((note) => (
                <SidebarMenuItem key={note.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === notePath(note)}
                    tooltip={note.title}
                  >
                    <Link href={notePath(note)}>
                      <File className="size-4" />
                      <h6 className="truncate">{note.title}</h6>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      <NewFolder
        open={folderDialogOpen}
        onOpenChange={handleFolderDialogChange}
        folder={editingFolder}
      />
    </>
  );
}
