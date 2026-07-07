export const TABLE_KEYS = {
  NOTES: "notes",
  FOLDERS: "folders",
  NOTE_SHARES: "shared_notes",
  NOTE_FAVORITES: "note_favorites",
  AI_ACTIONS: "ai_actions",
  NOTIFICATIONS: "notifications",
};

export const LUNA = "Luna";

export const BUCKET = "note-attachments";
export const AVATARS_BUCKET = "avatars";
export const MODEL_NAME = "gemini-2.5-flash";

export const getInitials = (name: string): string => {
  return name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const RELATIVE_THRESHOLD_DAYS = 7;

export const formatUIFriendlyDate = (date: string) => {
  const then = new Date(date);
  if (Number.isNaN(then.getTime())) return "";

  const diffMs = then.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Past/future beyond threshold → switch to date after this
  if (Math.abs(diffDays) >= RELATIVE_THRESHOLD_DAYS) {
    return then.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const minutes = Math.round(diffMs / (1000 * 60));
  const hours = Math.round(diffMs / (1000 * 60 * 60));

  if (Math.abs(minutes) < 60) {
    return rtf.format(minutes, "minute");
  }

  if (Math.abs(hours) < 24) {
    return rtf.format(hours, "hour");
  }

  return rtf.format(diffDays, "day");
};

export const getSnippet = (text: string, query: string, radius = 25) => {
  const i = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (i === -1) return text.slice(0, 100);
  const start = Math.max(0, i - radius);
  const end = Math.min(text.length, i + query.length + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end)}${suffix}`;
};

const TAG_STYLES = [
  "bg-violet-500/15 text-violet-400 ring-violet-500/20",
  "bg-emerald-500/15 text-emerald-400 ring-emerald-500/20",
  "bg-sky-500/15 text-sky-400 ring-sky-500/20",
  "bg-amber-500/15 text-amber-400 ring-amber-500/20",
] as const;

export function getFolderTagStyle(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_STYLES[Math.abs(hash) % TAG_STYLES.length];
}
