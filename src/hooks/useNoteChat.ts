"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { apiRoutes } from "@/app/routes";

class ChatRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function useNoteChat(noteId: string | number) {
  return useChat({
    id: `note-chat-${noteId}`,
    transport: new DefaultChatTransport({
      api: apiRoutes.CHAT,
      body: { noteId },
      fetch: async (input, init) => {
        const res = await fetch(input, init);

        if (!res.ok) {
          let message = "Chat request failed";
          try {
            const data = await res.json();
            message = data.error ?? message;
          } catch {
            message = (await res.text()) || message;
          }
          throw new ChatRequestError(message, res.status);
        }

        return res;
      },
    }),
  });
}
