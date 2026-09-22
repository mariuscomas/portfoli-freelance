/* ============================================================
   Disponibilitat — font única de l'estat (22set26)
   Figma: mestre «Strip — Disponibilitat» (Estat × Breakpoint), Components v2 · Sections.
   Canviar l'estat = canviar AVAILABILITY i fer deploy. Cadència trimestral.
   El color (tokens status/*) mai va sol: el missatge canvia amb l'estat.
   ============================================================ */

export type AvailabilityState = "available" | "limited" | "busy";

/** Estat actual. Únic lloc que s'edita. */
export const AVAILABILITY: AvailabilityState = "available";

export const AVAILABILITY_COPY: Record<AvailabilityState, string> = {
  available: "Obert a noves col·laboracions aquest trimestre.",
  limited: "Places limitades aquest trimestre.",
  busy: "Agenda completa aquest trimestre. Parlem del següent.",
};

/** Utility del punt. Tokens --status-* a globals.css (≥3:1 als dos modes). */
export const AVAILABILITY_DOT: Record<AvailabilityState, string> = {
  available: "bg-status-available",
  limited: "bg-status-limited",
  busy: "bg-status-busy",
};
