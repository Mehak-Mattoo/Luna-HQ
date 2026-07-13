"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useNote,
  useUpdateNote,
  useDeleteNote,
  useUploadNoteAttachment,
  type Note,
  type NoteFormPayload,
} from "@/hooks/useNotes";
import {
  useFavoriteNoteIds,
  withFavoriteState,
} from "@/hooks/useNoteFavorites";
import { useAuth } from "@/components/wrapper/AuthProvider";
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
import { BUCKET, formatUIFriendlyDate } from "@/components/helpers/constants";
import { Skeleton } from "../ui/skeleton";
import { LunaButton } from "../ui/LunaButton";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../ui/context-menu";
import { useSetNavbarNote } from "@/components/wrapper/NoteNavbarContext";
import { useNoteChatPanel } from "@/components/wrapper/NoteChatContext";
import { cn, stripScriptTags } from "@/lib/utils";
import { useNoteShortcuts } from "@/hooks/useNoteShortcuts";
import { useCollaboratorAccess } from "@/hooks/useNoteShares";
import type { NoteAccess } from "@/lib/noteContextServer";

type NoteDetailPageProps = {
  noteId: string;
  folderId?: string;
  trimmed?: boolean;
  initialNote?: Note;
  readOnly?: boolean;
  /** Resolved access from server (owner / view / edit). */
  access?: NoteAccess;
  /** Note opened from Shared with me — hide owner-only actions */
  sharedView?: boolean;
};

export function NoteDetailPage({
  noteId,
  folderId,
  trimmed = false,
  initialNote,
  readOnly = false,
  access,
  sharedView = false,
}: NoteDetailPageProps) {
  const router = useRouter();

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [sharedNote, setSharedNote] = useState<Note | undefined>(initialNote);

  const shouldFetchCollaboratorAccess = sharedView && access === undefined;

  const { data: collaboratorPermission } = useCollaboratorAccess(
    shouldFetchCollaboratorAccess ? noteId : undefined,
  );

  const {
    data: fetchedNote,
    isLoading,
    isError,
  } = useNote(noteId, {
    enabled: !initialNote,
  });
  const { data: favoriteIds = new Set<string>() } = useFavoriteNoteIds();
  const { userId } = useAuth();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const uploadAttachment = useUploadNoteAttachment();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const { openChat, closeChat } = useNoteChatPanel();
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLParagraphElement>(null);

  const rawNote = sharedView
    ? (sharedNote ?? initialNote)
    : (initialNote ?? fetchedNote ?? undefined);

  const note = useMemo(() => {
    if (!rawNote) return undefined;
    return withFavoriteState([rawNote], favoriteIds)[0] as Note;
  }, [rawNote, favoriteIds]);

  const canEditShared =
    access !== undefined
      ? access === "edit"
      : collaboratorPermission === "edit";

  const isReadOnly = trimmed || (sharedView ? !canEditShared : readOnly);

  useEffect(() => {
    if (initialNote) setSharedNote(initialNote);
  }, [initialNote]);

  useEffect(() => {
    closeChat();
  }, [noteId, closeChat]);

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

    if (String(note.folder_id ?? "") !== String(folderId)) {
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
    if (!note || !userId) return;
    setSubmitError(null);

    try {
      const { title, content, file } = payload;
      const updated = await updateNote.mutateAsync({ ...note, title, content });
      if (file) {
        await uploadAttachment.mutateAsync({
          file,
          noteId: note.id,
          userId,
        });
      }

      const saved = (updated?.[0] ?? { ...note, title, content }) as Note;
      if (sharedView) {
        setSharedNote(saved);
      } else {
        router.replace(notePath(saved));
      }
    } catch {
      setSubmitError("Failed to save note or attachment.");
    }
  };

  function handleOpenChat() {
    if (!note) return;
    openChat(note);
  }

  async function handleAttachmentUpload(selectedFile: File) {
    if (!note || !userId) return;
    setSubmitError(null);

    try {
      await uploadAttachment.mutateAsync({
        file: selectedFile,
        noteId: note.id,
        userId,
      });
      // notes query refetches → attachmentUrl updates via useEffect
    } catch {
      setSubmitError("Failed to upload attachment.");
    }
  }

  useSetNavbarNote(trimmed || sharedView ? undefined : note);

  useNoteShortcuts({
    onDelete: () => setOpenDeleteDialog(true),
    onSearch: () => {
      // setSearchModalOpen(true)
    },
    onCloseModals: () => {
      setOpenDeleteDialog(false);
      closeChat();
    },
    enabled: !!note && !trimmed && !sharedView,
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
        <p>Failed to load note.</p>
        <Link href={protectedRoutes.ALL_NOTES}>Back</Link>
      </div>
    );
  }

  if (!note) {
    return (
      <div>
        <p>Note not found.</p>
        {!trimmed && (
          <Link
            href={
              sharedView
                ? protectedRoutes.SHARED_WITH_ME
                : protectedRoutes.ALL_NOTES
            }
          >
            Back
          </Link>
        )}
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

      {!trimmed && !sharedView && (
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
                "size-4 text-accent/70 transition-transform duration-300 ease-out",
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

      {!trimmed && !sharedView && openDeleteDialog && (
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
          <LunaButton onClick={handleOpenChat} />
        </div>
      )}
    </div>
  );

  if (trimmed || sharedView) {
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
      </ContextMenu>
    </>
  );
}
