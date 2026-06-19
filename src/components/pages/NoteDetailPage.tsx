"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useNotes,
  useUpdateNote,
  useDeleteNote,
  useUploadNoteAttachment,
  type Note,
  type NoteFormPayload,
} from "@/hooks/useNotes";
import { supabase } from "@/lib/supabase";
import {
  myNotesPath,
  notePath,
  protectedRoutes,
} from "@/components/helpers/routes";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
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
  ContextMenuTrigger,
} from "../ui/context-menu";
import { useSetNavbarNote } from "@/components/wrapper/NoteNavbarContext";
import { cn, stripScriptTags } from "@/lib/utils";
import { useNoteShortcuts } from "@/hooks/useNoteShortcuts";

type NoteDetailPageProps = {
  noteId: string;
  folderId?: string;
  trimmed?: boolean;
  initialNote?: Note;
  readOnly?: boolean;
};

export function NoteDetailPage({
  noteId,
  folderId,
  trimmed = false,
  initialNote,
  readOnly = false,
}: NoteDetailPageProps) {
  const router = useRouter();

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const { data: notes = [], isLoading, isError } = useNotes("all", {
    enabled: !initialNote,
  });
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const uploadAttachment = useUploadNoteAttachment();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [summaryDrawerOpen, setSummaryDrawerOpen] = useState(false);
  const [summaryTitle, setSummaryTitle] = useState("");
  const [summaryMode, setSummaryMode] = useState<"note" | "folder">("note");
  const [chatOpen, setChatOpen] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLParagraphElement>(null);

  const note = initialNote ?? notes?.find((n) => String(n.id) === noteId);
  const isReadOnly = readOnly || trimmed;
  const { data: folders = [] } = useFolders();
  const summarizeMutation = useSummarizeNote();
  const summarizeFolderMutation = useSummarizeFolder();

  const parentFolder =
    note?.folder_id != null
      ? (folders.find((f) => f.id === note.folder_id) ?? null)
      : null;

  useEffect(() => {
    summarizeMutation.reset();
    summarizeFolderMutation.reset();
    /* eslint-disable react-hooks/set-state-in-effect -- reset drawer when switching notes */
    setSummaryDrawerOpen(false);
    setSummaryTitle("");
    setSummaryMode("note");
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when navigating to another note
  }, [noteId]);

  useEffect(() => {
    if (trimmed || initialNote) return;

    if (!note) return;

    const path = notePath(note);
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : "";

    if (currentPath !== path) {
      router.replace(path);
    }
  }, [note, router, trimmed, initialNote]);

  useEffect(() => {
    if (trimmed || initialNote) return;
    if (!note || folderId === undefined) return;

    if (note.folder_id !== folderId) {
      router.replace(notePath(note));
    }
  }, [note, folderId, router, trimmed, initialNote]);

  useEffect(() => {
    const storagePath = note?.attachment_path;
    if (!storagePath) return;

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
      setAttachmentUrl(null);
    };
  }, [note?.attachment_path]);

  useEffect(() => {
    if (!note || isReadOnly) return;

    if (titleRef.current) {
      titleRef.current.textContent = stripScriptTags(note.title ?? "");
    }
    if (contentRef.current) {
      contentRef.current.textContent = stripScriptTags(note.content ?? "");
    }
  }, [note, isReadOnly]);

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

  async function handleAttachmentUpload(selectedFile: File) {
    if (!note) return;
    setSubmitError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await uploadAttachment.mutateAsync({
        file: selectedFile,
        noteId: note.id,
        userId: user.id,
      });
      // notes query refetches → attachmentUrl updates via useEffect
    } catch {
      setSubmitError("Failed to upload attachment.");
    }
  }

  const isLoadingSummary =
    summarizeMutation.isPending || summarizeFolderMutation.isPending;

  const activeSummary =
    summaryMode === "folder" ? summarizeFolderMutation : summarizeMutation;

  useSetNavbarNote(trimmed ? undefined : note);

  useNoteShortcuts({
    onDelete: () => setOpenDeleteDialog(true),
    onSearch: () => {
      // setSearchModalOpen(true)
    },
    onCloseModals: () => {
      setOpenDeleteDialog(false);
      setSummaryDrawerOpen(false);
      setChatOpen(false);
    },
    enabled: !!note && !trimmed,
  });

  if (!initialNote && isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-14 w-[50vw]" />
        <Skeleton className="h-88 w-[50vw]" />
      </div>
    );
  }

  if (!initialNote && isError) {
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
        {!trimmed && <Link href={protectedRoutes.ALL_NOTES}>Back</Link>}
      </div>
    );
  }

  const titleProps = isReadOnly
    ? {}
    : {
        contentEditable: true as const,
        suppressContentEditableWarning: true,
        onBlur: (e: React.FocusEvent<HTMLElement>) =>
          handleUpdateNote({
            title: e.currentTarget.innerText,
            content: note.content,
          }),
        onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleUpdateNote({
              title: e.currentTarget.innerText,
              content: note.content,
            });
          }
        },
      };

  const contentProps = isReadOnly
    ? {}
    : {
        contentEditable: true as const,
        suppressContentEditableWarning: true,
        onBlur: (e: React.FocusEvent<HTMLElement>) =>
          handleUpdateNote({
            title: note.title,
            content: e.currentTarget.innerText,
          }),
        onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleUpdateNote({
              title: note.title,
              content: e.currentTarget.innerText,
            });
          }
        },
      };

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

  const noteBody = (
    <div className="relative min-h-[50vh]">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          {isReadOnly ? (
            <h3 className="mt-4 font-medium!">
              {stripScriptTags(note.title ?? "")}
            </h3>
          ) : (
            <h3 ref={titleRef} className="mt-4 font-medium!" {...titleProps} />
          )}
          <h6 className="mt-1 text-muted-foreground">
            Created {formatUIFriendlyDate(note.created_at)}
          </h6>
        </div>
      </div>

      {!trimmed && (
        <div className="mt-4">
          <input
            ref={attachmentInputRef}
            id="note-attachment"
            type="file"
            accept="image/*,.pdf"
            className="sr-only"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) void handleAttachmentUpload(selected);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="group rounded-full border-border/60 bg-surface-alt hover:border-primary/40 hover:bg-primary/10"
            aria-label="Add attachment"
            title="Add attachment"
            onClick={() => attachmentInputRef.current?.click()}
          >
            <Plus
              className={cn(
                "size-4 text-primary transition-transform duration-300 ease-out",
                "group-hover:rotate-90",
              )}
            />
          </Button>
        </div>
      )}

      {isReadOnly ? (
        <p className="mt-6 whitespace-pre-wrap">
          {stripScriptTags(note.content ?? "")}
        </p>
      ) : (
        <p
          ref={contentRef}
          className="mt-6 whitespace-pre-wrap"
          {...contentProps}
        />
      )}

      {attachmentUrl && note.attachment_mime?.startsWith("image/") && (
        <Image
          src={attachmentUrl}
          alt={note.attachment_name ?? "Attachment"}
          width={800}
          height={320}
          unoptimized
          className="mt-4 max-h-80 w-auto object-contain"
        />
      )}

      {attachmentUrl && !note.attachment_mime?.startsWith("image/") && (
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

      {!trimmed && openDeleteDialog && (
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

      {!trimmed && (
        <div className="absolute bottom-5 right-5">
          <LunaButton options={lunaOptions} isBusy={isLoadingSummary} />
        </div>
      )}

      {!trimmed && (
        <NoteChatPanel
          note={note}
          open={chatOpen}
          onOpenChange={setChatOpen}
        />
      )}
    </div>
  );

  if (trimmed) {
    return <>{noteBody}</>;
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{noteBody}</ContextMenuTrigger>

        <ContextMenuContent className="w-56">
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
