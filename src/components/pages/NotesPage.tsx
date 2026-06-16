"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  FileText,
  FolderOpen,
  Paperclip,
  Plus,
  Slash,
  StickyNote,
} from "lucide-react";

import { NoteForm } from "@/components/pages/NoteForm";
import { useNoteStore } from "@/lib/store";
import { notePath, protectedRoutes } from "@/components/helpers/routes";
import { supabase } from "@/lib/supabase";
import { Button } from "../ui/button";
import {
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useUploadNoteAttachment,
  type NoteFormPayload,
  useNotes,
  type Note,
  type NotesFilter,
} from "@/hooks/useNotes";
import { useFolders } from "@/hooks/useFolders";
import { useSummarizeFolder } from "@/hooks/useSummarizeFolder";
import { SummarizeDrawer } from "../SummarizeDrawer";
import { LunaButton, type LunaActionOption } from "../ui/LunaButton";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";
import { formatUIFriendlyDate } from "../helpers/constants";


function NoteCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card py-3 px-6">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-20 shrink-0" />
      </div>
    </div>
  );
}

type NoteCardProps = {
  note: Note;
  isSelected: boolean;
  onClick: () => void;
};

function NoteCard({ note, isSelected, onClick }: NoteCardProps) {
  const hasAttachment = Boolean(note.attachment_path);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-xl border bg-card  py-3 px-5 text-left",
        " hover:border-primary/40 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-full flex justify-between gap-1">
            <h6 className="truncate font-medium text-foreground">
              {note.title}
            </h6>
          </div>
        </div>
        <span className=" text-muted-foreground">
          {formatUIFriendlyDate(note.created_at)}
        </span>
      </div>

      <h6 className="mt-2 line-clamp-3 text-muted-foreground">
        {note.content}
      </h6>

      {hasAttachment && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          <Paperclip className="size-3" />
          Attachment
        </div>
      )}
    </button>
  );
}

function EmptyNotesState({
  activeFolder,
  onCreateClick,
}: {
  activeFolder: { name: string } | null;
  onCreateClick: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
      <h3 className="mt-5 text-lg font-semibold text-foreground">
        {activeFolder ? "This folder is empty" : "No notes yet"}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {activeFolder
          ? `Add your first note to "${activeFolder.name}" and it will show up here.`
          : "Create your first note to start capturing ideas and organizing them into folders."}
      </p>
      <Button className="mt-6" size="lg" onClick={onCreateClick}>
        <Plus className="size-4" />
        {activeFolder ? "Add note to folder" : "Create your first note"}
      </Button>
    </div>
  );
}

const NotesPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folder");
  const shouldOpenCreate = searchParams.get("create");

  const notesFilter: NotesFilter = folderId ?? "all";
  const { data: notes = [], isLoading, isError, error } = useNotes(notesFilter);
  const { data: folders = [] } = useFolders();

  const activeFolder = folders.find((f) => f.id === folderId) ?? null;

  const { selectedNoteId, setSelectedNoteId } = useNoteStore();
  const [openDialog, setOpenDialog] = useState(false);
  const [summaryDrawerOpen, setSummaryDrawerOpen] = useState(false);

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const uploadAttachment = useUploadNoteAttachment();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isSaving =
    createNote.isPending ||
    updateNote.isPending ||
    deleteNote.isPending ||
    uploadAttachment.isPending;

  useEffect(() => {
    if (shouldOpenCreate) {
      setSelectedNoteId(null);
      setSubmitError(null);
      setOpenDialog(true);
    }
  }, [shouldOpenCreate, setSelectedNoteId]);

  async function handleSubmit(payload: NoteFormPayload) {
    const { title, content, file } = payload;
    setSubmitError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (selectedNote) {
        await updateNote.mutateAsync({ ...selectedNote, title, content });
        if (file) {
          await uploadAttachment.mutateAsync({
            file,
            noteId: selectedNote.id,
            userId: user.id,
          });
        }
      } else {
        const created = await createNote.mutateAsync({
          title,
          content,
          folder_id: folderId,
        });
        if (file) {
          await uploadAttachment.mutateAsync({
            file,
            noteId: created?.[0]?.id,
            userId: user.id,
          });
        }
      }

      setSelectedNoteId(null);
      setOpenDialog(false);

      if (shouldOpenCreate && folderId) {
        router.replace(`${protectedRoutes.ALL_NOTES}?folder=${folderId}`);
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Failed to save note or attachment.",
      );
    }
  }

  function handleDelete() {
    if (!selectedNote) return;

    deleteNote.mutate(selectedNote.id, {
      onSuccess() {
        setSelectedNoteId(null);
      },
    });
  }

  function handleCreateClick() {
    setSelectedNoteId(null);
    setSubmitError(null);
    setOpenDialog(true);
  }

  const summarizeFolder = useSummarizeFolder();

  function handleSummarizeFolder() {
    if (!activeFolder) return;
    summarizeFolder.reset();
    setSummaryDrawerOpen(true);
    summarizeFolder.mutate(activeFolder.id);
  }

  const heading = activeFolder ? activeFolder.name : "Your notes";
  const subheading = `${notes.length} ${notes.length === 1 ? "note" : "notes"}`;

  const lunaOptions: LunaActionOption[] = activeFolder
    ? [
        {
          id: "summarize-folder",
          label: "Summarize folder",
          onClick: handleSummarizeFolder,
          disabled: summarizeFolder.isPending || notes.length === 0,
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden ">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/5 blur-3xl"
        />

        <div className="relative space-y-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div>
                <h3 className=" tracking-tight text-foreground ">
                  {heading}
                </h3>
                <h6 className="mt-1 text-muted-foreground md:text-base">
                  {isLoading ? "Loading your notes…" : subheading}
                </h6>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleCreateClick}>
                <Plus className="size-4" />
                Add Note
              </Button>
            </div>
          </div>
        </div>
      </section>

      {submitError && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-destructive">
          {submitError}
        </p>
      )}

      <section>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <NoteCardSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
            <p className="font-medium text-destructive">Failed to load notes</p>
            <p className="mt-2 text-destructive/80">{`${error}`}</p>
          </div>
        ) : notes.length === 0 ? (
          <EmptyNotesState
            activeFolder={activeFolder}
            onCreateClick={handleCreateClick}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isSelected={note.id === selectedNoteId}
                onClick={() => router.push(notePath(note))}
              />
            ))}
          </div>
        )}
      </section>

      <NoteForm
        openDialog={openDialog}
        key={selectedNote?.id ?? `new-${folderId ?? "all"}`}
        note={selectedNote}
        isSaving={isSaving}
        onSubmit={handleSubmit}
        onDelete={selectedNote ? handleDelete : undefined}
        onCancel={() => {
          setSubmitError(null);
          setOpenDialog(false);
          if (shouldOpenCreate && folderId) {
            router.replace(`${protectedRoutes.ALL_NOTES}?folder=${folderId}`);
          }
        }}
      />

      {activeFolder && (
        <SummarizeDrawer
          title={activeFolder.name}
          open={summaryDrawerOpen}
          onOpenChange={setSummaryDrawerOpen}
          summary={summarizeFolder.data}
          error={summarizeFolder.error?.message ?? null}
          isPending={summarizeFolder.isPending}
        />
      )}

      <div className="absolute bottom-5 right-5">
        {activeFolder && notes.length > 0 && (
          <LunaButton
            options={lunaOptions}
            isBusy={summarizeFolder.isPending}
          />
        )}
      </div>
    </div>
  );
};

export default NotesPage;
