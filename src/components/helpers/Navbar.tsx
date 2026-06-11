"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronUp, Heart, LogOut } from "lucide-react";
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
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useFolders } from "@/hooks/useFolders";

type NavbarProps = {
  note?: Note;
};

const Navbar = ({ note }: NavbarProps) => {
  const [isFavorite, setIsFavorite] = useState(note?.is_favorite ?? false);
  const router = useRouter();
  const updateNote = useUpdateNote();
  const [profile, setProfile] = useState({ name: "", email: "", avatar: "" });

  const { data: folders = [] } = useFolders();
  const parentFolder = note?.folder_id
    ? (folders.find((f) => f.id === note.folder_id) ?? null)
    : null;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setProfile(getProfileFromUser(user));
    });
  }, []);

  useEffect(() => {
    setIsFavorite(note?.is_favorite ?? false);
  }, [note?.id, note?.is_favorite]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(authRoutes.LOGIN);
  };

  const handleFavorite = () => {
    if (!note) return;

    const nextFavorite = !note.is_favorite;
    setIsFavorite(nextFavorite);

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
          setIsFavorite(note.is_favorite);
        },
      },
    );
  };

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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleFavorite}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            <Heart
              className="size-5"
              fill={isFavorite ? "currentColor" : "none"}
            />
          </Button>
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
              {/* <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
                {profile.name || profile.email}
              </span> */}
              <ChevronUp className="size-4 text-muted-foreground" />
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
