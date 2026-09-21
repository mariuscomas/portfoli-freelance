"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, type Transition } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import { LinkUnderline } from "@/components/ui/LinkUnderline";

/**
 * /404 — Pàgina no trobada
 *
 * Aproximació minimalista (inspirada en limeiq.com/404):
 *   - "404" petit a sobre, com a etiqueta (Caption/Eyebrow)
 *   - Missatge gran que s'escriu lletra a lletra, en cicle infinit
 *     (escriu → pausa → esborra → següent missatge → ...)
 *   - Dos tons en la mateixa frase: arrel en main, complement en secondary
 *   - CTA: Link del DS amb ArrowRight, com a la 500
 *   Figma: Errors — 500 i 404 (nodes 12216:20209 / 20217 / 20225)
 *
 * El Header global ja l'hereta de SiteShell → NavigationWrapper.
 */

type Message = {
  /** Frase completa (la part `splitAt` primera es renderitza en `text-main`,
   *  la resta en `text-secondary`). */
  text: string;
  splitAt: number;
};

const MESSAGES: Message[] = [
  { text: "Pàgina de vacances.", splitAt: 6 },          // "Pàgina" · " de vacances."
  { text: "Pàgina jubilada.", splitAt: 6 },             // "Pàgina" · " jubilada."
  { text: "El gat se l'ha menjat.", splitAt: 6 },       // "El gat" · " se l'ha menjat."
  { text: "Has trobat el no-res.", splitAt: 10 },       // "Has trobat" · " el no-res."
  { text: "Potser és culpa meva.", splitAt: 6 },        // "Potser" · " és culpa meva."
  { text: "El més polit dels 404.", splitAt: 12 },      // "El més polit" · " dels 404."
];

const TYPE_SPEED = 55;          // ms per caràcter quan escriu
const DELETE_SPEED = 28;        // ms per caràcter quan esborra
const HOLD_AFTER_FULL = 1700;   // pausa amb el missatge complet
const HOLD_AFTER_EMPTY = 250;   // pausa entre missatge i el següent

type Phase = "typing" | "hold-full" | "deleting" | "hold-empty";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function NotFound() {
  // Estat del typewriter — calculat al primer render perquè els usuaris
  // amb reduced-motion vegin la primera frase sencera sense efecte.
  const [reduced] = useState<boolean>(() => prefersReducedMotion());
  const [msgIdx, setMsgIdx] = useState<number>(0);
  const [typed, setTyped] = useState<string>(() =>
    prefersReducedMotion() ? MESSAGES[0].text : ""
  );
  const [phase, setPhase] = useState<Phase>("typing");

  useEffect(() => {
    if (reduced) return; // sense efecte, sense bucle

    const current = MESSAGES[msgIdx].text;
    let timer: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (typed.length < current.length) {
        timer = setTimeout(() => {
          setTyped(current.slice(0, typed.length + 1));
        }, TYPE_SPEED);
      } else {
        timer = setTimeout(() => setPhase("hold-full"), 0);
      }
    } else if (phase === "hold-full") {
      timer = setTimeout(() => setPhase("deleting"), HOLD_AFTER_FULL);
    } else if (phase === "deleting") {
      if (typed.length > 0) {
        timer = setTimeout(() => {
          setTyped(typed.slice(0, -1));
        }, DELETE_SPEED);
      } else {
        timer = setTimeout(() => setPhase("hold-empty"), 0);
      }
    } else {
      // hold-empty → següent missatge
      timer = setTimeout(() => {
        setMsgIdx((idx) => (idx + 1) % MESSAGES.length);
        setPhase("typing");
      }, HOLD_AFTER_EMPTY);
    }

    return () => clearTimeout(timer);
  }, [typed, phase, msgIdx, reduced]);

  const current = MESSAGES[msgIdx];
  const splitAt = current.splitAt;
  const typedMain = typed.slice(0, Math.min(typed.length, splitAt));
  const typedSecondary = typed.slice(splitAt);

  const fadeIn: Transition = {
    duration: 0.6,
    ease: [0.16, 1, 0.3, 1],
  };

  return (
    <section className="flex h-[100dvh] w-full flex-col items-center justify-center bg-surface-base px-page">
      <div className="flex flex-col items-center text-center gap-10">
        {/* Etiqueta 404 */}
        <motion.span
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fadeIn}
          className="text-caption-eyebrow text-text-secondary"
        >
          404
        </motion.span>

        {/* Missatge gran — typewriter en bucle amb dos tons */}
        {/* Una línia a cada breakpoint: Display/XS · M · XL (32 · 48 · 64) */}
        <h1
          className="text-display-xs md:text-display-m lg:text-display-xl whitespace-nowrap max-w-full"
          aria-live="polite"
          aria-label={current.text}
        >
          <span className="text-text-main">{typedMain}</span>
          <span className="text-text-secondary">{typedSecondary}</span>
          {/* Cursor — sempre visible, parpalleja amb el ritme del system */}
          <span
            aria-hidden="true"
            className="inline-block w-[0.04em] ml-1 align-baseline bg-text-main animate-pulse"
            style={{ height: "0.85em" }}
          />
        </h1>

        {/* CTA — Link del DS */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...fadeIn, delay: 0.25 }}
          className="mt-6"
        >
          <Link href="/" className="group w-fit">
            <LinkUnderline
              as="span"
              icon={
                <ArrowRight
                  size={20}
                  weight="regular"
                  className="shrink-0 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              }
            >
              Tornar a la home
            </LinkUnderline>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
