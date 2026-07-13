"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, LogOut, Share2, Star } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "./constants";
import { myNotesPath, protectedRoutes } from "./routes";
import type { Note } from "@/hooks/useNotes";
import { useToggleFavorite } from "@/hooks/useNoteFavorites";
import { useSignOut } from "@/hooks/useSignOut";
import { getProfileFromUser } from "@/lib/profileUtils";
import { useAuth } from "@/components/wrapper/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useFolders } from "@/hooks/useFolders";
import { ShareNoteDialog } from "@/components/modals/ShareNoteDialog";
import { NotificationSystem } from "@/components/helpers/NotificationSystem";

type NavbarProps = {
  note?: Note;
};

const Navbar = ({ note }: NavbarProps) => {
  const toggleFavorite = useToggleFavorite();
  const signOut = useSignOut();
  const { user } = useAuth();
  const profile = useMemo(() => getProfileFromUser(user), [user]);
  const [shareOpen, setShareOpen] = useState(false);
  const { data: folders = [] } = useFolders();
  const parentFolder = note?.folder_id
    ? (folders.find((f) => f.id === note.folder_id) ?? null)
    : null;

  const handleFavorite = () => {
    if (!note) return;

    const nextFavorite = !note.is_favorite;

    toggleFavorite.mutate(
      { noteId: note.id, favorited: nextFavorite },
      {
        onSuccess: () => {
          toast.success(
            `${nextFavorite ? "Added to" : "Removed from"} Favorites`,
          );
        },
        onError: () => {
          toast.error("Failed to update note");
        },
      },
    );
  };

  const isFavorite = note?.is_favorite ?? false;

  const isExactHomePath = usePathname() === protectedRoutes.HOME;

  return (
    <div className="w-full flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            {!isExactHomePath && (
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={protectedRoutes.HOME}>Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            )}

            {parentFolder && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={myNotesPath(parentFolder.id)}>
                      {parentFolder.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            {note && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{note.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-5">
        {note && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleFavorite}
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              <Star
                className="size-4"
                fill={isFavorite ? "currentColor" : "none"}
              />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShareOpen(true)}
              aria-label="Share note"
            >
              <Share2 className="size-4" />
              <h6 className="pl-2"> Share</h6>
            </Button>

            <ShareNoteDialog
              note={note}
              open={shareOpen}
              onOpenChange={setShareOpen}
              ownerProfile={profile}
            />
          </>
        )}


        <NotificationSystem />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2 px-2">
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="rounded-lg bg-accent/60 text-primary-foreground">
                  {getInitials(profile.name || profile.email)}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem disabled className="text-muted-foreground">
              {profile.name}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={protectedRoutes.PROFILE}
                className="flex cursor-pointer items-center gap-2"
              >
                View Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={signOut}
            >
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Navbar;
