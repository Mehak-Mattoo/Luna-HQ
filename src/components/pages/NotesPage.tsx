"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Grid3X3, LayoutList, Plus, Star } from "lucide-react";
import { notePath } from "@/components/helpers/routes";
import { getFolderTagStyle } from "@/components/helpers/constants";
import { formatUIFriendlyDate } from "@/components/helpers/constants";
import { Button } from "../ui/button";
import {
  useCreateNote,
  useNotes,
  useUpdateNote,
  type Note,
  type NotesFilter,
} from "@/hooks/useNotes";
import { useFolders } from "@/hooks/useFolders";
import { useNoteChatPanel } from "@/components/wrapper/NoteChatContext";
import { LunaButton } from "../ui/LunaButton";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";
type ContentTab = "all" | "notes" | "files";

function NoteCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="mt-3 h-3 w-1/3" />
      <Skeleton className="mt-4 h-10 w-full" />
    </div>
  );
}

type NoteCardProps = {
  note: Note;
  folderName: string | null;
  viewMode: ViewMode;
  onClick: () => void;
};

function NoteCard({ note, folderName, viewMode, onClick }: NoteCardProps) {
  const tagStyle = folderName ? getFolderTagStyle(folderName) : null;

  if (viewMode === "list") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 text-left transition-all hover:border-violet-500/30 hover:shadow-md"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{note.title}</p>

              {folderName && tagStyle && (
                <span
                  className={cn(
                    "hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs ring-1 sm:inline-block",
                    tagStyle,
                  )}
                >
                  {folderName}
                </span>
              )}
            </div>
          </div>
          <span className="mt-1 line-clamp-1 text-muted-foreground">
            {note.content || "No content yet"}
          </span>
        </div>

        <div className="flex flex-col items-end gap-2">
          {note.is_favorite && (
            <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
          )}
          <span className="shrink-0 text-muted-foreground">
            {formatUIFriendlyDate(note.updated_at ?? note.created_at)}
          </span>
        </div>
      </button>
    );
  }

  const handleFavorite = async (
    event: React.MouseEvent<SVGSVGElement>,
    note: Note,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    await updateNote.mutateAsync({
      ...note,
      is_favorite: !note.is_favorite ? true : false,
    });
  };
  const updateNote = useUpdateNote();

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full w-full flex-col rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-violet-500/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 font-medium leading-snug">{note.title}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          {note.is_favorite ? (
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
          ) : (
            <Star
              className="size-3.5 text-muted-foreground"
              onClick={(event) => handleFavorite(event, note)}
            />
          )}
          {/* {hasAttachment && (
            <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
              <Paperclip className="size-3" />1
            </span>
          )} */}
        </div>
      </div>

      <span className="mt-1  text-muted-foreground">
        {formatUIFriendlyDate(note.updated_at ?? note.created_at)}
      </span>

      <span className="mt-3 line-clamp-4 flex-1 text-muted-foreground">
        {note.content || "No content yet"}
      </span>

      {folderName && tagStyle && (
        <span
          className={cn(
            "mt-4 inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs ring-1",
            tagStyle,
          )}
        >
          {folderName}
        </span>
      )}
    </button>
  );
}

function EmptyNotesState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
      <h3 className="text-lg font-semibold">No notes yet</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Create your first note to start capturing ideas and organizing them into
        folders.
      </p>
      <Button
        className="mt-6 bg-accent hover:bg-accent/80 text-background"
        size="lg"
        onClick={onCreateClick}
      >
        <Plus className="size-4" />
        Add Note
      </Button>
    </div>
  );
}

const TABS: { id: ContentTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "notes", label: "Notes" },
  { id: "files", label: "Files" },
];

const NotesPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folder");

  const notesFilter: NotesFilter = folderId ?? "all";
  const { data: notes = [], isLoading, isError, error } = useNotes(notesFilter);
  const { data: folders = [] } = useFolders();

  const activeFolder = folders.find((f) => f.id === folderId) ?? null;

  const [activeTab, setActiveTab] = useState<ContentTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { openChat } = useNoteChatPanel();

  const createNote = useCreateNote();

  const folderNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const folder of folders) {
      map.set(folder.id, folder.name);
    }
    return map;
  }, [folders]);

  const filteredNotes = useMemo(() => {
    if (activeTab === "notes") {
      return notes.filter((n) => !n.attachment_path);
    }
    if (activeTab === "files") {
      return notes.filter((n) => n.attachment_path);
    }
    return notes;
  }, [notes, activeTab]);

  async function handleCreateClick() {
    const createdNote = await createNote.mutateAsync({
      title: "Untitled",
      content: "",
      folder_id: folderId,
    });
    if (createdNote?.[0]) {
      router.push(notePath(createdNote[0]));
    }
  }

  const countLabel = `${filteredNotes.length} ${filteredNotes.length === 1 ? "note" : "notes"}`;

  return (
    <div className="relative flex flex-col gap-6">
      {/* Header toolbar */}
      <div className="flex flex-col gap-4 border-b border-border pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          {/* <p className="text-sm font-medium text-muted-foreground">
            {isLoading ? "Loading…" : countLabel}
          </p> */}

          <div className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative px-3 py-1.5 text-sm transition-colors",
                  activeTab === tab.id
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute inset-x-1 bottom-[-10.5px] h-0.5 rounded-full bg-accent/50" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border p-0.5">
            <Button
              type="button"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon-sm"
              className="size-8"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <Grid3X3 className="size-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon-sm"
              className="size-8"
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <LayoutList className="size-4" />
            </Button>
          </div>

          <Button
            className="bg-accent hover:bg-accent/80 text-background"
            onClick={() => void handleCreateClick()}
            disabled={createNote.isPending}
          >
            <Plus className="size-4" />
            {/* Add Note */}
          </Button>
        </div>
      </div>

      {/* Notes grid / list */}
      <section>
        {isLoading ? (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                : "flex flex-col gap-2",
            )}
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <NoteCardSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
            <p className="font-medium text-destructive">Failed to load notes</p>
            <p className="mt-2 text-destructive/80">{`${error}`}</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <EmptyNotesState onCreateClick={() => void handleCreateClick()} />
        ) : (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                : "flex flex-col gap-2",
            )}
          >
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                folderName={
                  note.folder_id
                    ? (folderNameById.get(note.folder_id) ?? null)
                    : null
                }
                viewMode={viewMode}
                onClick={() => router.push(notePath(note))}
              />
            ))}
          </div>
        )}
      </section>

      {activeFolder && filteredNotes.length > 0 && (
        <div className="fixed bottom-6 right-6 z-30">
          <LunaButton onClick={() => openChat(filteredNotes[0])} />
        </div>
      )}
    </div>
  );
};

export default NotesPage;
