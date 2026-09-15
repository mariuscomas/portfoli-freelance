"use client";

import { ArrowDown } from "@phosphor-icons/react";
import TransitionLink from "@/components/common/TransitionLink";

/**
 * Navegació creuada Serveis ↔ Col·laboració (doble funnel).
 * Substitueix el toggle antic ?vista=: ara són dues pàgines/rutes pròpies
 * (/serveis i /colaboracio) i aquests pills salten d'una a l'altra.
 */
export type ServicesArea = "serveis" | "colaboracio";

const PILLS: { id: ServicesArea; label: string; href: string }[] = [
  { id: "serveis", label: "Serveis", href: "/serveis" },
  { id: "colaboracio", label: "Col·laboració", href: "/colaboracio" },
];

function CrossNav({ active }: { active: ServicesArea }) {
  return (
    <div
      role="navigation"
      aria-label="Àrees"
      className="flex items-center gap-1 rounded-full border border-border-default bg-surface-card p-1"
    >
      {PILLS.map((p) => {
        const isActive = active === p.id;
        return (
          <TransitionLink
            key={p.id}
            href={p.href}
            aria-current={isActive ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full px-6 text-button-lg transition-colors ${
              isActive
                ? "bg-text-main font-medium text-surface-base"
                : "text-text-secondary hover:bg-surface-border/50"
            }`}
          >
            {p.label}
          </TransitionLink>
        );
      })}
    </div>
  );
}

/**
 * Fila inferior del hero (3 zones): esquerra reservada als SiteControls fixos
 * (idioma + tema), enllaç d'scroll centrat, i navegació creuada a la dreta.
 */
export function ServicesHeroBottom({
  active,
  scrollHref,
  scrollLabel,
}: {
  active: ServicesArea;
  scrollHref: string;
  scrollLabel: string;
}) {
  return (
    <div className="grid w-full grid-cols-1 items-start gap-6 md:grid-cols-3 md:items-center">
      {/* Zona esquerra: buida — l'ocupen els SiteControls fixos (bottom-left) */}
      <div className="hidden md:block" aria-hidden />
      <a
        href={scrollHref}
        className="group flex items-center gap-2 text-body-lg font-medium transition-opacity hover:opacity-70 md:justify-self-center"
      >
        <span>{scrollLabel}</span>
        <ArrowDown size={18} className="transition-transform group-hover:translate-y-1" aria-hidden />
      </a>
      <div className="md:justify-self-end">
        <CrossNav active={active} />
      </div>
    </div>
  );
}
