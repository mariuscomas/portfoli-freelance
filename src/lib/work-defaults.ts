/**
 * Constants compartides entre el server action que crea drafts i el
 * client component que els pinta. Viu fora de qualsevol mòdul amb
 * "use server" perquè el client el pugui importar sense incloure
 * codi server-only al bundle.
 */

/** Títol marcador per detectar drafts encara sense omplir. */
export const DRAFT_PLACEHOLDER_TITLE = 'Treball sense títol'

/** Prefix dels slugs generats per drafts automàtics. */
export const DRAFT_SLUG_PREFIX = 'nou-treball-'

/** Detecta si un work és un draft acabat de crear (encara amb placeholders). */
export function isFreshDraft(
  title: { ca?: string } | null | undefined,
  isPublished: boolean | null | undefined
): boolean {
  return !isPublished && title?.ca === DRAFT_PLACEHOLDER_TITLE
}

/**
 * Converteix un títol qualsevol en un slug vàlid (kebab-case, ASCII only).
 *
 *   "Pere & Maria's Cafè"  → "pere-maria-s-cafe"
 *   "PADLL — Plataforma"   → "padll-plataforma"
 *   "Hola 2024"            → "hola-2024"
 *
 * Implementació:
 *   1. Lowercase
 *   2. NFKD per descompondre accents → mark + base
 *   3. Strip combining marks (diacritics)
 *   4. Substituir qualsevol no-[a-z0-9] per guió
 *   5. Strip leading/trailing hyphens
 *   6. Limitar longitud raonable (100 chars)
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}
