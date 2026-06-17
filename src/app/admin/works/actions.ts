"use server"

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase'
import { DRAFT_PLACEHOLDER_TITLE, DRAFT_SLUG_PREFIX } from '@/lib/work-defaults'
import type { WorkInsert, WorkUpdate, Translatable } from '@/types/database'

/**
 * Server Actions per CRUD de works.
 * Totes verifiquen admin abans de fer res. Si no és admin, requireAdmin()
 * redirigeix automàticament a /admin/login.
 */

/**
 * Crea un work en estat d'esborrany amb defaults i retorna l'ID.
 *
 * Si ja existeix un draft amb el títol placeholder creat les darreres
 * 24h, el reutilitza enlloc de crear-ne un de nou. Això evita acumular
 * drafts buits si l'usuari fa clic repetidament a "Nou treball".
 */
export async function createDraftWork(): Promise<string> {
  const { supabase } = await requireAdmin()

  // Comprovem si hi ha un draft buit recent
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: recentDrafts } = await supabase
    .from('works')
    .select('id, title, created_at')
    .eq('is_published', false)
    .gt('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5)

  if (recentDrafts) {
    const reusable = recentDrafts.find((w) => {
      const title = w.title as Translatable | null
      return title?.ca === DRAFT_PLACEHOLDER_TITLE
    })
    if (reusable) return String(reusable.id)
  }

  // Slug curt aleatori per evitar col·lisions amb altres drafts simultanis
  const shortId = Math.random().toString(36).slice(2, 6)
  const insert: WorkInsert = {
    title: { ca: DRAFT_PLACEHOLDER_TITLE },
    slug: { ca: `${DRAFT_SLUG_PREFIX}${shortId}` },
    hero_color: '#1A1A1A',
    is_published: false,
    is_featured: false,
  }

  const { data, error } = await supabase
    .from('works')
    .insert(insert)
    .select('id')
    .single()

  if (error) throw new Error(`Error creant esborrany: ${error.message}`)

  revalidatePath('/admin/works')
  return String(data.id)
}

export async function updateWork(id: string, formData: FormData) {
  const { supabase } = await requireAdmin()

  // Camps i18n - acceptem CA/EN/ES per a cada camp narratiu
  const buildI18n = (key: string) => {
    const ca = String(formData.get(`${key}_ca`) || '').trim()
    const en = String(formData.get(`${key}_en`) || '').trim()
    const es = String(formData.get(`${key}_es`) || '').trim()
    const obj: Record<string, string> = {}
    if (ca) obj.ca = ca
    if (en) obj.en = en
    if (es) obj.es = es
    return Object.keys(obj).length > 0 ? obj : null
  }

  const title = buildI18n('title')
  const slug = buildI18n('slug')

  if (!title || !slug) {
    throw new Error('Cal almenys un títol i un slug')
  }

  // Vincle estructurat amb la fitxa de Client (taula `clients`). És
  // independent del camp i18n `client_name`: aquest segueix sent un text
  // lliure traduïble (útil per a casos antics o quan el client no té
  // fitxa). El selector del form envia "" si l'usuari escull "— Sense
  // client —"; ho convertim a NULL explícitament.
  const clientIdRaw = String(formData.get('client_id') || '').trim()

  // Rol i Categoria ara són FK (taula work_roles / work_categories).
  // El form envia role_id i category_id via hidden input des del
  // TaxonomyCombobox. Si l'usuari els ha esborrat (cadena buida), NULL.
  // NOTE: les columnes jsonb antigues `role` i `category` es mantenen a
  // la BD com a fallback per a works sense FK, però aquesta action ja
  // no les escriu.
  const roleIdRaw = String(formData.get('role_id') || '').trim()
  const categoryIdRaw = String(formData.get('category_id') || '').trim()

  const update: WorkUpdate = {
    title,
    slug,
    client_id: clientIdRaw || null,
    role_id: roleIdRaw || null,
    category_id: categoryIdRaw || null,
    // NOTE: client_name (i18n) ja no s'escriu — l'admin ara només
    // vincula clients via `client_id` (select). El camp jsonb segueix
    // existint a la BD com a llegat però aquest action no el toca.
    // NOTE: short_description ja no es renderitza al form — l'ús SEO
    // viu ara a `meta_description`, i el hero usa content.hero.description.
    // Mantenim la columna a la BD per a fallback de works antics.
    conclusion: buildI18n('conclusion'),
    // hero_color (columna) ja no s'escriu des del form: el color del hero
    // viu només a content.hero.backgroundColor. La columna queda legible
    // com a fallback per a works que no s'hagin reeditat des de la migració.
    accent_color: String(formData.get('accent_color') || '').trim() || null,
    year: String(formData.get('year') || '').trim() || null,
    main_image_url: String(formData.get('main_image_url') || '').trim() || null,
    // Alt text de la thumbnail principal. Persistit a la nova columna
    // `main_image_alt` (text). No i18n — un sol valor per work.
    main_image_alt: String(formData.get('main_image_alt') || '').trim() || null,
    is_published: formData.get('is_published') === 'on',
    is_featured: formData.get('is_featured') === 'on',
    // ── Camps SEO ──
    og_image_url: String(formData.get('og_image_url') || '').trim() || null,
    meta_title: buildI18n('meta_title'),
    meta_description: buildI18n('meta_description'),
    // is_indexable: per defecte true. El checkbox al form representa
    // l'estat invers ("no indexable"): si marcat → false; si desmarcat → true.
    is_indexable: formData.get('noindex') !== 'on',
  }

  // Camp content (jsonb): permetem entrar JSON cru per a flexibilitat
  const contentRaw = String(formData.get('content_json') || '').trim()
  if (contentRaw) {
    try {
      update.content = JSON.parse(contentRaw)
    } catch {
      throw new Error('El camp Content no és JSON vàlid')
    }
  } else {
    update.content = null
  }

  const { error } = await supabase
    .from('works')
    .update(update)
    .eq('id', id)

  if (error) throw new Error(`Error actualitzant work: ${error.message}`)

  revalidatePath('/admin/works')
  revalidatePath(`/admin/works/${id}`)
  revalidatePath('/admin/clients')
  // Si el client ha canviat, revalidem també la fitxa del nou client
  // perquè el comptador de projectes vinculats es refresqui sense F5.
  if (clientIdRaw) revalidatePath(`/admin/clients/${clientIdRaw}`)
  revalidatePath('/works')
  // Revalida també la ruta pública del slug (si l'app la genera)
  if (typeof slug.ca === 'string') revalidatePath(`/works/${slug.ca}`)
}

