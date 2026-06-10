"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useNotes,
  useUpdateNote,
  useDeleteNote,
  useUploadNoteAttachment,
  type NoteFormPayload,
  Note,
} from "@/hooks/useNotes";
import { supabase } from "@/lib/supabase";
import { protectedRoutes } from "@/app/routes";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import { NoteForm } from "@/components/helpers/NoteForm";
import {
  Dialog,
  DialogDescription,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useSummarizeNote } from "@/hooks/useSummarizeNote";
import {
  SummarizeDrawer,
  summarizeButtonLabel,
} from "@/components/SummarizeDrawer";
import { NoteChatPanel } from "@/components/NoteChatPanel";
import { BUCKET } from "@/lib/constants/constants";
import { LUNA } from "@/lib/constants/constants";

export default function NoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;

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
    if (!user) {
      return;
    }

    try {
      const { title, content, file } = payload;
      await updateNote.mutateAsync({ ...note, title, content });
      if (file) {
        await uploadAttachment.mutateAsync({
          file,
          noteId: note.id,
          userId: user.id,
        });
      }
      setOpenEditDialog(false);
    } catch (err) {
      setSubmitError("Failed to save note or attachment.");
    }
  };

  function handleSummarizeClick() {
    if (!note) return;

    summarizeMutation.reset();
    setSummaryDrawerOpen(true);
    summarizeMutation.mutate(note);
  }

  if (isError) {
    return (
      <div>
        <p>Failed to load notes.</p>
        <Link href={protectedRoutes.HOME}>Back</Link>
      </div>
    );
  }

  if (!note) {
    return (
      <div>
        <p>Note not found.</p>
        <Link href={protectedRoutes.HOME}>Back</Link>
      </div>
    );
  }

  return (
    <div className=" px-10 py-6">
      <Link
        href={protectedRoutes.HOME}
        className="flex items-center gap-2 text-lg mb-6 text-muted-foreground"
      >
        <ArrowLeft />
        Back
      </Link>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="mt-4 font-semibold">{note.title}</h1>
          <p className="mt-1 text-muted-foreground">
            {new Date(note.created_at).toLocaleString()}
          </p>
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
          className="mt-4 max-h-96 rounded-lg border object-contain"
        />
      )}

      {/* {attachmentUrl && note.attachment_mime === "application/pdf" && (
        <iframe
          src={attachmentUrl}
          title={note.attachment_name ?? "PDF preview"}
          className="mt-4 h-96 w-full rounded-lg border"
        />
      )} */}

      {attachmentUrl && (
        <Button
          onClick={() => window.open(attachmentUrl, "_blank")}
          className="mt-2 inline-block "
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
                      router.push(protectedRoutes.HOME);
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
