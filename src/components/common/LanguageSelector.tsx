"use client";

import { CaretLeftIcon } from "@phosphor-icons/react";

/**
 * LanguageSelector — selector d'idioma del site.
 *
 * De moment és visual (CA fix): la infraestructura i18n existeix a nivell de
 * dades (camps jsonb translatable + lib/i18n.ts) però encara no hi ha routing
 * per locale. Quan s'implementi, aquest component és l'únic punt a tocar.
 *
 * Dues aparences, un sol component (perquè quan arribi l'i18n només hi hagi
 * un lloc a tocar, tal com diu el paràgraf de dalt):
 *  - `pill` (per defecte) — càpsula amb vora, per als controls flotants
 *    (SiteControls) que han de llegir-se sobre qualsevol fons.
 *  - `bare` — "CA" a mida de Buttons/Link + caret, tal com surt a la barra
 *    inferior del hero al Figma (11325:8844 desktop, 11760:96251 mòbil), on la
 *    vora pròpia sobraria perquè la barra ja té les seves línies.
 */
export default function LanguageSelector({
  variant = "pill",
}: {
  variant?: "pill" | "bare";
}) {
  if (variant === "bare") {
    return (
      <div className="flex cursor-pointer items-center gap-2.5 text-text-main">
        <span className="text-button-link">CA</span>
        <CaretLeftIcon size={20} weight="regular" aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-text-main/10 hover:border-text-main/30 transition-colors cursor-pointer group">
      <div className="w-2.5 h-2.5 bg-text-main rounded-[2px]" />
      <span className="font-sans text-[15px] font-medium text-text-main">CA</span>
      <svg
        width="10"
        height="6"
        viewBox="0 0 10 6"
        fill="none"
        className="text-text-secondary group-hover:text-text-main transition-colors"
      >
        <path
          d="M1 1L5 5L9 1"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