export async function deleteWork(id: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase.from('works').delete().eq('id', id)
  if (error) throw new Error(`Error eliminant work: ${error.message}`)

  revalidatePath('/admin/works')
  revalidatePath('/works')
  redirect('/admin/works')
}

/**
 * Duplica un work existent com a esborrany nou.
 *
 * Copia tots els camps (title, slug, content jsonb, imatges, etc.) i:
 *   - Afegeix "(còpia)" al títol en cada locale present (ca/en/es)
 *   - Genera slugs nous amb sufix aleatori per evitar col·lisions de URL
 *   - Marca el nou work com `is_published=false` i `is_featured=false`
 *
 * Els blocs i media interns mantenen les seves id originals — són
 * únics dins del JSON i no col·lisionen entre works.
 */
export async function duplicateWork(formData: FormData) {
  const { supabase } = await requireAdmin()
  const id = String(formData.get('id') || '').trim()
  if (!id) throw new Error('ID requerit per duplicar')

  const { data: source, error: readErr } = await supabase
    .from('works')
    .select('*')
    .eq('id', id)
    .single()

  if (readErr || !source) throw new Error('Treball original no trobat')

  // Sufix curt per a fer els slugs únics dins de la BD
  const shortId = Math.random().toString(36).slice(2, 6)

  // Helper: afegir "(còpia)" al títol per locale
  const sourceTitle = (source.title as Translatable | null) || null
  const copyTitle: Translatable = {}
  if (sourceTitle?.ca) copyTitle.ca = `${sourceTitle.ca} (còpia)`
  if (sourceTitle?.en) copyTitle.en = `${sourceTitle.en} (copy)`
  if (sourceTitle?.es) copyTitle.es = `${sourceTitle.es} (copia)`
  // Fallback si no hi havia CA
  if (!copyTitle.ca) copyTitle.ca = `Treball duplicat (${shortId})`

  // Helper: slugs nous amb sufix per locale
  const sourceSlug = (source.slug as Translatable | null) || null
  const copySlug: Translatable = {}
  if (sourceSlug?.ca) copySlug.ca = `${sourceSlug.ca}-copia-${shortId}`
  if (sourceSlug?.en) copySlug.en = `${sourceSlug.en}-copy-${shortId}`
  if (sourceSlug?.es) copySlug.es = `${sourceSlug.es}-copia-${shortId}`
  if (!copySlug.ca) copySlug.ca = `nou-treball-${shortId}`

  const insert: WorkInsert = {
    title: copyTitle,
    slug: copySlug,
    client_name: source.client_name as Translatable | null,
    role: source.role as Translatable | null,
    short_description: source.short_description as Translatable | null,
    conclusion: source.conclusion as Translatable | null,
    hero_color: source.hero_color,
    year: source.year,
    main_image_url: source.main_image_url,
    main_image_alt: source.main_image_alt,
    content: source.content,
    is_published: false,
    is_featured: false,
  }

  const { data, error } = await supabase
    .from('works')
    .insert(insert)
    .select('id')
    .single()

  if (error) throw new Error(`Error duplicant: ${error.message}`)

  revalidatePath('/admin/works')
  redirect(`/admin/works/${data.id}`)
}

/**
 * Reordena els works actualitzant `order_index` segons la posició a
 * l'array rebut. Index 0 va primer, índex N va últim. Aquest és el
 * mateix camp que el públic fa servir per ordenar a /works.
 *
 * Implementació: paral·lel updates via Promise.all. Per a llistes <50
 * elements (típic d'un portfolio) és més que suficient.
 */
export async function reorderWorks(orderedIds: string[]) {
  const { supabase } = await requireAdmin()
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return

  const results = await Promise.all(
    orderedIds.map((id, idx) =>
      supabase.from('works').update({ order_index: idx }).eq('id', id)
    )
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw new Error(`Error reordenant: ${failed.error.message}`)

  revalidatePath('/admin/works')
  revalidatePath('/works')
}

export async function toggleWorkPublished(id: string, isPublished: boolean) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('works')
    .update({ is_published: isPublished })
    .eq('id', id)

  if (error) throw new Error(`Error canviant estat: ${error.message}`)

  revalidatePath('/admin/works')
  revalidatePath('/works')
}
