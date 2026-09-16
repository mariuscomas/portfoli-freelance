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
 * configurador, que encara no s'ha validat en viu. Per tornar a obrir-lo, posar
 * això a `true` — no cal desfer res més.
 */
export const CONFIGURATOR_ENABLED = false;
