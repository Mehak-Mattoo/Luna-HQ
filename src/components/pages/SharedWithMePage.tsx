"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { protectedRoutes } from "@/components/helpers/routes";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { formatUIFriendlyDate } from "@/components/helpers/constants";
import { Skeleton } from "../ui/skeleton";

import { cn, stripScriptTags } from "@/lib/utils";
import { useSharedWithMeNotes } from "@/hooks/useNoteShares";

export function SharedWithMePage() {
  const { data: notes = [], isLoading, isError } = useSharedWithMeNotes();
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleAttachmentUpload(selectedFile: File) {
    setSubmitError("Failed to upload attachment.");
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-88 w-full" />
      </div>
    );
  }
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
        <h3 className="text-lg font-semibold">No shared notes yet</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          When someone shares a note with you, it will show up here.
        </p>
        <Link
          href={protectedRoutes.ALL_NOTES}
          className="mt-6 text-sm text-accent hover:underline"
        >
          Back to your notes
        </Link>
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

  if (!notes[0]) {
    return (
      <div>
        <p>Note not found.</p>
        <Link href={protectedRoutes.ALL_NOTES}>Back</Link>
      </div>
    );
  }

  const note = notes[0];

  const noteBody = (
    <div className="relative min-h-[50vh]">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="mt-4 font-medium!">
            {stripScriptTags(note.note.title ?? "")}
          </h3>
          <h6 className="mt-1 text-muted-foreground">
            Shared at {formatUIFriendlyDate(note.note.created_at)}
          </h6>
        </div>
      </div>

      <div className="mt-4">
        <input
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
        >
          <Plus
            className={cn(
              "size-4 text-accent/70 transition-transform duration-300 ease-out",
              "group-hover:rotate-90",
            )}
          />
        </Button>
      </div>

      <p className="mt-6 whitespace-pre-wrap">
        {stripScriptTags(note.note.content ?? "")}
      </p>

      {note.note.attachment_path &&
        note.note.attachment_mime?.startsWith("image/") && (
          <Image
            src={note.note.attachment_path}
            alt={note.note.attachment_name ?? "Attachment"}
            width={800}
            height={320}
            unoptimized
            className="mt-4 max-h-80 w-auto object-contain"
          />
        )}

      {note.note.attachment_path &&
        !note.note.attachment_mime?.startsWith("image/") && (
          <Button
            onClick={() =>
              window.open(note.note.attachment_path ?? "", "_blank")
            }
            className="mt-2 inline-block"
          >
            Open {note.note.attachment_name}
          </Button>
        )}

      {submitError && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {submitError}
        </p>
      )}
    </div>
  );

  return <>{noteBody}</>;
}
