"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Link2, LogOut, Share, Star } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "./constants";
import { authRoutes, myNotesPath, protectedRoutes } from "./routes";
import { Note, useUpdateNote } from "@/hooks/useNotes";
import { getProfileFromUser } from "@/lib/profileUtils";
import { supabase } from "@/lib/supabase";
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

type NavbarProps = {
  note?: Note;
};

const Navbar = ({ note }: NavbarProps) => {
  const router = useRouter();
  const updateNote = useUpdateNote();
  const [profile, setProfile] = useState({ name: "", email: "", avatar: "" });
  const [shareOpen, setShareOpen] = useState(false);

  const { data: folders = [] } = useFolders();
  const parentFolder = note?.folder_id
    ? (folders.find((f) => f.id === note.folder_id) ?? null)
    : null;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setProfile(getProfileFromUser(user));
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(authRoutes.LOGIN);
  };

  const handleFavorite = () => {
    if (!note) return;

    const nextFavorite = !note.is_favorite;

    updateNote.mutate(
      {
        ...note,
        is_favorite: nextFavorite,
      },
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

      <div className="flex items-center">
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
              <Link2 className="size-4 rotate-130" />
            </Button>

            <ShareNoteDialog
              note={note}
              open={shareOpen}
              onOpenChange={setShareOpen}
              ownerProfile={profile}
            />
          </>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2 px-2">
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
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
              onClick={handleSignOut}
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
