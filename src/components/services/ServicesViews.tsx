"use client";

import { ArrowDown, ArrowRight } from "@phosphor-icons/react";
import TransitionLink from "@/components/common/TransitionLink";
import { LinkUnderline } from "@/components/ui/LinkUnderline";

/* ============================================================
   Hero de /serveis i /colaboracio — dues peces
   ------------------------------------------------------------
   Doc: docs/fila-inferior-hero-serveis-2026-09-16.md
   Figma: mestre Section Hero 10670:2687 (propietat `Show CTA`)

   1. <ServicesHeroCta>    — enllaç d'scroll a la primera secció. Va SOTA la
      descripció (SharedPageHero → afterDescription), no a la fila inferior.
   2. <ServicesHeroBottom> — fila inferior: esquerra reservada als SiteControls
      fixos, i un sol enllaç creuat a la dreta cap a l'altra àrea.

   El creuat nomena el MODEL DE CONTRACTACIÓ (pressupost tancat ↔ dedicació
   continuada), no l'audiència: "Col·laboració" és etiqueta interna de línia de
   negoci i no qualifica el visitant.

   Les pastilles CrossNav que hi havia aquí estan retirades (16set26): forma de
   segmented control per a una navegació entre pàgines, mitja pastilla inerta
   (enllaç a la pàgina on ja ets) i duplicaven l'ítem del navbar.
   ============================================================ */

/**
 * Enllaç d'scroll a la primera secció de la pàgina.
 *
 * `shortLabel` no és una floritura: a 402px, amb el text a 24px, els labels
 * llargs sortien de la caixa de 370 (3px a /serveis, 18px a /colaboracio).
 * Es va resoldre amb còpia i no tocant la rampa tipogràfica. El canvi va al
 * mateix breakpoint on salta el marge del hero.
 */
export function ServicesHeroCta({
  href,
  label,
  shortLabel = label,
}: {
  href: string;
  label: string;
  /** Només si el label llarg no cap a 402px. Per defecte, el mateix label. */
  shortLabel?: string;
}) {
  return (
    <LinkUnderline
      as="a"
      href={href}
      aria-label={label}
      icon={
        <ArrowDown
          size={20}
          className="shrink-0 transition-transform group-hover:translate-y-1"
          aria-hidden
        />
      }
    >
      <span aria-hidden className="md:hidden">
        {shortLabel}
      </span>
      <span aria-hidden className="hidden md:inline">
        {label}
      </span>
    </LinkUnderline>
  );
}

/**
 * Fila inferior del hero. La zona esquerra queda buida a propòsit: l'ocupen
 * els SiteControls fixos (tema + idioma), ancorats a bottom-left.
 *
 * El <LinkUnderline as="span"> és presentacional — l'element navegable és el
 * <TransitionLink> que l'embolcalla, perquè un <a> dins d'un <a> no seria
 * HTML vàlid ni navegable amb teclat.
 */
export function ServicesHeroBottom({
  crossHref,
  crossLabel,
}: {
  crossHref: string;
  crossLabel: string;
}) {
  return (
    <div className="flex w-full items-center justify-end">
      <TransitionLink href={crossHref} className="group">
        <LinkUnderline
          as="span"
          icon={
            <ArrowRight
              size={20}
              className="shrink-0 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          }
        >
          {crossLabel}
        </LinkUnderline>
      </TransitionLink>
    </div>
  );
}
