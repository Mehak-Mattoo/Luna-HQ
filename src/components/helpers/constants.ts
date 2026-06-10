export const TABLE_KEYS = {
  NOTES: "notes",
  FOLDERS: "folders",
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

export const formatUIFriendlyDate = (date: string) => {
  const diff = new Date(date).getTime() - Date.now();

  const minutes = Math.round(diff / (1000 * 60));
  const hours = Math.round(diff / (1000 * 60 * 60));
  const days = Math.round(diff / (1000 * 60 * 60 * 24));

  if (Math.abs(minutes) < 60) {
    return rtf.format(minutes, "minute");
  }

  if (Math.abs(hours) < 24) {
    return rtf.format(hours, "hour");
  }

  return rtf.format(days, "day");
};