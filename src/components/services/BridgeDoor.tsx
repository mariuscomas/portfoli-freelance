"use client";

import { ArrowRight } from "@phosphor-icons/react";
import TransitionLink from "@/components/common/TransitionLink";

/**
 * BridgeDoor — "segona porta" del CTA final de /serveis i /colaboracio.
 *
 * Pont en creu del doble funnel: a /serveis deriva cap a /colaboracio (agències),
 * a /colaboracio deriva cap a /serveis (client final). No competeix amb el CTA
 * principal de la pàgina; recull el visitant que ha aterrat a l'àrea equivocada.
 * Tota la targeta és clicable (patró bento-link).
 *
 * Figma (24set26): card lateral del «Section CTA — Comencem». A desktop va a la
 * dreta del CTA, amplada segons contingut (hug, 377 px); a tablet i mòbil, a sota a tot l'ample. Abans
 * /colaboracio en tenia una versió pròpia (max-w-2xl, enllaç en Display) i
 * /serveis la tenia escrita a mà dins de ProductsView; ara és una sola.
 */
export default function BridgeDoor({
  eyebrow,
  line,
  href,
  cta,
}: {
  eyebrow: string;
  line: string;
  href: string;
  cta: string;
}) {
  return (
    <TransitionLink
      href={href}
      className="group flex flex-col gap-6 rounded-card border border-border-subtle bg-surface-card/30 p-8 transition-colors hover:border-border-strong lg:shrink-0"
    >
      <span className="flex flex-col gap-4 text-text-secondary">
        <span className="text-caption-eyebrow">{eyebrow}</span>
        <span className="text-body-xs-light md:text-body-s-light">{line}</span>
      </span>
      <span className="inline-flex min-h-11 items-center gap-2.5 text-button-link-md text-text-main underline underline-offset-8 decoration-1 group-hover:decoration-2">
        {cta}
        <ArrowRight
          size={20}
          weight="regular"
          className="shrink-0 transition-transform group-hover:translate-x-1"
          aria-hidden
        />
      </span>
    </TransitionLink>
  );
}
