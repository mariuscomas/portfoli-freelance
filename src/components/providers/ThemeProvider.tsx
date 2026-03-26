"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  systemTheme: "dark" | "light";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    // Escolta canvis a nivell de preferències del SO
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };
    
    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);

    // Llegeix del local storage l'estat inicial
    try {
      const stored = localStorage.getItem("theme") as Theme;
      if (stored) setThemeState(stored);
    } catch {}

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Manté actualitzada la classe de l'html
  useEffect(() => {
    const d = document.documentElement;
    const isDark = theme === "dark" || (theme === "system" && systemTheme === "dark");

    if (isDark) {
      d.classList.add("dark");
      d.classList.remove("light");
      d.style.colorScheme = "dark";
    } else {
      d.classList.add("light");
      d.classList.remove("dark");
      d.style.colorScheme = "light";
    }
  }, [theme, systemTheme]);

  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem("theme", newTheme);
    } catch {}
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, systemTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
