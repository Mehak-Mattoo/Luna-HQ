"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { formatUIFriendlyDate } from "@/components/helpers/constants";
import {
  protectedRoutes,
  sharedWithMeNotePath,
} from "@/components/helpers/routes";
import { Skeleton } from "../ui/skeleton";
import { stripScriptTags, cn } from "@/lib/utils";
import {
  useSharedWithMeNotes,
  type SharedWithMeNote,
} from "@/hooks/useNoteShares";

function SharedNoteCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="mt-3 h-3 w-1/4" />
      <Skeleton className="mt-4 h-10 w-full" />
    </div>
  );
}

function SharedNoteCard({
  item,
  onClick,
}: {
  item: SharedWithMeNote;
  onClick: () => void;
}) {
  const { note, permission, sharedAt } = item;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full w-full flex-col rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-violet-500/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 font-medium leading-snug">
          {stripScriptTags(note.title )}
        </p>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 ring-1",
            permission === "edit"
              ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20"
              : "bg-muted text-muted-foreground ring-border",
          )}
        >
          {permission === "edit" ? "Can edit" : "View only"}
        </span>
      </div>

      <span className="mt-1 text-sm text-muted-foreground">
        Shared {formatUIFriendlyDate(sharedAt)}
      </span>

      <span className="mt-3 line-clamp-4 flex-1 text-sm text-muted-foreground">
        {stripScriptTags(note.content ?? "") || "No content yet"}
      </span>
    </button>
  );
}

export function SharedWithMePage() {
  const router = useRouter();
  const { data: sharedNotes = [], isLoading, isError } = useSharedWithMeNotes();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
       
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SharedNoteCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-xl font-semibold">Shared with me</h3>
        <p className="text-destructive">Failed to load shared notes.</p>
        <Link
          href={protectedRoutes.ALL_NOTES}
          className="text-sm text-accent hover:underline"
        >
          Back to your notes
        </Link>
      </div>
    );
  }

  if (sharedNotes.length === 0) {
    return (
      <div className="flex flex-col gap-6">
      
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
          <h3 className="text-lg font-semibold">No shared notes yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            When someone invites you to a note, it will show up here.
          </p>
          <Link
            href={protectedRoutes.ALL_NOTES}
            className="mt-6 text-sm text-accent hover:underline"
          >
            Back to your notes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold">Shared with me</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {sharedNotes.length}{" "}
          {sharedNotes.length === 1 ? "note" : "notes"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sharedNotes.map((item) => (
          <SharedNoteCard
            key={item.shareId}
            item={item}
            onClick={() =>
              router.push(sharedWithMeNotePath(item.note.id))
            }
          />
        ))}
      </div>
    </div>
  );
}
