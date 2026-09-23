/**
 * Flags de llançament.
 *
 * Patró igual que LANGUAGE_SELECTOR_ENABLED: una constant, cap dependència, i
 * el comportament complet als dos costats de l'if. Res d'amagar només l'enllaç
 * — si una funció està tancada, el copy que hi porta també canvia.
 */

/**
 * Configurador de pressupostos (web/landing/auditoria i col·laboració).
 *
 * OBERT (23set26). Substitueix el tancament del 16set26, que mantenia els CTA
 * apuntant a contacte i trucada mentre el flux no s'havia validat en viu. S'obre
 * junt amb els preus del pla modular, que ja són els que calcula el configurador
 * (vegeu PRICING_V2_ENABLED a pricing.ts).
 *
 * El default mana i el configurador surt a tot arreu: hub de /serveis, els tres
 * spokes i /colaboracio. Es pot tancar en un entorn concret amb
 * `NEXT_PUBLIC_CONFIGURATOR=0`, però com que NEXT_PUBLIC_* s'incrusta al build,
 * tancar-lo demana un desplegament: no és un interruptor calent.
 */
export const CONFIGURATOR_ENABLED = process.env.NEXT_PUBLIC_CONFIGURATOR !== "0";

/**
 * Preus del pla modular 2026 (600 · 990 · 1.990). TANCAT.
 *
 * Definit a lib/pricing.ts (la font de veritat de preus, que ha de poder
 * córrer sense bundler als tests) i reexportat aquí perquè els flags de
 * llançament es consultin sempre des del mateix lloc.
 */
export { PRICING_V2_ENABLED } from "./pricing";
