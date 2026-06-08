export const authRoutes = {
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  UPDATE_PASSWORD: "/auth/update-password",
  FORGOT_PASSWORD: "/auth/forgot-password",
  SIGNUP_SUCCESS: "/auth/signup/success",
  AUTH_ERROR: "/auth/error",
};

export const protectedRoutes = {
  HOME: "/home",
  ALL_NOTES: "/home/notes",
  PROFILE: "/home/profile",
};

export const apiRoutes = {
  GENERATE: "/api/generate",
  CHAT: "/api/chat",
};

export function notePath(note: {
  id: string | number;
  folder_id?: string | null;
}) {
  const id = String(note.id);
  if (note.folder_id) {
    return `${protectedRoutes.ALL_NOTES}/${note.folder_id}/${id}`;
  }
  return `${protectedRoutes.ALL_NOTES}/${id}`;
}

export function myNotesPath(folderId?: string | null) {
  if (folderId) {
    return `${protectedRoutes.ALL_NOTES}?folder=${folderId}`;
  }
  return protectedRoutes.ALL_NOTES;
}
