"use client";
import { useT } from "@/core/i18n/client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const t = useT();
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      aria-label={t.common.theme}
      title={t.common.theme}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm hover:bg-accent"
    >
      <Sun className="h-4 w-4 text-coral dark:hidden" />
      <Moon className="hidden h-4 w-4 dark:block" />
    </button>
  );
}
