"use client";

import { useCallback, useRef, useState } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";

/*
  useScrollHide
  -------------
  Direcció d'scroll aplicada a amagar/mostrar una barra fixa.

  Regles acordades (15set26):
  - Només s'amaga per sota del llindar `threshold` (per defecte 100 =
    COMPACT_ENTER del Header). Així el header encadena
    expandit → compacte → ocult, i mai marxa al primer tram de la pàgina.
  - Tolerància ASIMÈTRICA: costa amagar-lo (24px acumulats avall), torna
    quasi a l'instant (4px amunt). És el que fa sentir que la nav respon
    quan la reclames i no marxa per un gest accidental.
  - L'acumulador es reinicia a cada canvi de direcció (`anchor`), de manera
    que el soroll del trackpad i el rebot elàstic d'iOS no commuten l'estat.

  Retorna { hidden, show } — `show()` força l'estat visible i re-ancora
  l'acumulador (el fem servir en tancar un overlay).
*/

export const HIDE_TOLERANCE = 24; // px acumulats avall per amagar
export const SHOW_TOLERANCE = 4; // px acumulats amunt per tornar

export function useScrollHide(threshold = 100) {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  const lastY = useRef(0);
  const anchor = useRef(0);
  const direction = useRef<"up" | "down">("up");

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = lastY.current;
    lastY.current = y;

    const delta = y - prev;
    if (delta === 0) return;

    const next = delta > 0 ? "down" : "up";
    if (next !== direction.current) {
      direction.current = next;
      anchor.current = prev; // punt on l'usuari ha girat
    }

    const travelled = Math.abs(y - anchor.current);

    if (next === "down") {
      if (y > threshold && travelled >= HIDE_TOLERANCE) setHidden(true);
    } else if (y <= threshold || travelled >= SHOW_TOLERANCE) {
      setHidden(false);
    }
  });

  const show = useCallback(() => {
    setHidden(false);
    anchor.current = lastY.current;
    direction.current = "up";
  }, []);

  return { hidden, show };
}
