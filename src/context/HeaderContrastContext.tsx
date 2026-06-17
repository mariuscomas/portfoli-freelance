"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * HeaderContrastContext
 * ---------------------
 * Permet que el Header adapti els seus colors segons el contingut que té
 * immediatament a sota (un hero amb fons fosc → text clar, un hero amb fons
 * clar → text fosc, qualsevol altra cosa → tokens del tema).
 *
 * Estats:
 *  - "auto":  Header amb tokens normals del tema (text-text-main, etc.).
 *  - "light": el bloc de sota és fosc i necessita TEXT CLAR → usar
 *             text-fixed-light (els mateixos que ja usa el hero del case
 *             study quan `textColor === "light"`).
 *  - "dark":  el bloc de sota és clar i necessita TEXT FOSC → text-fixed-dark.
 *
 * El valor és controlat per la pàgina (p.e. WorkDetailLayout) basant-se en
 * `data.hero.textColor` i en la posició de scroll: mentre el viewport-top
 * està sobre el hero, override; quan la secció següent ja cobreix l'àrea
 * del Header, retornem a "auto".
 */
export type HeaderContrast = "auto" | "light" | "dark";

interface HeaderContrastValue {
  contrast: HeaderContrast;
  setContrast: (next: HeaderContrast) => void;
}

const HeaderContrastContext = createContext<HeaderContrastValue | null>(null);

export function HeaderContrastProvider({ children }: { children: React.ReactNode }) {
  const [contrast, setContrastState] = useState<HeaderContrast>("auto");

  // Estabilitzem el setter perquè els consumidors puguin posar-lo a deps
  // de useEffect sense fer re-renders innecessaris.
  const setContrast = useCallback((next: HeaderContrast) => {
    setContrastState((prev) => (prev === next ? prev : next));
  }, []);

  const value = useMemo<HeaderContrastValue>(
    () => ({ contrast, setContrast }),
    [contrast, setContrast]
  );

  return (
    <HeaderContrastContext.Provider value={value}>
      {children}
    </HeaderContrastContext.Provider>
  );
}

/** Llegeix el contrast actual. Default "auto" si no hi ha provider. */
export function useHeaderContrast(): HeaderContrast {
  const ctx = useContext(HeaderContrastContext);
  return ctx?.contrast ?? "auto";
}

/**
 * Permet a una pàgina declarar el contrast del Header. Si no hi ha provider
 * (cas teòric — admin/auth), torna un no-op per no petar.
 */
export function useSetHeaderContrast(): (next: HeaderContrast) => void {
  const ctx = useContext(HeaderContrastContext);
  return ctx?.setContrast ?? (() => {});
}
