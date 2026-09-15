"use client";

import { ArrowRight } from "@phosphor-icons/react";
import TransitionLink from "@/components/common/TransitionLink";

/**
 * BridgeDoor — "segona porta" al peu de les seccions de tancament.
 *
 * Pont en creu del doble funnel: a /serveis deriva cap a /colaboracio (agències),
 * a /colaboracio deriva cap a /serveis (client final). No competeix amb el CTA
 * principal de la pàgina; recull el visitant que ha aterrat a l'àrea equivocada.
 * Tota la targeta és clicable (patró bento-link).
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
      className="group flex w-full max-w-2xl flex-col gap-3 rounded-card border border-border-default bg-surface-card/30 p-8 transition-colors hover:border-border-strong"
    >
      <span className="text-eyebrow text-text-secondary">{eyebrow}</span>
      <span className="text-body-sm text-text-secondary">{line}</span>
      <span className="mt-1 inline-flex items-center gap-2 text-heading-h3 text-text-main underline underline-offset-8 decoration-1 group-hover:decoration-2">
        {cta}
        <ArrowRight
          size={22}
          className="transition-transform group-hover:translate-x-1"
          aria-hidden
        />
      </span>
    </TransitionLink>
  );
}
