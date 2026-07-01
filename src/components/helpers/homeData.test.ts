import { Note } from "@/hooks/useNotes";
import {
  countSince,
  getFolderName,
  getLunaSuggestions,
  getRecentNotes,
} from "./homeData";
import { describe, expect, it, vi } from "vitest";

function mockNote(overrides: Partial<Note> = {}): Note {
  return {
    id: 1,
    user_id: "user-1",
    title: "Test note",
    content: "",
    is_favorite: false,
    attachment_path: null,
    attachment_name: null,
    attachment_mime: null,
    folder_id: null,
    folder_name: null,
    created_at: "2026-06-20T10:00:00.000Z",
    updated_at: null,
    ...overrides,
  };
}

describe("homeData", () => {
  // Example 1: note has no folder → should return null
  it("getFolderName returns null when note has no folder", () => {
    const note = mockNote({ folder_id: null });
    const result = getFolderName(note, []);
    expect(result).toBeNull();
  });

  // Example 2: two notes → newer one should be first
  it("getRecentNotes puts the newest note first", () => {
    const older = mockNote({
      id: 1,
      title: "second",
      created_at: "2026-06-01T10:00:00.000Z",
    });
    const newer = mockNote({
      id: 2,
      title: "first",
      created_at: "2026-06-20T10:00:00.000Z",
    });
    const result = getRecentNotes([older, newer]);
    expect(result[0].title).toBe("first");
  });

  it("getLunaSuggestions suggests organizing uncategorized notes", () => {
    const note = mockNote({ folder_id: null });
    const result = getLunaSuggestions([note]);
    expect(result[0].id).toBe("uncategorized");
  });
    
    it("getLunaSuggestions suggests summarizing long notes", () => {
      const longContent = "mehak".repeat(401); // 401 chars = "long"
    
        const note1 = mockNote({
         id: 1,
         folder_id: "folder-1", // has a folder so uncategorized won't show
         content: longContent,
       });
       const note2 = mockNote({
         id: 2,
         folder_id: "folder-1",
         content: longContent,
       });
        
        const result = getLunaSuggestions([note1, note2]);
        
    expect(result.some((s) => s.id === "unsummarized")).toBe(true);
    });

  it("countSince counts notes created in the last week", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-20T12:00:00.000Z"));

    const notes = [
      mockNote({ created_at: "2026-06-20T10:00:00.000Z" }),
      mockNote({ created_at: "2026-06-09T10:00:00.000Z" }),
      mockNote({ created_at: "2026-06-08T10:00:00.000Z" }),
    ];
    const result = countSince(notes);
    expect(result).toBe(1);

    vi.useRealTimers();
  });
});
