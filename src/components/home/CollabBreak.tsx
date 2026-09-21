"use client";

import { useEffect, useRef } from "react";
import { transform, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";

/**
 * Tall entre Serveis i Col·laboració a la home.
 *
 * Figma: "Section · Tall"
 *   Desktop 1728 → 12127:63960 · Tablet 834 → 12142:13409 · Mobile 402 → 12142:13413
 *
 * Una pausa, no una secció de venda: dues frases grans i cap CTA. Marca el
 * canvi de model de contractació, del projecte amb preu tancat (Serveis) a
 * la dedicació continuada (Col·laboració). Referència: el tall de
 * heronaiapp.com («Right there with you» → «For the whole design»).
 *
 * COMPORTAMENT (es valida al dev server; el Figma només en documenta el repòs)
 * L'escenari (una pantalla) es queda fixat amb sticky durant tota la pista, i
 * tot passa a dins, sense dos moviments alhora:
 * 1. CORTINA D'OBERTURA. La pista puja 100svh per sota de Serveis (-mt).
 *    Serveis (z-10, fons opac, border-b) marxa cap amunt i descobreix la
 *    frase 1, que no es mou.
 * 2. RELLEU. Frase 1 zoom-fade-out (1 → 1,1) i, amb un petit solapament,
 *    frase 2 zoom-fade-in (0,9 → 1).
 * 3. SORTIDA. Frase 2 zoom-fade-out, encara amb l'escenari fixat.
 * 4. CORTINA DE TANCAMENT. La resta de la home (Col·laboració i el que ve
 *    després, embolcallat a page.tsx amb z-10, fons opac i -mt de 100svh)
 *    puja per sobre de l'escenari buit. Simètrica amb l'obertura.
 *
 * Pista 450svh. Menys la pantalla de l'escenari, 350svh fixats:
 *   0–100 obertura · 100–115 repòs · 115–160 surt frase 1 · 150–195 entra
 *   frase 2 · 195–210 repòs · 210–255 surt frase 2 · 250–350 tancament.
 *
 * prefers-reduced-motion: sense solapaments, sense sticky ni animació; les
 * dues frases apilades en una secció d'alçada natural.
 *
 * Opacitat i escala s'escriuen per ref (useMotionValueEvent), no amb
 * `motion.p` i `style`: una MotionValue a `style` en un component SSR fa
 * mismatch d'hidratació. L'estat inicial el donen les classes (frase 2 a
 * opacity-0). Cap `return` anticipat: `useScroll({ target })` peta si el ref
 * no es munta.
 *
 * Sense <section>: no té títol propi i un landmark sense nom és soroll per al
 * lector de pantalla. Les frases van en <p> i les dues es llegeixen.
 */

const PINNED = 350; // svh fixats
const range = (from: number, to: number): [number, number] => [from / PINNED, to / PINNED];
const P1_OUT = range(115, 160);
const P2_IN = range(150, 195);
const P2_OUT = range(210, 255);

const setZoomFade = (el: HTMLElement, opacity: number, scale: number) => {
  el.style.opacity = String(opacity);
  el.style.transform = `scale(${scale})`;
};

export default function CollabBreak() {
  const trackRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLParagraphElement>(null);
  const secondRef = useRef<HTMLParagraphElement>(null);
  const reduceMotion = useReducedMotion();

  // Tram fixat: des que l'escenari es clava fins que la pista s'acaba.
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  const apply = (p: number) => {
    const first = firstRef.current;
    const second = secondRef.current;
    if (!first || !second) return;
    if (reduceMotion) {
      for (const el of [first, second]) {
        el.style.opacity = "";
        el.style.transform = "";
      }
      return;
    }
    setZoomFade(first, transform(p, P1_OUT, [1, 0]), transform(p, P1_OUT, [1, 1.1]));
    if (p < P2_OUT[0]) {
      setZoomFade(second, transform(p, P2_IN, [0, 1]), transform(p, P2_IN, [0.9, 1]));
    } else {
      setZoomFade(second, transform(p, P2_OUT, [1, 0]), transform(p, P2_OUT, [1, 1.1]));
    }
  };

  useMotionValueEvent(scrollYProgress, "change", apply);
  useEffect(() => {
    apply(scrollYProgress.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  const phrase =
    "text-display-m md:text-display-xl lg:text-display-2xl col-start-1 row-start-1 text-balance text-center text-text-main will-change-transform";

  return (
    <div
      ref={trackRef}
      className="relative z-0 -mt-[100svh] h-[450svh] w-full bg-surface-base motion-reduce:mt-0 motion-reduce:h-auto"
    >
      <div className="sticky top-0 grid h-svh place-content-center place-items-center overflow-hidden px-page motion-reduce:static motion-reduce:h-auto motion-reduce:gap-6 motion-reduce:py-section-xl motion-reduce:lg:py-section-2xl">
        <p ref={firstRef} className={phrase}>
          I si el projecte no s’acaba?
        </p>
        <p
          ref={secondRef}
          className={`${phrase} opacity-0 motion-reduce:row-start-2 motion-reduce:opacity-100`}
        >
          Seguim al teu costat.
        </p>
      </div>
    </div>
  );
}
