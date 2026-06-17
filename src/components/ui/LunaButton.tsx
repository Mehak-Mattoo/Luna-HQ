"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { LUNA } from "@/components/helpers/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { icons } from "@/assets";

export type LunaActionOption = {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export type LunaButtonProps = {
  options: LunaActionOption[];
  isBusy?: boolean;
};

export function LunaButton({ options, isBusy = false }: LunaButtonProps) {
  return (
    <HoverCard openDelay={80} closeDelay={120}>
      <HoverCardTrigger asChild>
        <div className="">
          <Image
            src={icons.lunaGif}
            alt="Luna"
            width={80}
            height={80}
            className="-scale-x-100"
          />
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        align="end"
        side="top"
        sideOffset={8}
        className="w-56 p-1"
      >
        <ul className="flex flex-col gap-0.5" role="menu">
          {options.map((option) => (
            <li key={option.id} role="none">
              <button
                type="button"
                role="menuitem"
                disabled={option.disabled || isBusy}
                onClick={option.onClick}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "disabled:pointer-events-none disabled:opacity-50",
                )}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
}
