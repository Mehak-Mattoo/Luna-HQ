"use client";

import { useParams } from "next/navigation";
import { NoteDetailPage } from "@/components/pages/NoteDetailPage";
import NotesPage from "@/components/pages/NotesPage";

export default function Page() {
  const params = useParams();
  const segments = params.segments as string[] | undefined;

  if (!segments?.length) {
    return (
      <>
        <NotesPage />
      </>
    );
  }

  if (segments.length === 1) {
    return <NoteDetailPage noteId={segments[0]} />;
  }

  const [folderId, noteId] = segments;
  return <NoteDetailPage noteId={noteId} folderId={folderId} />;
}
