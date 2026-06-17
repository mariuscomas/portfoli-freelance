"use server"

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase'
import type { ServiceInsert, ServiceUpdate, Translatable } from '@/types/database'

/**
 * Server Actions per CRUD de services.
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

export async function createService(formData: FormData) {
  const { supabase } = await requireAdmin()

  const titleCa = String(formData.get('title_ca') || '').trim()
  const slugCa = String(formData.get('slug_ca') || '').trim()
  const iconName = String(formData.get('icon_name') || '').trim()

  if (!titleCa || !slugCa || !iconName) {
    throw new Error('Cal títol, slug i icon_name per crear un servei')
  }

  const imageUrl = String(formData.get('image_url') || '').trim()

  const insert: ServiceInsert = {
    title: { ca: titleCa },
    slug: { ca: slugCa },
    icon_name: iconName,
    image_url: imageUrl || null,
    is_published: formData.get('is_published') === 'on',
  }

  const { data, error } = await supabase
    .from('services')
    .insert(insert)
    .select('id')
    .single()

  if (error) throw new Error(`Error creant servei: ${error.message}`)

  revalidatePath('/admin/serveis')
  revalidatePath('/serveis')
  redirect(`/admin/serveis/${data.id}`)
}

export async function updateService(id: string, formData: FormData) {
  const { supabase } = await requireAdmin()

  const title = buildI18n(formData, 'title')
  const slug = buildI18n(formData, 'slug')
  if (!title || !slug) throw new Error('Cal almenys un títol i un slug')

  const priceRaw = String(formData.get('price_starts_at') || '').trim()
  const priceParsed = priceRaw ? Number(priceRaw) : null
  if (priceRaw && Number.isNaN(priceParsed)) {
    throw new Error('El preu ha de ser un número')
  }

  // Els camps narratius ara són textareas i18n normals (no JSON cru).
  // buildI18n agrupa els 3 idiomes en un objecte {ca, en, es}.
  const update: ServiceUpdate = {
    title,
    slug,
    icon_name: String(formData.get('icon_name') || '').trim() || undefined,
    image_url: String(formData.get('image_url') || '').trim() || null,
    price_starts_at: priceParsed,
    short_description: buildI18n(formData, 'short_description'),
    duration: buildI18n(formData, 'duration'),
    revisions: buildI18n(formData, 'revisions'),
    content_about: buildI18n(formData, 'content_about'),
    content_steps: buildI18n(formData, 'content_steps'),
    content_deliverables: buildI18n(formData, 'content_deliverables'),
    content_why_us: buildI18n(formData, 'content_why_us'),
    // payment_milestones es manté hardcoded al ServiceModal (50/50) per ara.
    // Si vols editar-lo, caldrà fer un sub-editor estructurat.
    is_published: formData.get('is_published') === 'on',
  }

  const { error } = await supabase
    .from('services')
    .update(update)
    .eq('id', id)

  if (error) throw new Error(`Error actualitzant servei: ${error.message}`)

  revalidatePath('/admin/serveis')
  revalidatePath(`/admin/serveis/${id}`)
  revalidatePath('/serveis')
}

/**
 * Reordena els serveis segons l'array d'ids rebut. Mateixa lògica
 * que reorderWorks: ordre per `order_index`, paral·lel updates.
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

/**
 * Duplica un servei existent com a esborrany. Mateixa lògica que duplicateWork:
 *   - Afegeix "(còpia)" al títol per locale present
 *   - Sufix curt aleatori als slugs
 *   - Marca el nou servei com is_published=false
 */
export async function duplicateService(formData: FormData) {
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id') || '').trim()
  if (!id) throw new Error('ID requerit per duplicar')

  const { data: source, error: readErr } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single()

  if (readErr || !source) throw new Error('Servei original no trobat')

  const shortId = Math.random().toString(36).slice(2, 6)

  const sourceTitle = (source.title as Translatable | null) || null
  const copyTitle: Translatable = {}
  if (sourceTitle?.ca) copyTitle.ca = `${sourceTitle.ca} (còpia)`
  if (sourceTitle?.en) copyTitle.en = `${sourceTitle.en} (copy)`
  if (sourceTitle?.es) copyTitle.es = `${sourceTitle.es} (copia)`
  if (!copyTitle.ca) copyTitle.ca = `Servei duplicat (${shortId})`

  const sourceSlug = (source.slug as Translatable | null) || null
  const copySlug: Translatable = {}
  if (sourceSlug?.ca) copySlug.ca = `${sourceSlug.ca}-copia-${shortId}`
  if (sourceSlug?.en) copySlug.en = `${sourceSlug.en}-copy-${shortId}`
  if (sourceSlug?.es) copySlug.es = `${sourceSlug.es}-copia-${shortId}`
  if (!copySlug.ca) copySlug.ca = `nou-servei-${shortId}`

  const insert: ServiceInsert = {
    title: copyTitle,
    slug: copySlug,
    icon_name: source.icon_name,
    image_url: source.image_url,
    price_starts_at: source.price_starts_at,
    short_description: source.short_description as Translatable | null,
    duration: source.duration as Translatable | null,
    revisions: source.revisions as Translatable | null,
    content_about: source.content_about as Translatable | null,
    content_steps: source.content_steps as Translatable | null,
    content_deliverables: source.content_deliverables as Translatable | null,
    content_why_us: source.content_why_us as Translatable | null,
    is_published: false,
  }

  const { data, error } = await supabase
    .from('services')
    .insert(insert)
    .select('id')
    .single()

  if (error) throw new Error(`Error duplicant: ${error.message}`)

  revalidatePath('/admin/serveis')
  redirect(`/admin/serveis/${data.id}`)
}

export async function deleteService(id: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) throw new Error(`Error eliminant servei: ${error.message}`)
  revalidatePath('/admin/serveis')
  revalidatePath('/serveis')
  redirect('/admin/serveis')
}
