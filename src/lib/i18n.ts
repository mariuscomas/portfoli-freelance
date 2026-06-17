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

/**
 * Extreu un string d'un camp jsonb translatable.
 * Prioritza l'idioma demanat → CA → primera disponible → string buit.
 */
export function t(field: unknown, locale: Locale = 'ca'): string {
  if (typeof field === 'string') return field
  if (field == null) return ''
  if (isTranslatable(field)) {
    return field[locale] ?? field.ca ?? field.en ?? field.es ?? ''
  }
  // Si no és translatable ni string, no és un text vàlid
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
