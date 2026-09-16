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
 * TANCAT per al llançament (16set26): els preus "des de" i les tarifes segueixen
 * visibles, però els CTA porten a contacte i trucada en comptes d'obrir el
 * configurador, que encara no s'ha validat en viu.
 *
 * Es pot obrir NOMÉS EN LOCAL amb `NEXT_PUBLIC_CONFIGURATOR=1` al `.env.local`,
 * per provar-lo sense tocar codi ni arriscar-se a commitar-lo obert. A producció
 * la variable no hi és, així que el default mana i segueix tancat. Per obrir-lo
 * de debò, definir la variable a l'entorn de Vercel o canviar el default aquí.
 */
export const CONFIGURATOR_ENABLED = process.env.NEXT_PUBLIC_CONFIGURATOR === "1";

/**
 * Preus del pla modular 2026 (600 · 990 · 1.990). TANCAT.
 *
 * Definit a lib/pricing.ts (la font de veritat de preus, que ha de poder
 * córrer sense bundler als tests) i reexportat aquí perquè els flags de
 * llançament es consultin sempre des del mateix lloc.
 */
export { PRICING_V2_ENABLED } from "./pricing";
