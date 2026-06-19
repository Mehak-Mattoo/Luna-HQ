"use client";

import { useRouter } from "next/navigation";
import { useNotes } from "@/hooks/useNotes";
import { useNoteStore } from "@/lib/store";
import { notePath, protectedRoutes } from "@/components/helpers/routes";
import { Button } from "../ui/button";

export function NotesApp() {
  const { data: notes = [], isLoading, isError, error } = useNotes();
  const { selectedNoteId, setSelectedNoteId } = useNoteStore();
  const router = useRouter();

  function handleCreateClick() {
    setSelectedNoteId(null);
    router.push(`${protectedRoutes.ALL_NOTES}?create=1`);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className=" text-foreground">Your notes</h3>
        </div>

        <Button onClick={handleCreateClick} size="lg">
          Add Note
        </Button>
      </div>

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
                onClick={() => router.push(notePath(note))}
                className={`w-full cursor-pointer rounded-xl  border px-4 py-3 text-left transition duration-150 ${
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
    </div>
  );
}
