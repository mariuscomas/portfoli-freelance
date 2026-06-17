"use server"

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/supabase'
import type {
  WorkRole,
  WorkCategory,
  WorkRoleInsert,
  WorkCategoryInsert,
  Translatable,
} from '@/types/database'

/**
 * Server actions per a les taxonomies de works (rols + categories).
 *
 * Patró Linear/Notion: les taxonomies són FK simples amb taula pròpia.
 * Es gestionen INLINE des del WorkForm (crear/renombrar/canviar color
 * sense sortir del context) — no hi ha pàgina admin dedicada.
 *
 * Decisió: els CRUDs s'implementen com a parells idèntics per a rols i
 * categories. Hauríem pogut fer-ho generic amb un únic action que rep
 * el `kind: 'role' | 'category'`, però el TypeScript queda més clar
 * amb funcions separades i el codi és tan curt que no val la pena
 * la abstracció.
 */

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Construeix l'objecte i18n a partir de strings individuals. Filtra
 * els camps buits perquè no ocupin espai al jsonb. Si tot està buit
 * (cas patològic), retorna un objecte amb només `ca` al placeholder
 * — la columna `name` és NOT NULL.
 */
function buildI18nName(ca?: string, en?: string, es?: string): Translatable {
  const out: Translatable = {}
  if (ca?.trim()) out.ca = ca.trim()
  if (en?.trim()) out.en = en.trim()
  if (es?.trim()) out.es = es.trim()
  return out
}

