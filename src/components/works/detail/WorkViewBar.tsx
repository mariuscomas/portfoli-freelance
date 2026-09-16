"use client";

import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { ArrowLeft, Eye, TextAlignLeft } from "@phosphor-icons/react";

/*
  WorkViewBar
  -----------
  Barra fixa inferior del case study: retorn a /works (esquerra) i selector
  Visual/Lectura (dreta). Substitueix el toggle que vivia dins del hero, que
  amb el parallax desapareixia al 70% de l'scroll i deixava el lector sense
  control a mitja pàgina.

  Patró validat a wearemotto.com/portfolio/protege, amb una diferència
  volguda: allà el col·lapse a icones no es desfà mai (ni amb hover); aquí
  s'expandeix en hover i SEMPRE en focus de teclat.

  Decisions (doc barra-fixa-case-study-2026-09-15.md):
  - APPEAR_RATIO 0.85 — el mateix llindar que ja fa servir WorkDetailLayout
    per retornar el contrast del Header a "auto": a aquest punt la secció
    següent ja cobreix el hero.
  - COMPACT_AFTER 1.5 viewports més avall; histèresi de 240px perquè un
    gest curt amunt/avall no faci parpellejar la forma.
  - La barra NO segueix l'auto-hide direccional del Header: un cop apareix,
    es queda. El control ha d'estar sempre a mà.

  Geometria del Figma (Buttons / Custom / Pill Tornar + Button Menu, eix
  Display=Text|Icon). Rampa buttons-menu: MD 56/18, LG 64/20, XL 72/24, amb
  icon-box = height − 2×padding, que és el que manté rodó el segment d'icona.
*/

const APPEAR_RATIO = 0.85;
const COMPACT_AFTER = 1.5; // viewports per sobre del llindar d'aparició
const COMPACT_HYSTERESIS = 240; // px
const PEEK_OUT_DELAY = 400; // ms abans de tornar a col·lapsar en sortir el cursor

type View = "visual" | "lectura";

interface Props {
  view: View;
  onChange: (view: View) => void;
  /** Bloc final (projecte següent): quan entra en pantalla, la barra es retira. */
  stopRef?: RefObject<HTMLElement | null>;
}

