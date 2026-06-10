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
  MY_NOTES: "/home/mynotes",
  NOTE: "/home/notes",
  PROFILE: "/home/profile",
  SETTINGS: "/settings",
};

export const apiRoutes = {
  GENERATE: "/api/generate",
  CHAT: "/api/chat",
};
