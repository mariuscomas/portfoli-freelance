"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Entrades d'scroll de la home (guió 21set26, docs/home-guio-entrades-2026-09-21.md).
 *
 * Un grup = un disparador. El grup s'observa a si mateix i, quan la seva vora
 * superior passa el 70% de l'alçada del viewport (la secció té un 30% a la
 * vista), posa `data-revealed`. Els fills s'animen amb classes CSS
 * (`reveal-up`, `reveal-line`, `reveal-rule-v`) i el retard de cadascun va a
 * `--reveal-delay`. Així els components de servidor només afegeixen classes:
 * l'únic client és aquest embolcall.
 *
 * Tres garanties:
 *  - Sense JS el contingut surt visible: l'estat ocult només existeix quan el
 *    client ha posat `data-reveal-armed`.
 *  - El que ja és a la vista en muntar no s'arma: no s'anima res que l'usuari
 *    ja estigui mirant (regla del guió).
 *  - `prefers-reduced-motion`: no s'arma mai.
 * Un sol cop: en revelar, l'observer es desconnecta i no es repeteix en pujar.
 */

const REVEAL_LINE = 0.7; // la vora superior ha de passar el 70% del viewport

type Props = {
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  children: ReactNode;
} & Record<string, unknown>;

export default function RevealGroup({ as = "div", className, children, ...rest }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * REVEAL_LINE) return;

    el.setAttribute("data-reveal-armed", "");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.setAttribute("data-revealed", "");
          io.disconnect();
        }
      },
      { rootMargin: `0px 0px -${Math.round((1 - REVEAL_LINE) * 100)}% 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as ElementType;
  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
