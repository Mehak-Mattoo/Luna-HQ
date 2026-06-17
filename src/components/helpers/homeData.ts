import type { Folder } from "@/hooks/useFolders";
import type { Note } from "@/hooks/useNotes";
import { myNotesPath, notePath } from "@/components/helpers/routes";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function countSince(
  items: { created_at: string }[],
  sinceMs = WEEK_MS,
): number {
  const cutoff = Date.now() - sinceMs;
  return items.filter((item) => new Date(item.created_at).getTime() >= cutoff)
    .length;
}

export function getFolderName(
  note: Note,
  folders: Folder[],
): string | null {
  if (!note.folder_id) return null;
  return folders.find((f) => f.id === note.folder_id)?.name ?? null;
}

export function getRecentNotes(notes: Note[], limit = 4): Note[] {
  return [...notes]
    .sort(
      (a, b) =>
        new Date(b.updated_at ?? b.created_at).getTime() -
        new Date(a.updated_at ?? a.created_at).getTime(),
    )
    .slice(0, limit);
}

export type LunaSuggestion = {
  id: string;
  text: string;
  href?: string;
};

export function getLunaSuggestions(notes: Note[]): LunaSuggestion[] {
  const items: LunaSuggestion[] = [];

  const longNotes = notes.filter((n) => n.content.length > 400);
  if (longNotes.length >= 2) {
    items.push({
      id: "unsummarized",
      text: `You have ${longNotes.length} long notes worth summarizing`,
      href: notePath(longNotes[0]),
    });
  }

  const uncategorized = notes.filter((n) => !n.folder_id);
  if (uncategorized.length > 0) {
    items.push({
      id: "uncategorized",
      text: `Organize ${uncategorized.length} uncategorized note${uncategorized.length === 1 ? "" : "s"}`,
      href: myNotesPath(),
    });
  }

  const meetingNotes = notes.filter((n) =>
    /meeting|standup|sync|interview/i.test(n.title),
  );
  if (meetingNotes.length > 0) {
    items.push({
      id: "meeting",
      text: "Generate action items from your meeting notes",
      href: notePath(meetingNotes[0]),
    });
  }

  if (items.length === 0 && notes.length > 0) {
    items.push({
      id: "explore",
      text: "Open a note and ask Luna to summarize it",
      href: notePath(notes[0]),
    });
  }

  return items.slice(0, 4);
}

export type ActivityItem = {
  id: string;
  icon: "created" | "favorited" | "uploaded";
  label: string;
  at: string;
  href?: string;
};

export function getRecentActivity(notes: Note[], limit = 5): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const note of notes) {
    items.push({
      id: `created-${note.id}`,
      icon: "created",
      label: `Created ${note.title}`,
      at: note.created_at,
      href: notePath(note),
    });

    if (note.is_favorite) {
      items.push({
        id: `fav-${note.id}`,
        icon: "favorited",
        label: `Favorited ${note.title}`,
        at: note.updated_at ?? note.created_at,
        href: notePath(note),
      });
    }

    if (note.attachment_path) {
      items.push({
        id: `file-${note.id}`,
        icon: "uploaded",
        label: `Uploaded ${note.attachment_name ?? "file"}`,
        at: note.updated_at ?? note.created_at,
        href: notePath(note),
      });
    }
  }

  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}

export function getFoldersWithCounts(
  folders: Folder[],
  notes: Note[],
): { folder: Folder; count: number }[] {
  return folders
    .map((folder) => ({
      folder,
      count: notes.filter((n) => n.folder_id === folder.id).length,
    }))
    .sort(
      (a, b) =>
        new Date(b.folder.updated_at ?? b.folder.created_at).getTime() -
        new Date(a.folder.updated_at ?? a.folder.created_at).getTime(),
    )
    .slice(0, 5);
}