/** Sanitiza un color hex opcional. Accepta `#RRGGBB` o NULL. */
function normalizeColor(color?: string | null): string | null {
  if (!color) return null
  const trimmed = color.trim()
  if (!/^#[0-9a-fA-F]{6}$/.test(trimmed)) return null
  return trimmed.toLowerCase()
}

/* ------------------------------------------------------------------ */
/*  WORK ROLES                                                          */
/* ------------------------------------------------------------------ */

/**
 * Retorna tots els rols ordenats per `order_index` ascendent, després
 * per `created_at` (fallback estable). El public read està activat a
 * RLS, però mantenim l'auth check perquè aquests actions són per a
 * l'admin — el frontend public llegeix directament via supabase client.
 */
export async function listWorkRoles(): Promise<WorkRole[]> {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase
    .from('work_roles')
    .select('*')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw new Error(`Error llistant rols: ${error.message}`)
  return data ?? []
}

export async function createWorkRole(params: {
  name_ca: string
  name_en?: string
  name_es?: string
  color?: string | null
}): Promise<WorkRole> {
  const { supabase } = await requireAdmin()
  const name = buildI18nName(params.name_ca, params.name_en, params.name_es)
  if (!name.ca) throw new Error('El rol necessita un nom en català')

  // order_index: posem-lo al final per default. Sql max + 1.
  const { data: maxRow } = await supabase
    .from('work_roles')
    .select('order_index')
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextIndex = (maxRow?.order_index ?? -1) + 1

  const insert: WorkRoleInsert = {
    name,
    color: normalizeColor(params.color),
    order_index: nextIndex,
  }
  const { data, error } = await supabase
    .from('work_roles')
    .insert(insert)
    .select('*')
    .single()
  if (error) throw new Error(`Error creant rol: ${error.message}`)

  revalidatePath('/admin/works')
  return data as WorkRole
}

export async function updateWorkRole(
  id: string,
  patch: {
    name_ca?: string
    name_en?: string
    name_es?: string
    color?: string | null
  }
): Promise<WorkRole> {
  const { supabase } = await requireAdmin()
  // Per evitar sobrescriure camps existents amb undefined, fem fetch i
  // merge — només substituïm els que ens han arribat al patch.
  const { data: existing, error: readErr } = await supabase
    .from('work_roles')
    .select('name, color')
    .eq('id', id)
    .single()
  if (readErr || !existing) throw new Error('Rol no trobat')

  const existingName = (existing.name as Translatable) || {}
  const name: Translatable = {
    ...existingName,
    ...(patch.name_ca !== undefined ? { ca: patch.name_ca.trim() } : {}),
    ...(patch.name_en !== undefined ? { en: patch.name_en.trim() } : {}),
    ...(patch.name_es !== undefined ? { es: patch.name_es.trim() } : {}),
  }
  // Net els valors buits — si un locale ha quedat com a '', el treiem.
  for (const k of Object.keys(name) as (keyof Translatable)[]) {
    if (!name[k]) delete name[k]
  }
  if (!name.ca) throw new Error('El rol necessita un nom en català')

  const { data, error } = await supabase
    .from('work_roles')
    .update({
      name,
      ...(patch.color !== undefined ? { color: normalizeColor(patch.color) } : {}),
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(`Error actualitzant rol: ${error.message}`)

  revalidatePath('/admin/works')
  return data as WorkRole
}

export async function deleteWorkRole(id: string): Promise<void> {
  const { supabase } = await requireAdmin()
  // FK ON DELETE SET NULL — els works vinculats quedaran sense rol,
  // no rebran error. Coherent amb client_id.
  const { error } = await supabase.from('work_roles').delete().eq('id', id)
  if (error) throw new Error(`Error eliminant rol: ${error.message}`)
  revalidatePath('/admin/works')
}

/* ------------------------------------------------------------------ */
/*  WORK CATEGORIES                                                    */
/* ------------------------------------------------------------------ */

export async function listWorkCategories(): Promise<WorkCategory[]> {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase
    .from('work_categories')
    .select('*')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw new Error(`Error llistant categories: ${error.message}`)
  return data ?? []
}

export async function createWorkCategory(params: {
  name_ca: string
  name_en?: string
  name_es?: string
  color?: string | null
}): Promise<WorkCategory> {
  const { supabase } = await requireAdmin()
  const name = buildI18nName(params.name_ca, params.name_en, params.name_es)
  if (!name.ca) throw new Error('La categoria necessita un nom en català')

  const { data: maxRow } = await supabase
    .from('work_categories')
    .select('order_index')
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextIndex = (maxRow?.order_index ?? -1) + 1

  const insert: WorkCategoryInsert = {
    name,
    color: normalizeColor(params.color),
    order_index: nextIndex,
  }
  const { data, error } = await supabase
    .from('work_categories')
    .insert(insert)
    .select('*')
    .single()
  if (error) throw new Error(`Error creant categoria: ${error.message}`)

  revalidatePath('/admin/works')
  return data as WorkCategory
}

export async function updateWorkCategory(
  id: string,
  patch: {
    name_ca?: string
    name_en?: string
    name_es?: string
    color?: string | null
  }
): Promise<WorkCategory> {
  const { supabase } = await requireAdmin()
  const { data: existing, error: readErr } = await supabase
    .from('work_categories')
    .select('name, color')
    .eq('id', id)
    .single()
  if (readErr || !existing) throw new Error('Categoria no trobada')

  const existingName = (existing.name as Translatable) || {}
  const name: Translatable = {
    ...existingName,
    ...(patch.name_ca !== undefined ? { ca: patch.name_ca.trim() } : {}),
    ...(patch.name_en !== undefined ? { en: patch.name_en.trim() } : {}),
    ...(patch.name_es !== undefined ? { es: patch.name_es.trim() } : {}),
  }
  for (const k of Object.keys(name) as (keyof Translatable)[]) {
    if (!name[k]) delete name[k]
  }
  if (!name.ca) throw new Error('La categoria necessita un nom en català')

  const { data, error } = await supabase
    .from('work_categories')
    .update({
      name,
      ...(patch.color !== undefined ? { color: normalizeColor(patch.color) } : {}),
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(`Error actualitzant categoria: ${error.message}`)

  revalidatePath('/admin/works')
  return data as WorkCategory
}

export async function deleteWorkCategory(id: string): Promise<void> {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('work_categories').delete().eq('id', id)
  if (error) throw new Error(`Error eliminant categoria: ${error.message}`)
  revalidatePath('/admin/works')
}
