"use client";
import { NoteForm } from "@/components/pages/NoteForm";
import { NewFolder } from "@/components/modals/NewFolder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { protectedRoutes } from "@/app/routes";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [openAddFolder, setOpenAddFolder] = useState(false);
  const [openAddNote, setOpenAddNote] = useState(false);
  const router = useRouter();
  
  const handleAddFolder = () => {
    setOpenAddFolder(true);
  };

  const handleAddNote = () => {
    router.push(protectedRoutes.ALL_NOTES);
  };

  return (
    <div className="px-10 py-5 flex flex-col  justify-center items-center">
      <div className="flex gap-6">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Add a new folder</CardTitle>
          </CardHeader>

          <CardContent>
            Get started by creating a new folder to organize your notes.
          </CardContent>
          <Button className="w-full" onClick={handleAddFolder}>
            Add folder
          </Button>
        </Card>

        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Add a new note</CardTitle>
          </CardHeader>

          <CardContent>
            Get started by creating a new note to add to your folder.
          </CardContent>
          <Button className="w-full" onClick={handleAddNote}>
            Add note
          </Button>
        </Card>
      </div>

      <NewFolder open={openAddFolder} onOpenChange={setOpenAddFolder} />
      <NoteForm
        openDialog={openAddNote}
        onSubmit={handleAddNote}
        onCancel={() => setOpenAddNote(false)}
      />
    </div>
  );
}
