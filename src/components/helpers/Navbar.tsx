"use client";
import { Note, useUpdateNote } from "@/hooks/useNotes";
import { ChevronUp, Heart, LogOut, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { AvatarImage } from "../ui/avatar";
import { SidebarMenuButton } from "../ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { DropdownMenuTrigger } from "../ui/dropdown-menu";
import { getInitials } from "./constants";
import { authRoutes, protectedRoutes } from "./routes";
import { createClient } from "@/lib/client";
import { redirect, useRouter } from "next/navigation";
import { getProfileFromUser } from "@/lib/profileUtils";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type NavbarProps = {
  note: Note;
};

const Navbar = ({ note }: NavbarProps) => {
  const [isFavorite, setIsFavorite] = useState(note.is_favorite);
  const router = useRouter();
  const updateNote = useUpdateNote();
  const [profile, setProfile] = useState({ name: "", email: "", avatar: "" });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setProfile(getProfileFromUser(user));
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(authRoutes.LOGIN);
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    updateNote.mutate(
      {
        ...note,
        is_favorite: !note.is_favorite,
      },
      {
        onSuccess: () => {
          toast.success(
            `${note.is_favorite ? "Removed from" : "Added to"} Favorites`,
          );
        },
        onError: () => {
          toast.error("Failed to update note");
        },
      },
    );
  };
  return (
    <div className="absolute top-0 right-0 z-50 p-1 flex items-center justify-between bg-background/50 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <h2 className="mt-4 font-medium!">{}</h2>
      </div>
      <div className="flex items-center gap-2">
        <Heart
          className="cursor-pointer size-6"
          onClick={() => handleFavorite()}
          fill={isFavorite ? "white" : "none"}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" tooltip={note.title}>
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={profile.avatar} alt={note.title} />
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                  {getInitials(note.title)}
                </AvatarFallback>
              </Avatar>

              <ChevronUp className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="end" className="w-56">
            <DropdownMenuItem>
              {profile.name}
              {/* <span className="truncate text-xs text-muted-foreground">
                {profile.email}
              </span> */}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                href={protectedRoutes.PROFILE}
                className="flex cursor-pointer items-center gap-2"
              >
                View Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 text-destructive "
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
