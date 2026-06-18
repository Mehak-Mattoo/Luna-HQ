"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  FileText,
  Folder,
  FolderOpen,
  Heart,
  Paperclip,
  Search,
  Sparkles,
  Star,
  Upload,
} from "lucide-react";

import { NewFolder } from "@/components/modals/NewFolder";
import SearchModal from "@/components/modals/SearchModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  countSince,
  getFolderName,
  getFoldersWithCounts,
  getLunaSuggestions,
  getRecentActivity,
  getRecentNotes,
} from "@/components/helpers/homeData";
import { myNotesPath, notePath, protectedRoutes } from "@/components/helpers/routes";
import { formatUIFriendlyDate, getGreeting, LUNA } from "@/components/helpers/constants";
import { useFolders } from "@/hooks/useFolders";
import { useNotes } from "@/hooks/useNotes";
import { getProfileFromUser } from "@/lib/profileUtils";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { icons } from "@/assets";

function HomePageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-36 rounded-xl" />
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: number;
  delta: number;
  icon: React.ReactNode;
  iconClassName: string;
};

function StatCard({ label, value, delta, icon, iconClassName }: StatCardProps) {
  return (
    <Card className="gap-0 py-4 ring-1 ring-border/60 bg-card">
      <CardContent className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-lg",
              iconClassName,
            )}
          >
            {icon}
          </div>
        <div className="">
          <h5 className="font-medium tracking-tight">{value}</h5>
          <h6 className="text-muted-foreground">{label}</h6>
          {delta > 0 && (
            <span className="font-medium text-emerald-500">
              +{delta} this week
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type SectionHeaderProps = {
  title: string;
  action?: { label: string; href: string };
};

function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h3 className="text-lg font-medium text-">{title}</h3>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {action.label}
          <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

const ACTIVITY_ICONS = {
  created: FileText,
  favorited: Star,
  uploaded: Upload,
} as const;

export default function HomePage() {
  const router = useRouter();
  const [openAddFolder, setOpenAddFolder] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userName, setUserName] = useState("");

  const { data: notes = [], isLoading: notesLoading } = useNotes();
  const { data: folders = [], isLoading: foldersLoading } = useFolders();

  const greeting = getGreeting();
  const firstName = userName.split(" ")[0];

  const stats = useMemo(
    () => ({
      notes: notes.length,
      folders: folders.length,
      files: notes.filter((n) => n.attachment_path).length,
      favorites: notes.filter((n) => n.is_favorite).length,
      aiActions: 0,
      notesThisWeek: countSince(notes),
      foldersThisWeek: countSince(folders),
      filesThisWeek: countSince(
        notes.filter((n) => n.attachment_path),
      ),
    }),
    [notes, folders],
  );

  const recentNotes = useMemo(() => getRecentNotes(notes, 4), [notes]);
  const suggestions = useMemo(() => getLunaSuggestions(notes), [notes]);
  const activity = useMemo(() => getRecentActivity(notes, 5), [notes]);
  const foldersWithCounts = useMemo(
    () => getFoldersWithCounts(folders, notes),
    [folders, notes],
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const profile = getProfileFromUser(user);
      setUserName(profile.name);
    });
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (notesLoading || foldersLoading) {
    return <HomePageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8 pb-4 bg-background">
      {/* Greeting */}
      <section className="space-y-2">
        <h1 className="font-medium! tracking-tight sm:text-3xl">
          👋 {greeting}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        {/* <p className="text-sm text-muted-foreground sm:text-lg">
          You have {stats.notes} notes, {stats.folders} folders
          {stats.aiActions > 0 && ` and ${stats.aiActions} AI actions this month`}
          .
        </p> */}
      </section>

      {/* Search */}
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground shadow-xs ring-1 ring-foreground/5 transition-colors hover:border-violet-500/30 hover:bg-muted/30"
      >
        <span className="flex items-center gap-2.5">
          <Search className="size-4 shrink-0" />
          Search notes, folders...
        </span>
        <kbd className="hidden rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground sm:inline-block">
          ⌘ K
        </kbd>
      </button>

      {/* Stats */}
      <section>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Notes"
            value={stats.notes}
            delta={stats.notesThisWeek}
            icon={<FileText className="size-5 text-violet-400" />}
            iconClassName="bg-violet-500/15"
          />
          <StatCard
            label="Folders"
            value={stats.folders}
            delta={stats.foldersThisWeek}
            icon={<Folder className="size-5 text-amber-400" />}
            iconClassName="bg-amber-500/15"
          />
          <StatCard
            label="AI Actions"
            value={stats.aiActions}
            delta={0}
            icon={<Sparkles className="size-5 text-violet-300" />}
            iconClassName="bg-violet-500/15"
          />
          <StatCard
            label="Files"
            value={stats.files}
            delta={stats.filesThisWeek}
            icon={<Paperclip className="size-5 text-emerald-400" />}
            iconClassName="bg-emerald-500/15"
          />
        </div>
      </section>

      {/* Continue */}
      <section>
        <SectionHeader
          title="Continue where you left off"
          action={{ label: "View all", href: protectedRoutes.ALL_NOTES }}
        />
        {recentNotes.length === 0 ? (
          <Card className="py-8">
            <CardContent className="text-center text-sm text-muted-foreground">
              No notes yet.{" "}
              <button
                type="button"
                className="text-violet-400 underline-offset-2 hover:underline"
                onClick={() =>
                  router.push(`${protectedRoutes.ALL_NOTES}?create=1`)
                }
              >
                Create your first note
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {recentNotes.map((note, index) => {
              const folderName = getFolderName(note, folders);
              return (
                <Link
                  key={note.id}
                  href={notePath(note)}
                  className={cn(
                    "group rounded-xl border bg-card p-4 shadow-xs ring-1 ring-foreground/5 transition-all hover:border-violet-500/30 hover:shadow-md",
                    index === 0 && "border-b-2 border-b-violet-500",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <FileText className="size-4 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h6 className="truncate font-medium">{note.title}</h6>
                      {folderName && (
                        <h6 className=" truncate text-xs text-muted-foreground">
                          {folderName}
                        </h6>
                      )}
                      <span className=" text-muted-foreground">
                        Edited{" "}
                        {formatUIFriendlyDate(
                          note.updated_at ?? note.created_at,
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Luna hero */}
      <Card className="overflow-hidden border-violet-500/20 bg-linear-to-br from-violet-600/10 via-card to-card py-0 ring-1 ring-violet-500/20">
        <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Image src={icons.luna} alt="Luna" width={100} height={100} />
            <div>
              <h5 className="font-medium">{LUNA} Assistant</h5>
              <h6 className=" text-muted-foreground">
                What would you like to do today?
              </h6>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              {
                label: "Summarize today's notes",
                onClick: () => {
                  const today = recentNotes[0];
                  if (today) router.push(notePath(today));
                  else router.push(protectedRoutes.ALL_NOTES);
                },
              },
              {
                label: "Find notes about a topic",
                onClick: () => setSearchOpen(true),
              },
              {
                label: "Create a new note",
                onClick: () =>
                  router.push(`${protectedRoutes.ALL_NOTES}?create=1`),
              },
              {
                label: `Ask ${LUNA} anything`,
                onClick: () => {
                  const target = recentNotes[0];
                  if (target) router.push(notePath(target));
                },
              },
            ].map((action) => (
              <Button
                key={action.label}
                variant="secondary"
                size="lg"
                className="justify-start font-normal! bg-background/60 text-left hover:bg-violet-500/10"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Suggestions + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="py-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">
              Suggestions by {LUNA}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {suggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You&apos;re all caught up. Keep writing and {LUNA} will suggest
                next steps.
              </p>
            ) : (
              suggestions.map((item) => (
                <div key={item.id}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="flex items-start gap-2 rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-muted/50"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-violet-400" />
                      {item.text}
                    </Link>
                  ) : (
                    <p className="flex items-start gap-2 px-2 py-2.5 text-sm">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-violet-400" />
                      {item.text}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="py-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Activity will show up here as you create notes and upload files.
              </p>
            ) : (
              activity.map((item) => {
                const Icon = ACTIVITY_ICONS[item.icon];
                const row = (
                  <div className="flex items-start gap-3 rounded-lg px-2 py-2.5">
                    <div className="flex size-5 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="size-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h6 className="truncate text-sm">{item.label}</h6>
                      <span className="capitalize text-muted-foreground">
                        {formatUIFriendlyDate(item.at)}
                      </span>
                    </div>
                  </div>
                );
                return item.href ? (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block transition-colors hover:bg-muted/50"
                  >
                    {row}
                  </Link>
                ) : (
                  <div key={item.id}>{row}</div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Folders + Quick access */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="relative overflow-hidden py-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">
              Browse by folder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {foldersWithCounts.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  No folders yet. Group your notes to stay organized.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenAddFolder(true)}
                >
                  <FolderOpen className="size-4" />
                  New folder
                </Button>
              </div>
            ) : (
              foldersWithCounts.map(({ folder, count }) => (
                <Link
                  key={folder.id}
                  href={myNotesPath(folder.id)}
                  className="flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <span className="flex items-center gap-2.5 text-sm">
                    <Folder className="size-4 text-amber-400" />
                    {folder.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {count} note{count === 1 ? "" : "s"}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
          <FolderOpen className="pointer-events-none absolute -right-4 -bottom-4 size-28 text-muted/20" />
        </Card>

        <Card className="py-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">
              Quick Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              {
                label: "Favorites",
                count: stats.favorites,
                href: protectedRoutes.ALL_NOTES,
                icon: Heart,
              },
              {
                label: "All notes",
                count: stats.notes,
                href: protectedRoutes.ALL_NOTES,
                icon: FileText,
              },
              {
                label: "Attachments",
                count: stats.files,
                href: protectedRoutes.ALL_NOTES,
                icon: Paperclip,
              },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
              >
                <span className="flex items-center gap-2.5 text-sm">
                  <item.icon className="size-4 text-muted-foreground" />
                  {item.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.count}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Footer quote */}
      <Card className="border-violet-500/10 bg-muted/20 py-2">
        <CardContent className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm italic text-muted-foreground">
              &ldquo;The more you capture, the more {LUNA} {""} can help you
              create.&rdquo;
            </p>
          </div>
          <div className="flex items-center gap-2  text-muted-foreground">
            — {LUNA}
            <Image
              src={icons.luna}
              alt="Luna"
              width={80}
              height={80}
              className="-scale-x-100"
            />
          </div>
        </CardContent>
      </Card>

      <NewFolder open={openAddFolder} onOpenChange={setOpenAddFolder} />
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
