"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { NoteForm } from "@/components/pages/NoteForm";
import { useNoteStore } from "@/lib/store";
import { notePath, protectedRoutes } from "@/app/routes";
import { supabase } from "@/lib/supabase";
import { Button } from "../ui/button";
import {
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useUploadNoteAttachment,
  type NoteFormPayload,
  useNotes,
  type NotesFilter,
} from "@/hooks/useNotes";
import { useFolders } from "@/hooks/useFolders";

const NotesPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = searchParams.get("folder");
  const shouldOpenCreate = searchParams.get("create") === "1";

  const notesFilter: NotesFilter = folderId ?? "all";
  const { data: notes = [], isLoading, isError, error } = useNotes(notesFilter);
  const { data: folders = [] } = useFolders();

  const activeFolder = folders.find((f) => f.id === folderId) ?? null;

  const { selectedNoteId, setSelectedNoteId } = useNoteStore();
  const [openDialog, setOpenDialog] = useState(false);

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

  const heading = activeFolder ? `${activeFolder.name}` : "Your notes";

  const subheading = activeFolder ? "Notes in this folder" : "All your notes";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-foreground">{heading}</h2>
          <p className="text-sm text-muted-foreground">{subheading}</p>
        </div>

        <Button onClick={handleCreateClick} size="lg">
          {activeFolder ? "Add note to folder" : "Add Note"}
        </Button>
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <section className="bg-background">
        {isLoading ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted p-8 text-center text-sm text-muted-foreground">
            Loading notes…
          </div>
        ) : isError ? (
          <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
            Failed to load notes. {`${error}`}
          </div>
        ) : notes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-muted p-8 text-center text-sm text-muted-foreground">
            {activeFolder
              ? "No notes in this folder yet. Create one to get started."
              : "No notes yet. Create one to get started."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {notes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => router.push(notePath(note))}
                className={`w-full cursor-pointer rounded-xl border px-4 py-3 text-left transition duration-150 ${
                  note.id === selectedNoteId
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/70 hover:bg-primary/5"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{note.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-muted-foreground">
                  {note.content}
                </p>
              </button>
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
    </div>
  );
};

export default NotesPage;
