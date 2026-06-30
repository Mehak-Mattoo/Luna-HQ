"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Field, FieldContent, FieldLabel } from "./field";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <>
      <Field orientation="horizontal" className="max-w-sm">
        <FieldContent>
          <FieldLabel htmlFor="theme-toggle">Dark Mode</FieldLabel>
        </FieldContent>
        <Switch
          className="bg-accent/70! hover:bg-accent/60"
          id="theme-toggle"
          checked={theme === "dark"}
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        />
      </Field>
    </>
  );
}
