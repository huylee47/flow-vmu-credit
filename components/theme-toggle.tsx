"use client";

import * as React from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  const handleToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    if (typeof document !== "undefined" && (document as any).startViewTransition) {
      (document as any).startViewTransition(() => {
        flushSync(() => {
          setTheme(nextTheme);
        });
      });
    } else {
      setTheme(nextTheme);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="relative overflow-hidden group hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
      title="Chuyển chế độ Sáng/Tối"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 group-hover:rotate-45" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 group-hover:-rotate-12" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
