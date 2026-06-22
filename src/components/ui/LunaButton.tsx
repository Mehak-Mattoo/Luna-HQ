"use client";

import Image from "next/image";

import { icons } from "@/assets";
import { cn } from "@/lib/utils";

export type LunaButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
};

export function LunaButton({ onClick, disabled, className }: LunaButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Open Luna chat"
      className={cn(
        "rounded-full transition-opacity hover:opacity-90",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      <Image
        src={icons.luna}
        alt="Luna"
        width={60}
        height={60}
        className="-scale-x-100"
      />
    </button>
  );
}
