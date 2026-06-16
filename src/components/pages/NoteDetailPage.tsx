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
import {
  myNotesPath,
  notePath,
  protectedRoutes,
} from "@/components/helpers/routes";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Edit2, Trash } from "lucide-react";
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
import { useSummarizeFolder } from "@/hooks/useSummarizeFolder";
import { useFolders } from "@/hooks/useFolders";
import { SummarizeDrawer } from "@/components/SummarizeDrawer";
import { NoteChatPanel } from "@/components/NoteChatPanel";
import { BUCKET, formatUIFriendlyDate } from "@/components/helpers/constants";
import { Skeleton } from "../ui/skeleton";
import { LunaButton, type LunaActionOption } from "../ui/LunaButton";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../ui/context-menu";
import { useSetNavbarNote } from "@/components/wrapper/NoteNavbarContext";

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
  const [summaryTitle, setSummaryTitle] = useState("");
  const [summaryMode, setSummaryMode] = useState<"note" | "folder">("note");
  const [chatOpen, setChatOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const note = notes?.find((n) => String(n.id) === noteId);
  const { data: folders = [] } = useFolders();
  const summarizeMutation = useSummarizeNote();
  const summarizeFolderMutation = useSummarizeFolder();

  const parentFolder =
    note?.folder_id != null
      ? (folders.find((f) => f.id === note.folder_id) ?? null)
      : null;

  useEffect(() => {
    if (!note) return;
    setTitle(note.title);
    setContent(note.content);
    setFile(null);
  }, [note?.id, note?.title, note?.content]);

  useEffect(() => {
    summarizeMutation.reset();
    summarizeFolderMutation.reset();
    setSummaryDrawerOpen(false);
    setSummaryTitle("");
    setSummaryMode("note");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when navigating to another note
  }, [noteId]);

  useEffect(() => {
    if (!note) return;

    const path = notePath(note);
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "";

    if (currentPath !== path) {
      router.replace(path);
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
      setIsEditing(false);
      router.replace(notePath(saved));
    } catch {
      setSubmitError("Failed to save note or attachment.");
    }
  };

  function handleSummarizeNote() {
    if (!note) return;

    summarizeFolderMutation.reset();
    summarizeMutation.reset();
    setSummaryMode("note");
    setSummaryTitle(note.title);
    setSummaryDrawerOpen(true);
    summarizeMutation.mutate(note);
  }

  function handleSummarizeWorkspace() {
    if (!note?.folder_id || !parentFolder) return;

    summarizeMutation.reset();
    summarizeFolderMutation.reset();
    setSummaryMode("folder");
    setSummaryTitle(parentFolder.name);
    setSummaryDrawerOpen(true);
    summarizeFolderMutation.mutate(note.folder_id);
  }

  const isLoadingSummary =
    summarizeMutation.isPending || summarizeFolderMutation.isPending;

  const activeSummary =
    summaryMode === "folder" ? summarizeFolderMutation : summarizeMutation;

  useSetNavbarNote(note);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-14 w-[50vw]" />
        <Skeleton className="h-88 w-[50vw]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <p>Failed to load notes.</p>
        <Link href={protectedRoutes.ALL_NOTES}>Back</Link>
      </div>
    );
  }

  if (!note) {
    return (
      <div>
        <p>Note not found.</p>
        <Link href={protectedRoutes.ALL_NOTES}>Back</Link>
      </div>
    );
  }

  const lunaOptions: LunaActionOption[] = [
    {
      id: "summarize-note",
      label: "Summarize note",
      onClick: handleSummarizeNote,
      disabled: isLoadingSummary,
    },
    ...(parentFolder
      ? [
          {
            id: "summarize-workspace",
            label: "Summarize all notes in folder",
            onClick: handleSummarizeWorkspace,
            disabled: isLoadingSummary,
          } satisfies LunaActionOption,
        ]
      : []),
    {
      id: "ask-luna",
      label: "Ask Luna",
      onClick: () => setChatOpen(true),
      disabled: isLoadingSummary,
    },
  ];

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="relative min-h-[50vh]">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3
                  contentEditable
                  suppressContentEditableWarning
                  className="mt-4 font-medium!"
                  onBlur={(e) =>
                    handleUpdateNote({
                      title: e.currentTarget.innerText,
                      content: note.content,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setIsEditing(false);
                      handleUpdateNote({
                        title: e.currentTarget.innerText,
                        content: note.content,
                      });
                    }
                  }}
                >
                  {note.title}
                </h3>
                <h6 className="mt-1 text-muted-foreground">
                  Created {formatUIFriendlyDate(note.created_at)}
                </h6>
                {/* <h6 className="mt-1 text-muted-foreground">Last modified {new Date(note.updated_at ?? "").toLocaleString()}</h6> */}
              </div>
            </div>

            <p
              contentEditable
              suppressContentEditableWarning
              className="mt-6 whitespace-pre-wrap"
              onBlur={(e) =>
                handleUpdateNote({
                  title: note.title,
                  content: e.currentTarget.innerText,
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setIsEditing(false);
                  handleUpdateNote({
                    title: note.title,
                    content: e.currentTarget.innerText,
                  });
                }
              }}
            >
              {note.content}
            </p>

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
              <Dialog
                open={openDeleteDialog}
                onOpenChange={setOpenDeleteDialog}
              >
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

            <div className="absolute bottom-5 right-5">
              <LunaButton options={lunaOptions} isBusy={isLoadingSummary} />
            </div>

            <NoteChatPanel
              note={note}
              open={chatOpen}
              onOpenChange={setChatOpen}
            />
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-56">
          <ContextMenuItem onClick={() => setIsEditing(true)}>
            <Edit2 /> Edit
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            variant="destructive"
            onClick={() => setOpenDeleteDialog(true)}
          >
            <Trash /> Delete
          </ContextMenuItem>
        </ContextMenuContent>

        <SummarizeDrawer
          title={summaryTitle || note.title}
          open={summaryDrawerOpen}
          onOpenChange={setSummaryDrawerOpen}
          summary={activeSummary.data}
          error={activeSummary.error?.message ?? null}
          isPending={activeSummary.isPending}
        />
      </ContextMenu>
    </>
  );
}
