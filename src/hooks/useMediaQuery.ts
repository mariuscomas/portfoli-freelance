"use client";

import { useEffect, useState } from "react";

/**
 * useMediaQuery — media query reactiu, SEGUR EN SSR.
 *
 * Comença sempre a `false` i només llegeix `matchMedia` dins de l'efecte:
 * així el primer render del client és idèntic al del servidor i no hi ha
 * mismatch d'hidratació. El preu és un frame amb el valor per defecte, que
 * només es nota si el component és visible des del primer paint.
 *
 * (N'hi ha una altra versió a `components/services/configuratorShared.tsx`
 * que llegeix `matchMedia` a l'inicialitzador per evitar aquell frame: allà
 * és legítima perquè el modal del configurador es munta només en client.)
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/**
 * Per sota del breakpoint `lg` de Tailwind (1024px) — la frontera on el
 * Header deixa de tenir els links inline i el botó Menu passa a ser l'única
 * sortida de navegació.
 */
export const BELOW_LG_QUERY = "(max-width: 1023px)";