export default function WorkViewBar({ view, onChange, stopRef }: Props) {
  const { scrollY } = useScroll();
  const reduced = useReducedMotion();

  const [visible, setVisible] = useState(false);
  const [compact, setCompact] = useState(false);
  // Peek independent per peça: expandir-les alhora feia que, en apropar-te a
  // una, l'altra punta de la pantalla es mogués i et cridés l'atenció.
  const [peekLeft, setPeekLeft] = useState(false);
  const [peekRight, setPeekRight] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  const peekTimers = useRef<{
    left: ReturnType<typeof setTimeout> | null;
    right: ReturnType<typeof setTimeout> | null;
  }>({ left: null, right: null });

  useMotionValueEvent(scrollY, "change", (y) => {
    const vh = typeof window === "undefined" ? 800 : window.innerHeight;
    const appear = vh * APPEAR_RATIO;
    setVisible(y >= appear);

    const collapseAt = appear + vh * COMPACT_AFTER;
    if (y >= collapseAt) setCompact(true);
    else if (y < collapseAt - COMPACT_HYSTERESIS) setCompact(false);
  });

  // El bloc de projecte següent té el seu propi gest; la barra no l'ha de tapar.
  useEffect(() => {
    const node = stopRef?.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setAtEnd(entry.isIntersecting),
      { threshold: 0.15 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [stopRef]);

  useEffect(() => {
    const timers = peekTimers.current;
    return () => {
      if (timers.left) clearTimeout(timers.left);
      if (timers.right) clearTimeout(timers.right);
    };
  }, []);

  const openPeek = useCallback((side: "left" | "right") => {
    const timers = peekTimers.current;
    if (timers[side]) clearTimeout(timers[side]);
    (side === "left" ? setPeekLeft : setPeekRight)(true);
  }, []);

  const closePeek = useCallback((side: "left" | "right") => {
    const timers = peekTimers.current;
    if (timers[side]) clearTimeout(timers[side]);
    timers[side] = setTimeout(
      () => (side === "left" ? setPeekLeft : setPeekRight)(false),
      PEEK_OUT_DELAY
    );
  }, []);

  // A mòbil el "tornar" neix ja compacte: amb 402px les dues peces amb text
  // no hi caben amb folgança (Figma 11867:11297).
  const showLeft = !compact || peekLeft;
  const showRight = !compact || peekRight;
  const shown = visible && !atEnd;

  return (
    <motion.div
      aria-hidden={!shown}
      initial={false}
      animate={{
        opacity: shown ? 1 : 0,
        y: shown || reduced ? 0 : 24,
      }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 bottom-0 z-40 flex items-center justify-between
        px-8 md:px-12 lg:px-24
        pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] md:pb-[calc(env(safe-area-inset-bottom,0px)+3rem)]
        ${shown ? "" : "pointer-events-none"}`}
    >
      {/* Esquerra — retorn. A mòbil sempre icona. */}
      <Link
        href="/works"
        aria-label="Veure tots els projectes"
        onMouseEnter={() => openPeek("left")}
        onMouseLeave={() => closePeek("left")}
        onFocus={() => openPeek("left")}
        onBlur={() => closePeek("left")}
        className={`group pointer-events-auto flex items-center justify-center
          h-14 lg:h-16 xl:h-[72px] rounded-full bg-surface-card text-text-main
          shadow-[0_4px_24px_rgba(0,0,0,0.10)]
          transition-[width,transform] duration-300 ease-out hover:-translate-y-0.5
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-main focus-visible:ring-offset-2
          ${showLeft ? "" : "w-14 lg:w-16 xl:w-[72px]"}`}
      >
        <span
          className={`flex items-center justify-center transition-all duration-300
            ${showLeft ? "gap-3 px-5 lg:px-6 xl:px-8" : "w-full gap-0 px-0"}`}
        >
          <ArrowLeft size={20} weight="regular" className="shrink-0 transition-transform duration-300 group-hover:-translate-x-1" />
          <span
            className={`hidden md:block whitespace-nowrap text-[18px] lg:text-[20px] xl:text-[24px]
              transition-[max-width,opacity] duration-300
              ${showLeft ? "max-w-[280px] opacity-100" : "max-w-0 opacity-0 overflow-hidden"}`}
          >
            Veure tots els projectes
          </span>
        </span>
      </Link>

      {/* Dreta — selector de vista */}
      <div
        role="radiogroup"
        aria-label="Mode de visualització del projecte"
        onMouseEnter={() => openPeek("right")}
        onMouseLeave={() => closePeek("right")}
        className="pointer-events-auto flex items-center gap-0
          p-1.5 lg:p-2 rounded-full bg-surface-card
          shadow-[0_4px_24px_rgba(0,0,0,0.10)]"
      >
        {(["visual", "lectura"] as const).map((mode) => {
          const active = view === mode;
          const Icon = mode === "visual" ? Eye : TextAlignLeft;
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={mode === "visual" ? "Vista visual" : "Vista de lectura"}
              onClick={() => onChange(mode)}
              onFocus={() => openPeek("right")}
              onBlur={() => closePeek("right")}
              className={`relative z-10 flex items-center justify-center rounded-full
                h-11 lg:h-12 xl:h-14 transition-colors duration-300
                text-[18px] lg:text-[20px] xl:text-[24px] capitalize
                ${showRight ? "px-5 lg:px-6 xl:px-8" : "w-11 lg:w-12 xl:w-14"}
                ${active ? "text-surface-card" : "text-text-main hover:text-text-secondary"}
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-main focus-visible:ring-offset-2`}
            >
              {active && (
                <motion.span
                  layoutId="worksViewBarToggle"
                  className="absolute inset-0 -z-10 rounded-full bg-text-main"
                  transition={reduced ? { duration: 0 } : { type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {showRight ? mode : <Icon size={22} weight="regular" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
