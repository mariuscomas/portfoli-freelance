"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  systemTheme: "dark" | "light";
  /**
   * Resolt: si l'usuari està en mode "dark" o si "system" resol a dark.
   * Permet als components saber el "mode efectiu" actual sense duplicar lògica.
   */
  resolvedTheme: "dark" | "light";
  /**
   * Activa un mode dark temporal (efecte "cinema/ambient") sense escriure
   * res a localStorage ni modificar la tria de l'usuari. Quan es desactiva,
   * el tema torna a la tria persistida.
   */
  setAmbientDark: (active: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">("light");
  const [ambientDark, setAmbientDarkState] = useState(false);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setThemeState(stored);
    } catch {}

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Mode resolt segons la tria de l'usuari (sense l'ambient)
  const userResolvedTheme: "dark" | "light" =
    theme === "dark" || (theme === "system" && systemTheme === "dark") ? "dark" : "light";

  // Mode efectiu: si l'usuari ja és dark, l'ambient és no-op (no enfosquim el que ja és fosc)
  const effectiveTheme: "dark" | "light" =
    userResolvedTheme === "dark" ? "dark" : ambientDark ? "dark" : "light";

  // Manté actualitzada la classe de l'html
  useEffect(() => {
    const d = document.documentElement;
    if (effectiveTheme === "dark") {
      d.classList.add("dark");
      d.classList.remove("light");
      d.style.colorScheme = "dark";
    } else {
      d.classList.add("light");
      d.classList.remove("dark");
      d.style.colorScheme = "light";
    }
  }, [effectiveTheme]);

  const setTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem("theme", newTheme);
    } catch {}
    // Cookie llegida al server pel RootLayout per renderitzar la classe
    // dark/light al primer paint sense necessitat de cap script al client.
    // Path=/ + max-age 1 any. SameSite=Lax perquè es trameti en navegacions.
    try {
      document.cookie = `theme=${newTheme}; path=/; max-age=31536000; samesite=lax`;
    } catch {}
    setThemeState(newTheme);
  };

  const setAmbientDark = (active: boolean) => setAmbientDarkState(active);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        systemTheme,
        resolvedTheme: userResolvedTheme,
        setAmbientDark,
      }}
    >
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
