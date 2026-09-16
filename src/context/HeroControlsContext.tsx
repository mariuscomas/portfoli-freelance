"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * HeroControlsContext — qui pinta els controls d'utilitat (tema + idioma).
 *
 * Al Figma el botó de mode de color NO flota: és fill del `Footer` del mestre
 * `Section Hero` (10670:2687), a la mateixa fila que l'enllaç creuat i centrat
 * amb ell. Verificat a les 18 instàncies del fitxer (Serveis, Col·laboració,
 * Works, Work detail, Sobre mi, Mètode).
 *
 * Quan un hero pinta els controls dins de la seva fila inferior, "reclama"
 * aquest context i la còpia flotant de SiteShell es retira. Així no hi ha mai
 * dos toggles al DOM ni cal mantenir una llista de rutes.
 */
const HeroControlsContext = createContext<{
  claimed: boolean;
  claim: () => () => void;
} | null>(null);

export function HeroControlsProvider({ children }: { children: React.ReactNode }) {
  const [claims, setClaims] = useState(0);

  const claim = useCallback(() => {
    setClaims((n) => n + 1);
    return () => setClaims((n) => n - 1);
  }, []);

  const value = useMemo(() => ({ claimed: claims > 0, claim }), [claims, claim]);

  return <HeroControlsContext.Provider value={value}>{children}</HeroControlsContext.Provider>;
}

/** El crida el hero que pinta els controls a la seva fila inferior. */
export function useClaimHeroControls(active: boolean) {
  const ctx = useContext(HeroControlsContext);
  useEffect(() => {
    if (!active || !ctx) return;
    return ctx.claim();
  }, [active, ctx]);
}

/** El consulta la còpia flotant per saber si s'ha de retirar. */
export function useHeroOwnsControls() {
  return useContext(HeroControlsContext)?.claimed ?? false;
}
