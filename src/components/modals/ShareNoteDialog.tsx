"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Globe,
  Link2,
  Lock,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { getInitials } from "@/components/helpers/constants";
import { sharedNotePath } from "@/components/helpers/routes";
import {
  useInviteToNote,
  useNoteShares,
  useRemoveShare,
  useUpdateNoteLinkShare,
  useUpdateSharePermission,
  type SharePermission,
} from "@/hooks/useNoteShares";
import type { Note } from "@/hooks/useNotes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ShareNoteDialogProps = {
  note: Note;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerProfile: { name: string; email: string; avatar: string };
};

const PERMISSION_OPTIONS: {
  value: SharePermission;
  label: string;
  description: string;
}[] = [
  {
    value: "edit",
    label: "Can edit",
    description: "Edit, suggest, and comment",
  },
  {
    value: "view",
    label: "Can view",
    description: "View only",
  },
];

function permissionLabel(permission: SharePermission) {
  return (
    PERMISSION_OPTIONS.find((o) => o.value === permission)?.label ?? "Can view"
  );
}

type PersonRowProps = {
  name: string;
  email: string;
  avatar?: string;
  permissionLabel: string;
  isOwner?: boolean;
  permission?: SharePermission;
  onPermissionChange?: (permission: SharePermission) => void;
  onRemove?: () => void;
};

function PersonRow({
  name,
  email,
  avatar,
  permissionLabel: permLabel,
  isOwner,
  permission,
  onPermissionChange,
  onRemove,
}: PersonRowProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback className="text-xs">
          {getInitials(name || email)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <h6 className="truncate font-medium">{name || email}</h6>
        <h6 className="truncate text-muted-foreground">{email}</h6>
      </div>

      {isOwner ? (
        <span className="shrink-0  text-muted-foreground">Full access</span>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 gap-1 px-2 text-sm text-muted-foreground"
            >
              {permLabel}
              <ChevronDown className="size-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              User access
            </DropdownMenuLabel>
            {PERMISSION_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                className="flex flex-col items-start gap-0.5 py-2"
                onClick={() => onPermissionChange?.(option.value)}
              >
                <span className="flex w-full items-center justify-between text-sm">
                  {option.label}
                  {permission === option.value && (
                    <Check className="size-4 text-primary" />
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="gap-2"
              onClick={onRemove}
            >
              <Trash2 className="size-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function ShareNoteDialog({
  note,
  open,
  onOpenChange,
  ownerProfile,
}: ShareNoteDialogProps) {
  const [email, setEmail] = useState("");

  const { data: shares = [], isLoading } = useNoteShares(note.id);
  const invite = useInviteToNote();
  const updatePermission = useUpdateSharePermission();
  const removeShare = useRemoveShare();
  const updateLinkShare = useUpdateNoteLinkShare();

  const shareUrl =
    note.share_token && typeof window !== "undefined"
      ? `${window.location.origin}${sharedNotePath(note.share_token)}`
      : "";

  const ownerName = ownerProfile.name ? `${ownerProfile.name} (You)` : "You";

  async function handleInvite() {
    const trimmed = email.trim();
    if (!trimmed) return;

    try {
      await invite.mutateAsync({ noteId: note.id, email: trimmed });
      setEmail("");
      toast.success(`Invited ${trimmed}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invite");
    }
  }

  async function handleCopyLink() {
    try {
      if (!note.is_shared || !note.share_token) {
        const updated = await updateLinkShare.mutateAsync({
          noteId: note.id,
          enabled: true,
          permission: "view",
        });
        const url = `${window.location.origin}${sharedNotePath(String(updated.share_token))}`;
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="space-y-0 px-5 pt-5 pb-0">
          <DialogTitle className="text-sm! ">Share note</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-5 py-4">
          {/* Invite row */}
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Email or group, separated by commas"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleInvite();
              }}
              className="h-10 flex-1"
            />
            <Button
              className="shrink-0 bg-primary hover:bg-primary-hover"
              onClick={() => void handleInvite()}
              disabled={invite.isPending || !email.trim()}
            >
              Invite
            </Button>
          </div>

          {/* People with access */}
          <div>
            <h6 className="mb-1 font-medium text-muted-foreground">
              People with access
            </h6>
            <PersonRow
              name={ownerName}
              email={ownerProfile.email}
              avatar={ownerProfile.avatar}
              permissionLabel="Full access"
              isOwner
            />
            {isLoading ? (
              <h6 className="py-2  text-muted-foreground">Loading…</h6>
            ) : (
              shares.map((share) => (
                <PersonRow
                  key={share.id}
                  name={share.shared_with_email.split("@")[0]}
                  email={share.shared_with_email}
                  permission={share.permission}
                  permissionLabel={permissionLabel(share.permission)}
                  onPermissionChange={(permission) => {
                    void updatePermission.mutateAsync({
                      shareId: share.id,
                      noteId: note.id,
                      permission,
                    });
                  }}
                  onRemove={() => {
                    void removeShare.mutateAsync({
                      shareId: share.id,
                      noteId: note.id,
                    });
                  }}
                />
              ))
            )}
          </div>

          {/* General access */}
          <div className="border-t border-border pt-4">
            <h6 className="mb-2 font-medium text-muted-foreground">
              General access
            </h6>
            <div className="flex items-center justify-between gap-3 rounded-lg py-1">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                  {note.is_shared ? (
                    <Globe className="size-4 text-muted-foreground" />
                  ) : (
                    <Lock className="size-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h6 className=" font-medium">
                    {note.is_shared
                      ? "Anyone with the link"
                      : "Only people invited"}
                  </h6>
                  <span className=" text-muted-foreground">
                    {note.is_shared ? "Can view" : "Private to invitees"}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => void handleCopyLink()}
                disabled={updateLinkShare.isPending}
              >
                {note.is_shared ? (
                  <>
                    <Copy className="size-3.5" />
                   <h6> Copy link</h6>
                  </>
                ) : (
                  <>
                    <Link2 className="size-3.5" />
                    <h6>Share link</h6>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
