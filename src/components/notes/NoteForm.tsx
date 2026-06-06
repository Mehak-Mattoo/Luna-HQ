"use client";

import { useEffect, useState } from "react";
import { Note } from "@/hooks/useNotes";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Field, FieldGroup } from "../ui/field";
import { Textarea } from "../ui/textarea";
import { NoteFormPayload } from "@/hooks/useNotes";

interface NoteFormProps {
  openDialog: boolean;
  note?: Note | null;
  onSubmit: (note: NoteFormPayload) => void;
  onDelete?: () => void;
  onCancel?: () => void;
  isSaving?: boolean;
}

export function NoteForm({
  openDialog,
  note,
  onSubmit,
  onDelete,
  onCancel,
  isSaving = false,
}: NoteFormProps) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
    setFile(null);
  }, [note]);

  return (
    <>
      <Dialog
        open={openDialog}
        onOpenChange={(open) => {
          if (!open) {
            onCancel?.();
          }
        }}
      >
        <form>
          <DialogTrigger asChild></DialogTrigger>
          <DialogContent className="">
            <DialogHeader>
              <DialogTitle>{note ? "Edit note" : "Add a new note"}</DialogTitle>
              <DialogDescription>
                {note ? "" : "Add a new note to your collection."}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Field>
              <Field>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                />
              </Field>

              <Field>
                <Label htmlFor="attachment">Attachment</Label>
                <Input
                  id="attachment"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {note?.attachment_name && (
                  <p className="text-sm">{note.attachment_name}</p>
                )}
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button
                type="submit"
                disabled={isSaving}
                className="cursor-pointer"
                onClick={() =>
                  onSubmit({
                    title: title.trim(),
                    content: content.trim(),
                    file,
                  })
                }
              >
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Dialog>
    </>
  );
}
