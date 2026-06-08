"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useNotes,
  useUpdateNote,
  useDeleteNote,
  useUploadNoteAttachment,
  type NoteFormPayload,
} from "@/hooks/useNotes";
import { supabase } from "@/lib/supabase";
import { myNotesPath, notePath, protectedRoutes } from "@/app/routes";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import { NoteForm } from "@/components/pages/NoteForm";
import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useSummarizeNote } from "@/hooks/useSummarizeNote";
import {
  SummarizeDrawer,
  summarizeButtonLabel,
} from "@/components/SummarizeDrawer";
import { NoteChatPanel } from "@/components/NoteChatPanel";
import { BUCKET, LUNA } from "@/lib/constants/constants";
import { Skeleton } from "../ui/skeleton";

type NoteDetailPageProps = {
  noteId: string;
  folderId?: string;
};

export function NoteDetailPage({ noteId, folderId }: NoteDetailPageProps) {
  const router = useRouter();

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const { data: notes = [], isLoading, isError } = useNotes();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const uploadAttachment = useUploadNoteAttachment();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [summaryDrawerOpen, setSummaryDrawerOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const note = notes?.find((n) => String(n.id) === noteId);
  const summarizeMutation = useSummarizeNote();

  useEffect(() => {
    summarizeMutation.reset();
    setSummaryDrawerOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when navigating to another note
  }, [noteId]);

  useEffect(() => {
    if (!note) return;

    const canonical = notePath(note);
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "";

    if (currentPath !== canonical) {
      router.replace(canonical);
    }
  }, [note, router]);

  useEffect(() => {
    if (!note || folderId === undefined) return;

    if (note.folder_id !== folderId) {
      router.replace(notePath(note));
    }
  }, [note, folderId, router]);

  useEffect(() => {
    const storagePath = note?.attachment_path;
    if (!storagePath) {
      setAttachmentUrl(null);
      return;
    }

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(storagePath, 3600);

      if (!cancelled && !error && data?.signedUrl) {
        setAttachmentUrl(data.signedUrl);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [note?.attachment_path]);

  const handleUpdateNote = async (payload: NoteFormPayload) => {
    if (!note) return;
    setSubmitError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { title, content, file } = payload;
      const updated = await updateNote.mutateAsync({ ...note, title, content });
      if (file) {
        await uploadAttachment.mutateAsync({
          file,
          noteId: note.id,
          userId: user.id,
        });
      }

      const saved = updated?.[0] ?? { ...note, title, content };
      setOpenEditDialog(false);
      router.replace(notePath(saved));
    } catch {
      setSubmitError("Failed to save note or attachment.");
    }
  };

  function handleSummarizeClick() {
    if (!note) return;

    summarizeMutation.reset();
    setSummaryDrawerOpen(true);
    summarizeMutation.mutate(note);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 flex flex-col gap-4 p-6">
        <Skeleton className="h-14 w-[50vw]" />
        <Skeleton className="h-88 w-[50vw]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <p>Failed to load notes.</p>
        <Link href={protectedRoutes.ALL_NOTES}>Back</Link>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <p>Note not found.</p>
        <Link href={protectedRoutes.ALL_NOTES}>Back</Link>
      </div>
    );
  }

  const backHref = myNotesPath(note.folder_id);

  return (
    <div className="px-10 py-5">
      <Link
        href={backHref}
        className="mb-6 flex items-center gap-2 text-lg text-muted-foreground"
      >
        <ArrowLeft />
        Back
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="mt-4 font-semibold">{note.title}</h2>
          <h6 className="mt-1 text-muted-foreground">
            {new Date(note.created_at).toLocaleString()}
          </h6>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setOpenEditDialog(true)}>
            <Edit />
          </Button>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => setOpenDeleteDialog(true)}
          >
            <Trash className="text-red-300" />
          </Button>
        </div>
      </div>

      <p className="mt-6 whitespace-pre-wrap">{note.content}</p>

      {attachmentUrl && note.attachment_mime?.startsWith("image/") && (
        <img
          src={attachmentUrl}
          alt={note.attachment_name ?? "Attachment"}
          className="mt-4 max-h-80 rounded-lg border object-contain"
        />
      )}

      {attachmentUrl && (
        <Button
          onClick={() => window.open(attachmentUrl, "_blank")}
          className="mt-2 inline-block"
        >
          Open {note.attachment_name}
        </Button>
      )}

      {submitError && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {submitError}
        </p>
      )}

      {openDeleteDialog && (
        <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Delete this note?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. The note will be permanently
                deleted.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>

              <Button
                variant="destructive"
                disabled={deleteNote.isPending}
                onClick={() => {
                  deleteNote.mutate(String(note.id), {
                    onSuccess: () => {
                      setOpenDeleteDialog(false);
                      router.push(myNotesPath(note.folder_id));
                    },
                  });
                }}
              >
                {deleteNote.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <NoteForm
        key={String(note.id)}
        openDialog={openEditDialog}
        note={note}
        isSaving={updateNote.isPending || uploadAttachment.isPending}
        onSubmit={handleUpdateNote}
        onCancel={() => setOpenEditDialog(false)}
      />

      <div className="absolute bottom-5 right-5 flex gap-2">
        <Button variant="outline" size="lg" onClick={() => setChatOpen(true)}>
          {`Ask ${LUNA}`}
        </Button>
        <Button
          onClick={handleSummarizeClick}
          disabled={summarizeMutation.isPending}
          size="lg"
        >
          {summarizeButtonLabel(note, summarizeMutation.isPending)}
        </Button>
      </div>

      <NoteChatPanel note={note} open={chatOpen} onOpenChange={setChatOpen} />

      <SummarizeDrawer
        note={note}
        open={summaryDrawerOpen}
        onOpenChange={setSummaryDrawerOpen}
        summary={summarizeMutation.data}
        error={summarizeMutation.error?.message ?? null}
        isPending={summarizeMutation.isPending}
      />
    </div>
  );
}
