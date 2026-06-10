"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, FolderPlus, Sparkles } from "lucide-react";

import { NewFolder } from "@/components/modals/NewFolder";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFolders } from "@/hooks/useFolders";
import { protectedRoutes } from "@/components/helpers/routes";
import { getGreeting, LUNA } from "@/components/helpers/constants";
import { getProfileFromUser } from "@/lib/profileUtils";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type ActionCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonLabel: string;
  onClick: () => void;
  accent?: "default" | "muted";
};

function ActionCard({
  title,
  description,
  icon,
  buttonLabel,
  onClick,
  accent = "default",
}: ActionCardProps) {
  return (
    <Card className={cn("h-full ", accent === "muted" && "bg-muted/30")}>
      <CardHeader className="gap-2">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          {icon}
        </div>
        <div className="">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardFooter>
        <Button className="w-full" size="lg" onClick={onClick}>
          {buttonLabel}
          <ArrowRight className="size-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [openAddFolder, setOpenAddFolder] = useState(false);
  const [userName, setUserName] = useState("");

  const greeting = getGreeting();
  const firstName = userName.split(" ")[0];

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const profile = getProfileFromUser(user);
      setUserName(profile.name);
    });
  }, []);

  function handleAddNote() {
    router.push(`${protectedRoutes.ALL_NOTES}?create=1`);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8  ">
      <section className="space-y-4">
        <div className="text-center flex flex-col items-center gap-2 mb-10">
          <h1 className=" font-medium text-muted-foreground">
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <h5 className="  text-muted-foreground">
            Jump in with the most common tasks.
          </h5>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ActionCard
            title="Create a folder"
            description="Group related notes together so everything stays easy to find."
            icon={<FolderPlus className="size-6" />}
            buttonLabel="New folder"
            onClick={() => setOpenAddFolder(true)}
          />
          <ActionCard
            title="Write a note"
            description="Capture a thought, meeting summary, or anything worth remembering."
            icon={<FileText className="size-6" />}
            buttonLabel="New note"
            onClick={handleAddNote}
            accent="muted"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Browse your notes
            </CardTitle>
            <CardDescription>
              View everything in one place, filter by folder, and open any note
              to edit or summarize.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" size="lg">
              <Link href={protectedRoutes.ALL_NOTES}>
                Go to all notes
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-primary/15 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Meet {LUNA}</CardTitle>
            <CardDescription className="leading-relaxed">
              Open any note and hover over the {LUNA} button to summarize or ask
              questions about what you wrote.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <NewFolder open={openAddFolder} onOpenChange={setOpenAddFolder} />
    </div>
  );
}
