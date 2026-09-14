"use client";

import { useEffect, useState } from "react";
import {
  motion,
  animate,
  useMotionValue,
  useMotionTemplate,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { useTransition as useAppTransition } from "@/context/TransitionContext";
import { markIntroRevealed } from "@/lib/introSignal";
import LogoSmall from "./LogoSmall";

/*
  IntroLoader — animació d'entrada del site (només al load inicial de la home).

  Coreografia (~1.65s):
    1. Backdrop sòlid (color cortina A) cobreix la pantalla des del SSR (sense FOUC).
    2. Un cercle (color cortina B) fa zoom-in des del centre amb la M apareixent.
    3. Petit respir amb la M al centre.
    4. Un forat circular creix des del centre (mask) i revela la web.

  Regles:
    - Un cop per sessió de navegador: la decisió la pren el SERVIDOR (page.tsx
      llegeix la cookie de sessió `mf-intro-seen` i passa `play`). Així el
      primer HTML ja és correcte en tots dos casos: cortina completa quan toca
      intro, i cap overlay (ni flash) quan no en toca.
    - Si `hasStartedTransition` és true, som en navegació interna → no es mostra
      (la cortina de PageTransition ja fa la seva feina).
    - `prefers-reduced-motion` → es descarta l'animació immediatament.
    - COREOGRAFIA: quan comença el reveal (o quan l'intro es descarta), s'emet
      `markIntroRevealed()` — l'entrada del hero i dels satèl·lits s'hi
      sincronitza (veure lib/introSignal.ts) en lloc de córrer amagada darrere
      la cortina.
*/

const SESSION_COOKIE = "mf-intro-seen";
// Mateixa ease que la cortina de PageTransition, per coherència de sistema
const EASE_CURTAIN: [number, number, number, number] = [0.6, 0.01, 0.35, 1];
const EASE_REVEAL: [number, number, number, number] = [0.76, 0, 0.24, 1];

type Status = "playing" | "revealing" | "done";

export default function IntroLoader({ play }: { play: boolean }) {
  const { hasStartedTransition, colors } = useAppTransition();
  const prefersReducedMotion = useReducedMotion();

  // "playing" des del PRIMER render (SSR inclòs): la cortina és a l'HTML
  // inicial cobrint-ho tot, sense dependre de la hidratació ni de cap
  // storage del client. Quan no toca intro, el component neix mort.
  const [status, setStatus] = useState<Status>(
    play && !hasStartedTransition ? "playing" : "done"
  );

  // Forat circular que creix per revelar la web (mask sobre tot l'overlay).
  // IMPORTANT: el cercle del gradient té radi FIX i gran, i el que s'anima és
  // la POSICIÓ dels color-stops (el forat). Amb radi 0 el gradient és
  // "degenerat" i alguns motors (WebKit) el pinten transparent en lloc de
  // negre → l'overlay quedava invisible al primer paint i es veia la pàgina
  // (fons + cercle de vídeo) abans de l'animació.
  const holeRadius = useMotionValue(0);
  const holeEdge = useTransform(holeRadius, (r) => Math.max(r - 2, 0));
  const maskImage = useMotionTemplate`radial-gradient(circle 4000px at 50% 50%, transparent ${holeEdge}px, black ${holeRadius}px)`;

  // Senyal de coreografia: al començar el reveal (o si l'intro es descarta),
  // el contingut pot arrencar la seva entrada.
  useEffect(() => {
    if (status === "revealing" || status === "done") markIntroRevealed();
  }, [status]);

  // Timeline: zoom-in del cercle (0.55s) → respir → reveal circular (0.7s)
  useEffect(() => {
    if (status !== "playing") return;

    // Cookie de SESSIÓ (sense Max-Age): mor en tancar el navegador. El
    // servidor la llegeix per no tornar a servir l'intro aquesta sessió.
    try {
      document.cookie = `${SESSION_COOKIE}=1; path=/; SameSite=Lax`;
    } catch {
      /* no-op */
    }

    if (prefersReducedMotion) {
      setStatus("done");
      return;
    }

    document.body.style.overflow = "hidden";

    const revealTimeout = setTimeout(() => {
      setStatus("revealing");
      // Radi suficient per arribar a les cantonades des del centre
      const radius = Math.hypot(window.innerWidth, window.innerHeight) / 2 + 40;
      animate(holeRadius, radius, {
        duration: 0.7,
        ease: EASE_REVEAL,
        onComplete: () => setStatus("done"),
      });
    }, 950);

    return () => {
      clearTimeout(revealTimeout);
      document.body.style.overflow = "";
    };
  }, [status, prefersReducedMotion, holeRadius]);

  // Xarxa de seguretat: allibera l'scroll quan acabem
  useEffect(() => {
    if (status === "done") document.body.style.overflow = "";
  }, [status]);

  if (status === "done") return null;

  const isActive = status === "playing" || status === "revealing";

  return (
    <motion.div
      aria-hidden
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: colors[0],
        // La màscara del forat NOMÉS s'aplica durant el reveal: així el
        // primer paint (SSR i fase "playing") és un bloc sòlid sense cap
        // dependència del rendering de gradients al mask.
        ...(status === "revealing"
          ? { WebkitMaskImage: maskImage, maskImage }
          : {}),
      }}
    >
      {/* Cercle que fa zoom-in amb la M al centre */}
      <motion.div
        initial={{ scale: 0 }}
        animate={isActive ? { scale: 1 } : undefined}
        transition={{ duration: 0.55, ease: EASE_CURTAIN }}
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{
          width: "150vmax",
          height: "150vmax",
          backgroundColor: colors[1],
        }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={
            status === "revealing"
              ? {
                  scale: 1.15,
                  opacity: 0,
                  transition: { duration: 0.35, ease: "easeIn" },
                }
              : isActive
                ? {
                    scale: 1,
                    opacity: 1,
                    transition: {
                      duration: 0.5,
                      delay: 0.25,
                      ease: EASE_CURTAIN,
                    },
                  }
                : undefined
          }
        >
          <LogoSmall className="h-auto w-[72px] text-text-fixed-dark md:w-[96px]" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
