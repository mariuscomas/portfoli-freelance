"use server"

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/supabase'
import type { Json, ServiceUpdate } from '@/types/database'

/**
 * Server Actions dels tres productes del catàleg (web · landing · auditoria).
 *
 * No és un CRUD: els productes són fixos, perquè cada un té la seva ruta i els
 * seus preus a codi (`product_id` té check constraint i unique). Per això aquí
 * només hi ha editar i reordenar: crear, duplicar i esborrar es van retirar el
 * 16set26 amb el pas del contingut a Supabase.
 *
 * Repartiment: la taula guarda el COPY, src/lib/pricing.ts guarda el PREU.
 */

function buildI18n(formData: FormData, key: string): Record<string, string> | null {
  const ca = String(formData.get(`${key}_ca`) || '').trim()
  const en = String(formData.get(`${key}_en`) || '').trim()
  const es = String(formData.get(`${key}_es`) || '').trim()
  const obj: Record<string, string> = {}
  if (ca) obj.ca = ca
  if (en) obj.en = en
  if (es) obj.es = es
  return Object.keys(obj).length > 0 ? obj : null
}

/**
 * Parseja la llista "què inclou" que l'editor envia com a JSON string.
 * Forma esperada: [{ca,en,es}, ...]. Retorna null si no queda cap línia útil
 * → la web cau a la llista del catàleg de codi.
 */
function buildIncludes(formData: FormData): Json | null {
  const raw = String(formData.get('includes') || '').trim()
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    const clean = parsed.filter((line) => {
      if (!line || typeof line !== 'object') return false
      const o = line as Record<string, unknown>
      return ['ca', 'en', 'es'].some((k) => typeof o[k] === 'string' && o[k] !== '')
    })
    return clean.length ? (clean as Json) : null
  } catch {
    return null
  }
}

export async function updateService(id: string, formData: FormData) {
  const { supabase } = await requireAdmin()

  const title = buildI18n(formData, 'title')
  if (!title) throw new Error('Cal almenys un títol')

  // price_label només en català: la union del tipus a pricing.ts és catalana i
  // la web pública no té altres idiomes actius.
  const priceLabel = buildI18n(formData, 'price_label')

  const update: ServiceUpdate = {
    title,
    short_description: buildI18n(formData, 'short_description'),
    cta: buildI18n(formData, 'cta'),
    price_label: priceLabel,
    includes: buildIncludes(formData),
    is_published: formData.get('is_published') === 'on',
  }

  const { data, error } = await supabase
    .from('services')
    .update(update)
    .eq('id', id)
    .select('product_id')
    .single()

  if (error) throw new Error(`Error actualitzant servei: ${error.message}`)

  revalidatePath('/admin/serveis')
  revalidatePath(`/admin/serveis/${id}`)
  revalidatePath('/serveis')
  if (data?.product_id) revalidatePath(`/serveis/${data.product_id}`)
  revalidatePath('/sitemap.xml')
}

/**
 * Reordena els productes segons l'array d'ids rebut: és l'ordre de les cards
 * de la tríada a /serveis.
 */
export async function reorderServices(orderedIds: string[]) {
  const { supabase } = await requireAdmin()
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return

  const results = await Promise.all(
    orderedIds.map((id, idx) =>
      supabase.from('services').update({ order_index: idx }).eq('id', id)
    )
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw new Error(`Error reordenant: ${failed.error.message}`)

  revalidatePath('/admin/serveis')
  revalidatePath('/serveis')
}
