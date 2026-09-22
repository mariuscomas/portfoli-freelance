"use client";

import { useState } from "react";
import { motion, useIsPresent, useReducedMotion } from "framer-motion";

/*
  <MenuIcon />
  ------------
  Icona del botó de menú de mòbil que es transforma de tres barres a X
  (22set26). Excepció a la regla de Phosphor: un morph necessita les línies
  soltes, i Phosphor dóna dues icones tancades. La geometria copia Phosphor
  Regular a 32 px perquè el repòs sigui idèntic a List i a X:
  - List: barres de x 5→27 a y = 8 · 16 · 24, traç 2 arrodonit.
  - X: diagonals de 7,7 a 25,25 i de 25,7 a 7,25.

  És un SVG que anima el `d` de tres paths d'un sol segment, no
  spans amb transform: a Safari d'iOS els spans absoluts transformats no es
  pintaven dins del botó (overflow-hidden + backdrop-filter + drop-shadow).

  Seqüència (0,5 s): obrir = la barra del mig s'encongeix i les altres dues
  es troben al centre (primer 40%), després giren fins a la X. Tancar és el
  mateix al revés.

  `open` omès: segueix la presència. Dins d'un fill d'AnimatePresence entra
  com a barres, es fa X en muntar-se i torna a barres quan surt.
*/

type Pts = { x1: number; y1: number; x2: number; y2: number };
const TOP_BARS: Pts = { x1: 5, y1: 8, x2: 27, y2: 8 };
const MID_BARS: Pts = { x1: 5, y1: 16, x2: 27, y2: 16 };
const BOT_BARS: Pts = { x1: 5, y1: 24, x2: 27, y2: 24 };
const CENTER: Pts = { x1: 5, y1: 16, x2: 27, y2: 16 };
const DOT: Pts = { x1: 16, y1: 16, x2: 16, y2: 16 };
const TOP_X: Pts = { x1: 7, y1: 7, x2: 25, y2: 25 };
const BOT_X: Pts = { x1: 7, y1: 25, x2: 25, y2: 7 };

const d = (p: Pts) => `M${p.x1} ${p.y1}L${p.x2} ${p.y2}`;

/** Keyframes a tres temps: origen → punt de pas → destí. */
const kf = (a: Pts, b: Pts, c: Pts) => ({ d: [d(a), d(b), d(c)] });

export default function MenuIcon({ open, className = "" }: { open?: boolean; className?: string }) {
  const isPresent = useIsPresent();
  const reduced = useReducedMotion();
  const isOpen = open ?? isPresent;

  // Si mai s'ha obert, repòs estàtic en barres (sense animar des de la X).
  const [wasOpen, setWasOpen] = useState(false);
  if (isOpen && !wasOpen) setWasOpen(true);
  const settled = !isOpen && !wasOpen;

  const transition = {
    duration: reduced ? 0 : 0.5,
    times: [0, 0.4, 1],
    ease: [0.76, 0, 0.24, 1] as const,
    delay: reduced ? 0 : isOpen ? 0.1 : 0,
  };

  const lines: { bars: Pts; open: Record<string, (string | number)[]>; close: Record<string, (string | number)[]> }[] = [
    { bars: TOP_BARS, open: kf(TOP_BARS, CENTER, TOP_X), close: kf(TOP_X, CENTER, TOP_BARS) },
    {
      bars: MID_BARS,
      open: { ...kf(MID_BARS, DOT, DOT), opacity: [1, 0, 0] },
      close: { ...kf(DOT, DOT, MID_BARS), opacity: [0, 0, 1] },
    },
    { bars: BOT_BARS, open: kf(BOT_BARS, CENTER, BOT_X), close: kf(BOT_X, CENTER, BOT_BARS) },
  ];

  return (
    <svg
      aria-hidden
      viewBox="0 0 32 32"
      width={32}
      height={32}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={`block shrink-0 ${className}`}
    >
      {lines.map((l, i) => (
        <motion.path
          key={i}
          initial={{ d: d(l.bars), opacity: 1 }}
          animate={settled ? { d: d(l.bars), opacity: 1 } : isOpen ? l.open : l.close}
          transition={transition}
        />
      ))}
    </svg>
  );
}
