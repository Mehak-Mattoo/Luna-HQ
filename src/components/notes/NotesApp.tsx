"use client";

import { useEffect, useMemo, useState } from "react";

import { NoteForm } from "@/components/notes/NoteForm";
import {
  useCreateNote,
  useDeleteNote,
  useNotes,
  useUpdateNote,
  useUploadNoteAttachment,
  type NoteFormPayload,
} from "@/hooks/useNotes";
import { useNoteStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { apiRoutes, protectedRoutes } from "@/app/routes";
import { supabase } from "@/lib/supabase";
import { generateText } from "ai";
import { Button } from "../ui/button";

export type { NoteFormPayload };

export function NotesApp() {
  const { data: notes = [], isLoading, isError, error } = useNotes();
  const { selectedNoteId, setSelectedNoteId } = useNoteStore();
  const router = useRouter();
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
        const created = await createNote.mutateAsync({ title, content });
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
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Failed to save note or attachment.",
      );
    }
  }

  function handleDelete() {
    if (!selectedNote) {
      return;
    }

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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className=" text-foreground">Your notes</h2>
        </div>

        <Button onClick={handleCreateClick} size="lg">
          Add Note
        </Button>
      </div>

      <>
        <section className="bg-background ">
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
              No notes yet. Create one to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 ">
              {notes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() =>
                    router.push(`${protectedRoutes.NOTE}/${String(note.id)}`)
                  }
                  className={`w-full cursor-pointer rounded-xl  border px-4 py-3 text-left transition duration-150 ${
                    note.id === selectedNoteId
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/70 hover:bg-primary/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">
                      {note.title}
                    </p>
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
          key={selectedNote?.id ?? "new"}
          note={selectedNote}
          isSaving={isSaving}
          onSubmit={handleSubmit}
          onDelete={selectedNote ? handleDelete : undefined}
          onCancel={() => {
            setSubmitError(null);
            setOpenDialog(false);
          }}
        />
      </>
    </div>
  );
}
