"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";

const SECTION_PX = "px-6 md:px-12 lg:px-16 xl:px-24";

export interface SpokeHeroProps {
  /** Eyebrow mono (p. ex. "SERVEIS — WEB A MIDA"). */
  eyebrow: string;
  /** Titular = H1 semàntic i descriptiu de la pàgina (clau per SEO). Accepta
   *  nodes per poder posar salts de línia controlats (`<br className="hidden lg:block"/>`). */
  headline: ReactNode;
  /** Subtítol / proposta de valor. També accepta nodes per controlar el salt. */
  subhead: ReactNode;
  /** Etiqueta del preu. Per defecte "DES DE". */
  priceLabel?: string;
  /** Preu ja formatat (p. ex. "2.400 €"). */
  price: string;
  /** Nota sota el preu (abast, descompte…). */
  scopeNote: string;
  /** Text del CTA principal. */
  ctaLabel: string;
  /** Obre el configurador (o l'acció principal). */
  onCta: () => void;
}

/**
 * <SpokeHero /> — hero editorial per a les pàgines de detall de producte
 * (/serveis/web · /landing · /auditoria). A diferència del hero marquee del
 * site (SharedPageHero, pensat per a obertures de secció), aquí l'H1 és la
 * proposta de valor descriptiva i el preu + CTA queden per sobre del fold:
 * òptim per SEO (un H1 únic i ric per pàgina) i per conversió.
 */
export default function SpokeHero({
  eyebrow,
  headline,
  subhead,
  priceLabel = "DES DE",
  price,
  scopeNote,
  ctaLabel,
  onCta,
}: SpokeHeroProps) {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduce ? (false as const) : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const, delay },
  });

  return (
    <section
      className={`${SECTION_PX} pt-32 md:pt-36 pb-24 md:pb-28 bg-surface-base`}
    >
      <div className="flex flex-col gap-5 md:gap-7">
        <motion.span {...rise(0)} className="text-caption uppercase text-text-secondary">
          {eyebrow}
        </motion.span>

        <motion.h1 {...rise(0.06)} className="text-display-h2 text-text-main text-balance">
          {headline}
        </motion.h1>

        <motion.p {...rise(0.12)} className="max-w-5xl text-body-xl font-medium text-text-secondary">
          {subhead}
        </motion.p>

        <motion.div
          {...rise(0.18)}
          className="mt-6 flex flex-col gap-8 md:flex-row md:items-end md:gap-16"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-caption uppercase text-text-secondary">{priceLabel}</span>
            <span className="text-display-h5 text-text-main">{price}</span>
            <span className="text-caption uppercase text-text-secondary">{scopeNote}</span>
          </div>

          <button
            type="button"
            onClick={onCta}
            className="group inline-flex min-h-11 items-center gap-2 self-start text-button-lg text-text-main underline underline-offset-8 decoration-1 hover:decoration-2 md:pb-1"
          >
            {ctaLabel}
            <ArrowRight
              size={16}
              weight="regular"
              className="transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
