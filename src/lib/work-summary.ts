/**
 * Helpers de "resum" per a un work: comptador d'avisos i indicador
 * d'i18n. Compartit entre la pàgina de llistat /admin/works i — si
 * en algun moment cal — l'editor.
 *
 * Es manté server-friendly (no fa servir hooks ni DOM).
 */

import type { Translatable } from '@/types/database'

interface RawHero {
  title?: unknown
  description?: unknown
  backgroundMode?: unknown
  backgroundColor?: unknown
  backgroundImage?: unknown
  overlayOpacity?: unknown
}

interface RawTextSection {
  title?: unknown
  heading?: unknown
}

interface RawMedia {
  url?: unknown
  alt?: unknown
}

interface RawBlock {
  id?: unknown
  textSection?: RawTextSection
  media?: RawMedia[]
}

export interface RawWorkContent {
  hero?: RawHero
  blocks?: RawBlock[]
  conclusion?: unknown
  finalMedia?: RawMedia[]
}

/**
 * Suma els avisos derivats del contingut estructurat (case study).
 *
 * Heurístiques:
 *   - Bloc sense `title` ni `heading` → 1 avís
 *   - Cada mèdia (a bloc o final) amb URL però sense alt text → 1 avís
 */
export function countContentWarnings(content: RawWorkContent | null | undefined): number {
  if (!content) return 0
  let count = 0
  const blocks = Array.isArray(content.blocks) ? content.blocks : []
  for (const b of blocks) {
    const hasHeading = Boolean(
      (typeof b.textSection?.title === 'string' && b.textSection.title.trim()) ||
      (typeof b.textSection?.heading === 'string' && b.textSection.heading.trim())
    )
    if (!hasHeading) count++
    const media = Array.isArray(b.media) ? b.media : []
    for (const m of media) {
      if (typeof m.url === 'string' && m.url.trim() && !(typeof m.alt === 'string' && m.alt.trim())) {
        count++
      }
    }
  }
  const finalMedia = Array.isArray(content.finalMedia) ? content.finalMedia : []
  for (const m of finalMedia) {
    if (typeof m.url === 'string' && m.url.trim() && !(typeof m.alt === 'string' && m.alt.trim())) {
      count++
    }
  }
  return count
}

/**
 * Calcula la completesa d'un locale a partir dels 6 camps i18n del
 * work. Retorna `complete` si els 6 estan plens, `empty` si cap, i
 * `partial` per a estats intermedis.
 */
export type LocaleStatus = 'complete' | 'partial' | 'empty'

/** Camps i18n d'un work que compten per a completesa per locale. */
export const WORK_I18N_FIELDS = ['title', 'slug', 'role', 'category', 'conclusion'] as const

/**
 * Camps i18n d'un servei (més extens que el work — té camps narratius
 * propis com `content_about`, `content_steps`, etc.).
 */
export const SERVICE_I18N_FIELDS = [
  'title',
  'slug',
  'short_description',
  'duration',
  'revisions',
  'content_about',
  'content_steps',
  'content_deliverables',
  'content_why_us',
] as const

/**
 * Calcula completesa d'un locale a partir d'una llista arbitrària de
 * camps. `fields` per defecte usa el de works per retrocompat.
 */
export function localeStatus(
  entity: Record<string, unknown> | null | undefined,
  locale: 'ca' | 'en' | 'es',
  fields: readonly string[] = WORK_I18N_FIELDS
): LocaleStatus {
  if (!entity) return 'empty'
  const filled = fields.reduce((acc, field) => {
    const v = entity[field] as Translatable | null | undefined
    const value = v && typeof v === 'object' ? v[locale] : undefined
    return acc + (typeof value === 'string' && value.trim() ? 1 : 0)
  }, 0)
  if (filled === fields.length) return 'complete'
  if (filled === 0) return 'empty'
  return 'partial'
}

/**
 * Format relatiu en català d'un timestamp. Suport per "ara mateix",
 * "fa X min", "fa X h", "fa X d", "fa X setmanes", "fa X mesos",
 * "fa X anys". Computació server-safe (no Intl.RelativeTimeFormat per
 * mantenir consistència estricta entre SSR i client).
 */
export function relativeTime(date: Date | string | null | undefined, now: Date = new Date()): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (seconds < 30) return 'ara mateix'
  if (seconds < 60) return `fa ${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `fa ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `fa ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `fa ${days} d`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `fa ${weeks} setmanes`
  const months = Math.floor(days / 30)
  if (months < 12) return `fa ${months} mesos`
  const years = Math.floor(days / 365)
  return `fa ${years} ${years === 1 ? 'any' : 'anys'}`
}
