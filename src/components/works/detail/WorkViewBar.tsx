"use client";

import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  type Transition,
} from "framer-motion";
import { ArrowLeft, Eye, TextAlignLeft } from "@phosphor-icons/react";
import WorkSharePill from "./WorkSharePill";

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

/*
  Desplegar/plegar (24set26). Abans la mida saltava: CSS no pot animar
  width d'auto a un valor fix, i el text↔icona del selector es canviava de
  cop. Ara la mida l'anima framer (layout) i el contingut fa fosa amb
  AnimatePresence popLayout, perquè el que surt no empenyi el que entra.
  El border-radius va a style perquè framer el corregeixi durant l'escala.
*/
const RESIZE: Transition = { type: "spring", bounce: 0, duration: 0.45 };
// El text entra quan la caixa ja ha fet gairebé la meitat del recorregut
// (abans es llegia dins d'una caixa encara massa estreta) i surt de pressa,
// abans que la caixa s'encongeixi al seu voltant.
const FADE_IN: Transition = { duration: 0.2, delay: 0.2, ease: "easeOut" };
const FADE_OUT: Transition = { duration: 0.1, ease: "easeIn" };
const MotionLink = motion.create(Link);

type View = "visual" | "lectura";

interface Props {
  view: View;
  onChange: (view: View) => void;
  /** Bloc final (projecte següent): quan entra en pantalla, la barra es retira. */
  stopRef?: RefObject<HTMLElement | null>;
  /** Per a la pastilla de compartir (desktop). Sense aquests dos, no surt. */
  shareTitle?: string;
  shareSlug?: string;
}

