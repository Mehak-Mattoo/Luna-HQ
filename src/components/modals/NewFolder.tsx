"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateFolder, useUpdateFolder } from "@/hooks/useFolders";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type NewFolderProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder?: { id: string; name: string } | null;
};

export function NewFolder({ open, onOpenChange, folder }: NewFolderProps) {
  const isRename = !!folder;
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const [folderName, setFolderName] = useState("");

  const isPending = isRename ? updateFolder.isPending : createFolder.isPending;

  function handleOpenChange(next: boolean) {
    if (next) {
      setFolderName(folder?.name ?? "");
    }
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = folderName.trim();
    if (!trimmed) return;

    if (isRename && folder) {
      await updateFolder.mutateAsync({ id: folder.id, name: trimmed });
    } else {
      await createFolder.mutateAsync({ name: trimmed });
    }

    setFolderName("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isRename ? "Rename folder" : "New folder"}
            </DialogTitle>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <Label htmlFor="folder-name">Folder name</Label>
              <Input
                id="folder-name"
                name="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isRename ? (
                "Save"
              ) : (
                "Create folder"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
