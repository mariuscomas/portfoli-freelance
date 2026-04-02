"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-[28px] h-[28px] border-2 border-text-secondary flex items-center p-[3px] box-border relative cursor-not-allowed opacity-50">
        <div className="h-full w-[8px] bg-text-main" />
      </div>
    );
  }

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-[28px] h-[28px] border-2 border-text-secondary flex items-center p-[3px] box-border relative hover:border-text-main transition-colors duration-500 ease-in-out"
      aria-label="Alternar Mode de Color"
    >
      <div
        className={`h-full w-[8px] bg-text-main transition-transform duration-500 ease-in-out ${
          isDark ? "translate-x-[10px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}