export default function WorkViewBar({ view, onChange, stopRef, shareTitle, shareSlug }: Props) {
  const { scrollY } = useScroll();
  const reduced = useReducedMotion();

  const [visible, setVisible] = useState(false);
  const [compact, setCompact] = useState(false);
  // Peek independent per peça: expandir-les alhora feia que, en apropar-te a
  // una, l'altra punta de la pantalla es mogués i et cridés l'atenció.
  const [peekLeft, setPeekLeft] = useState(false);
  const [peekRight, setPeekRight] = useState(false);
  const [peekShare, setPeekShare] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  const peekTimers = useRef<{
    left: ReturnType<typeof setTimeout> | null;
    right: ReturnType<typeof setTimeout> | null;
    share: ReturnType<typeof setTimeout> | null;
  }>({ left: null, right: null, share: null });

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
      if (timers.share) clearTimeout(timers.share);
    };
  }, []);

  const setPeek = useCallback((side: "left" | "right" | "share", value: boolean) => {
    ({ left: setPeekLeft, right: setPeekRight, share: setPeekShare })[side](value);
  }, []);

  const openPeek = useCallback((side: "left" | "right" | "share") => {
    const timers = peekTimers.current;
    if (timers[side]) clearTimeout(timers[side]);
    setPeek(side, true);
  }, [setPeek]);

  const closePeek = useCallback((side: "left" | "right" | "share") => {
    const timers = peekTimers.current;
    if (timers[side]) clearTimeout(timers[side]);
    timers[side] = setTimeout(() => setPeek(side, false), PEEK_OUT_DELAY);
  }, [setPeek]);

  // A mòbil el "tornar" neix ja compacte: amb 402px les dues peces amb text
  // no hi caben amb folgança (Figma 11867:11297).
  const showLeft = !compact || peekLeft;
  const showRight = !compact || peekRight;
  const showShare = !compact || peekShare;
  const shown = visible && !atEnd;

  const resize: Transition = reduced ? { duration: 0 } : RESIZE;
  const fade: Transition = reduced ? { duration: 0 } : FADE_IN;
  const fadeOut: Transition = reduced ? { duration: 0 } : FADE_OUT;
  const pill = { borderRadius: 9999 };

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
      <LayoutGroup>
        {/* Esquerra — retorn. A mòbil sempre icona. */}
        <MotionLink
          href="/works"
          aria-label="Veure tots els projectes"
          layout
          transition={resize}
          style={pill}
          onMouseEnter={() => openPeek("left")}
          onMouseLeave={() => closePeek("left")}
          onFocus={() => openPeek("left")}
          onBlur={() => closePeek("left")}
          className={`group pointer-events-auto flex items-center justify-center overflow-hidden
            h-14 lg:h-16 xl:h-[72px] bg-surface-card text-text-main
            shadow-[0_4px_24px_rgba(0,0,0,0.10)]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-main focus-visible:ring-offset-2
            ${showLeft ? "gap-3 px-5 lg:px-6 xl:px-8" : "w-14 lg:w-16 xl:w-[72px] gap-0 px-0"}`}
        >
          <motion.span layout="position" transition={resize} className="flex shrink-0">
            <ArrowLeft size={20} weight="regular" className="transition-transform duration-300 group-hover:-translate-x-1" />
          </motion.span>
          <AnimatePresence initial={false} mode="popLayout">
            {showLeft && (
              <motion.span
                key="label"
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: fadeOut }}
                transition={fade}
                className="hidden md:block whitespace-nowrap text-[18px] lg:text-[20px] xl:text-[24px]"
              >
                Veure tots els projectes
              </motion.span>
            )}
          </AnimatePresence>
        </MotionLink>

        {/* Dreta — compartir (només lg+, 24set26) i selector de vista, en
            pastilles separades: el selector canvia com veus la pàgina, el
            compartir la treu fora. */}
        <div className="flex items-center gap-3">
          {shareTitle && shareSlug && (
            <WorkSharePill
              title={shareTitle}
              slug={shareSlug}
              expanded={showShare}
              onPeekOpen={() => openPeek("share")}
              onPeekClose={() => closePeek("share")}
              resize={resize}
              fade={fade}
              fadeOut={fadeOut}
              className="hidden lg:flex"
            />
          )}
          <motion.div
            role="radiogroup"
            aria-label="Mode de visualització del projecte"
            layout
            transition={resize}
            style={pill}
            onMouseEnter={() => openPeek("right")}
            onMouseLeave={() => closePeek("right")}
            className="pointer-events-auto flex items-center gap-0
              p-1.5 lg:p-2 bg-surface-card
              shadow-[0_4px_24px_rgba(0,0,0,0.10)]"
          >
            {(["visual", "lectura"] as const).map((mode) => {
              const active = view === mode;
              const Icon = mode === "visual" ? Eye : TextAlignLeft;
              return (
                <motion.button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={mode === "visual" ? "Vista visual" : "Vista de lectura"}
                  layout
                  transition={resize}
                  style={pill}
                  onClick={() => onChange(mode)}
                  onFocus={() => openPeek("right")}
                  onBlur={() => closePeek("right")}
                  className={`relative z-10 flex items-center justify-center overflow-hidden
                    h-11 lg:h-12 xl:h-14 transition-colors duration-300
                    text-[18px] lg:text-[20px] xl:text-[24px] capitalize
                    ${showRight ? "px-5 lg:px-6 xl:px-8" : "w-11 lg:w-12 xl:w-14"}
                    ${active ? "text-surface-card" : "text-text-main hover:text-text-secondary"}
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-main focus-visible:ring-offset-2`}
                >
                  {active && (
                    <motion.span
                      layoutId="worksViewBarToggle"
                      style={pill}
                      className="absolute inset-0 -z-10 bg-text-main"
                      transition={reduced ? { duration: 0 } : { type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.span
                      key={showRight ? "text" : "icon"}
                      layout="position"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: fadeOut }}
                      transition={fade}
                      className="flex items-center"
                    >
                      {showRight ? mode : <Icon size={22} weight="regular" aria-hidden="true" />}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </LayoutGroup>
    </motion.div>
  );
}
