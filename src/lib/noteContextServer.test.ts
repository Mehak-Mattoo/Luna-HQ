import { describe, expect, it, vi } from "vitest";
import { loadNoteWithAccess } from "./noteContextServer";
import type { Note } from "@/hooks/useNotes";
import { SupabaseClient } from "@supabase/supabase-js";

const sampleNote: Note = {
  id: 1,
  user_id: "user-1",
  title: "My meeting",
  content: "Discuss roadmap",
  is_favorite: false,
  attachment_path: null,
  attachment_name: null,
  attachment_mime: null,
  folder_id: null,
  folder_name: null,
  created_at: "2026-06-20T10:00:00.000Z",
  updated_at: null,
};

//Pretend Supabase has one table (notes) and returns one note when asked
function mockSupabaseWithNote(note: Record<string, unknown> | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: note, error: null });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as unknown as SupabaseClient;
}

//Pretend Supabase has two tables: notes and shared_notes
function mockSupabase({
  note,
  shareRow = null,
}: {
  note: Record<string, unknown> | null;
  shareRow?: { permission: string } | null;
}) {
  const notesMaybeSingle = vi
    .fn()
    .mockResolvedValue({ data: note, error: null });

  const sharesMaybeSingle = vi
    .fn()
    .mockResolvedValue({ data: shareRow, error: null });

  const notesEq = vi.fn().mockReturnValue({ maybeSingle: notesMaybeSingle });
  const notesSelect = vi.fn().mockReturnValue({ eq: notesEq });

  const sharesEq2 = vi.fn().mockReturnValue({ maybeSingle: sharesMaybeSingle });
  const sharesEq1 = vi.fn().mockReturnValue({ eq: sharesEq2 });
  const sharesSelect = vi.fn().mockReturnValue({ eq: sharesEq1 });

  const from = vi.fn((table: string) => {
    if (table === "notes") return { select: notesSelect };
    if (table === "shared_notes") return { select: sharesSelect };
    throw new Error(`Unexpected table: ${table}`);
  });

  return { from } as unknown as SupabaseClient;
}

describe("loadNoteWithAccess", () => {
  it("returns owner when user owns the note", async () => {
    const supabase = mockSupabaseWithNote({
      id: 1,
      user_id: "user-1",
      title: "Test",
      content: "Hi",
      is_favorite: false,
      attachment_path: null,
      attachment_name: null,
      attachment_mime: null,
      folder_id: null,
      folder_name: null,
      created_at: "2026-06-20T10:00:00.000Z",
      share_token: null,
      is_shared: false,
      share_permission: "private",
    });

    const result = await loadNoteWithAccess(supabase, 1, {
      userId: "user-1",
    });
    expect(result.access).toBe("owner");
    expect(result.note.title).toBe("Test");
  });

  it("returns view access with a valid share token", async () => {
    const supabase = mockSupabaseWithNote({
      id: 1,
      user_id: "owner-id",
      title: "Shared note",
      content: "Secret",
      is_favorite: false,
      attachment_path: null,
      attachment_name: null,
      attachment_mime: null,
      folder_id: null,
      folder_name: null,
      created_at: "2026-06-20T10:00:00.000Z",
      share_token: "token-abc",
      is_shared: true,
      share_permission: "view",
    });

    const result = await loadNoteWithAccess(supabase, 1, {
      userId: "someone-else",
      shareToken: "token-abc",
    });

    expect(result.access).toBe("view");
  });

  it("throws Forbidden when user is not owner and has no share permission", async () => {
    const supabase = mockSupabase({
      note: {
        id: 1,
        user_id: "owner-id",
        title: "Private note",
        content: "Secret",
        is_favorite: false,
        attachment_path: null,
        attachment_name: null,
        attachment_mime: null,
        folder_id: null,
        folder_name: null,
        created_at: "2026-06-20T10:00:00.000Z",
        share_token: null,
        is_shared: false,
        share_permission: "private",
      },
      shareRow: null, // no row in shared_notes
    });

    await expect(
      loadNoteWithAccess(supabase, 1, { userId: "someone-else" }),
    ).rejects.toMatchObject({ status: 403, message: "Forbidden" });
  });
});
