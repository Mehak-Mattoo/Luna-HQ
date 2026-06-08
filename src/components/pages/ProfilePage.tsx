"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Camera, KeyRound } from "lucide-react";

import { authRoutes } from "@/app/routes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/client";
import { getInitials } from "@/lib/constants/constants";
import { getProfileFromUser, uploadAvatar } from "@/lib/profileUtils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Field, FieldContent, FieldLabel } from "../ui/field";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const profile = getProfileFromUser(user);
      setUserId(user.id);
      setName(profile.name);
      setEmail(profile.email);
      setAvatarUrl(profile.avatar);
      setIsLoading(false);
    });
  }, []);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2 MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Name is required.");
      return;
    }

    setIsSaving(true);

    const supabase = createClient();

    try {
      let nextAvatarUrl = avatarUrl;

      if (avatarFile) {
        nextAvatarUrl = await uploadAvatar(supabase, userId, avatarFile);
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: trimmedName,
          avatar_url: nextAvatarUrl || undefined,
        },
      });

      if (updateError) throw updateError;

      setAvatarUrl(nextAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Profile updated.");
      router.refresh();
    } catch (err) {
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  const displayAvatar = avatarPreview ?? avatarUrl;

  if (isLoading) {
    return <Skeleton className="h-[200px] w-[200px] rounded-full" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6">
      {isLoading ? (
        <Skeleton className="h-[200px] w-[200px] " />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update your name and avatar. Email cannot be changed here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <div className="relative">
                    <Avatar className="size-24 rounded-xl">
                      <AvatarImage src={displayAvatar} alt={name} />
                      <AvatarFallback className="rounded-xl bg-primary text-2xl text-primary-foreground">
                        {getInitials(name || email)}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="secondary"
                      className="absolute -bottom-2 -right-2 rounded-full shadow-sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSaving}
                    >
                      <Camera className="size-4" />
                      <span className="sr-only">Change avatar</span>
                    </Button>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 text-center sm:text-left">
                    <p className="text-sm font-medium">
                      {name || "No name set"}
                    </p>
                    <p className="text-sm text-muted-foreground">{email}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit self-center sm:self-start"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSaving}
                    >
                      Upload photo
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSaving}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} disabled />
                </div>

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="flex flex-col gap-4">
            <CardHeader>
              <CardTitle className="text-base">Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center ">
                  <Field orientation="horizontal" className="max-w-sm">
                    <FieldContent>
                      <FieldLabel htmlFor="update-password">
                        Update Password
                      </FieldLabel>
                    </FieldContent>
                    <Button variant="outline" asChild>
                      <Link
                        href={authRoutes.UPDATE_PASSWORD}
                        className="inline-flex items-center gap-2"
                      >
                        Update
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </Button>
                  </Field>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
