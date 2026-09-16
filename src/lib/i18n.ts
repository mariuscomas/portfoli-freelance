/**
 * Helpers d'internacionalització per a camps jsonb i18n de Supabase.
 *
 * Tots els camps de text "traduïbles" a la BD són objectes amb la forma
 * `{ca?: string, en?: string, es?: string}`. Aquestes utilities donen
 * sempre un string al consumidor final.
 */

export type Translatable = {
  ca?: string
  en?: string
  es?: string
}

export type Locale = 'ca' | 'en' | 'es'

const LANG_KEYS = new Set(['ca', 'en', 'es', 'fr', 'de', 'pt', 'it'])

/**
 * Comprova si un valor és un objecte translatable (té només claus d'idioma).
 */
export function isTranslatable(v: unknown): v is Translatable {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false
  const keys = Object.keys(v as object)
  if (keys.length === 0) return false
  return keys.every((k) => LANG_KEYS.has(k))
}

/** Ordre de preferència quan l'idioma demanat no hi és. */
const FALLBACK_ORDER: readonly string[] = ['ca', 'en', 'es']

/**
 * Extreu un string d'un camp jsonb translatable.
 * Prioritza l'idioma demanat → CA → EN → ES → qualsevol altre amb text.
 *
 * Dues coses que abans feien desaparèixer text i ara no (16set26):
 *
 *  1. La cadena buida no compta com a traducció. Amb `??`, un camp desat com
 *     `{ca: '', en: 'Hello'}` (que és el que deixa l'admin quan es buida el
 *     català) retornava '' i amagava l'anglès que sí que hi era.
 *  2. La caiguda no es limita a ca/en/es. `isTranslatable` accepta set
 *     idiomes, així que `{fr: 'Bonjour'}` és un camp vàlid; abans retornava ''
 *     perquè cap de les tres claus conegudes hi era.
 *
 * Retornar buit segueix sent possible, però només quan de debò no hi ha text
 * enlloc.
 */
export function t(field: unknown, locale: Locale = 'ca'): string {
  if (typeof field === 'string') return field
  if (field == null) return ''
  if (!isTranslatable(field)) {
    // Si no és translatable ni string, no és un text vàlid
    return ''
  }

  const entries = field as Record<string, unknown>
  const pick = (key: string): string | null => {
    const v = entries[key]
    return typeof v === 'string' && v.trim().length > 0 ? v : null
  }

  const preferred = pick(locale)
  if (preferred) return preferred

  for (const key of FALLBACK_ORDER) {
    const v = pick(key)
    if (v) return v
  }

  // Últim recurs: qualsevol idioma amb text. Val més un títol en francès que
  // una targeta sense títol.
  for (const key of Object.keys(entries)) {
    const v = pick(key)
    if (v) return v
  }

  return ''
}

/**
 * Aplana recursivament tots els camps translatable d'un objecte/array.
 * Útil per camps jsonb complexos com `works.content` que pot tenir
 * objectes translatable a qualsevol profunditat.
 */
export function flattenI18n<T = unknown>(value: unknown, locale: Locale = 'ca'): T {
  if (value == null) return value as T
  if (isTranslatable(value)) return t(value, locale) as T
  if (Array.isArray(value)) return value.map((v) => flattenI18n(v, locale)) as T
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = flattenI18n(v, locale)
    }
    return out as T
  }
  return value as T
}
