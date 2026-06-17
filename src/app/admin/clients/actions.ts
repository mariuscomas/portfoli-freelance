"use server"

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase'
import {
  CLIENT_STATUSES,
  type ClientInsert,
  type ClientStatus,
  type ClientUpdate,
} from '@/types/database'

/**
 * Server Actions per CRUD de clients i les seves notes (timeline).
 *
 * Totes verifiquen admin abans de fer res. Si no és admin,
 * `requireAdmin()` redirigeix automàticament a /admin/login.
 *
 * Convencions:
 *   - Els camps opcionals buits es desen com a `null` (no com a "").
 *   - L'estat es valida contra l'enum del codi (CLIENT_STATUSES) i la BD
 *     porta un CHECK addicional com a defensa en profunditat.
 *   - revalidatePath() es crida tant a la llista com a la fitxa del
 *     client tocada perquè els canvis es vegin sense haver de fer F5.
 */

/** Helper: net string buit → null. Es desa a la BD com NULL. */
function nullable(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? '').trim()
  return s.length > 0 ? s : null
}

/** Helper: valida i casteja l'estat rebut. Tira si és invàlid. */
function parseStatus(value: FormDataEntryValue | null): ClientStatus {
  const raw = String(value ?? '').trim()
  if (!raw) return 'new'
  if (!(CLIENT_STATUSES as readonly string[]).includes(raw)) {
    throw new Error(`Estat invàlid: "${raw}".`)
  }
  return raw as ClientStatus
}

/* ------------------------------------------------------------------ */
/*  CRUD bàsic                                                          */
/* ------------------------------------------------------------------ */

/**
 * Crea un client nou i redirigeix a la seva fitxa per poder completar
 * la resta de camps. El nom és obligatori (la resta poden anar omplint-se
 * després). Mateix patró que `createService`.
 */
export async function createClient(formData: FormData) {
  const { supabase } = await requireAdmin()

  const name = String(formData.get('name') || '').trim()
  if (!name) throw new Error('Cal un nom per crear el client.')

  const insert: ClientInsert = {
    name,
    company: nullable(formData.get('company')),
    email: nullable(formData.get('email')),
    phone: nullable(formData.get('phone')),
    website: nullable(formData.get('website')),
    source: nullable(formData.get('source')),
    notes: nullable(formData.get('notes')),
    status: parseStatus(formData.get('status')),
  }

  const { data, error } = await supabase
    .from('clients')
    .insert(insert)
    .select('id')
    .single()

  if (error) throw new Error(`Error creant client: ${error.message}`)

  revalidatePath('/admin/clients')
  redirect(`/admin/clients/${data.id}`)
}

/**
 * Actualitza tots els camps editables d'un client. La validació d'estat
 * es delega a `parseStatus`. Tots els camps opcionals es desen com a
 * NULL si arriben buits perquè la fitxa quedi coherent.
 */
export async function updateClient(id: string, formData: FormData) {
  const { supabase } = await requireAdmin()

  const name = String(formData.get('name') || '').trim()
  if (!name) throw new Error('Cal un nom per actualitzar el client.')

  const update: ClientUpdate = {
    name,
    company: nullable(formData.get('company')),
    email: nullable(formData.get('email')),
    phone: nullable(formData.get('phone')),
    website: nullable(formData.get('website')),
    source: nullable(formData.get('source')),
    notes: nullable(formData.get('notes')),
    status: parseStatus(formData.get('status')),
  }

  const { error } = await supabase
    .from('clients')
    .update(update)
    .eq('id', id)

  if (error) throw new Error(`Error actualitzant client: ${error.message}`)

  revalidatePath('/admin/clients')
  revalidatePath(`/admin/clients/${id}`)
}

/**
 * Canvi ràpid d'estat sense haver de carregar tota la fitxa. Útil
 * directament des de la taula del llistat (botons de pipeline).
 *
 * NB: també revalida `/admin/works` perquè a la fitxa del work
 * mostrem l'estat del client associat.
 */
export async function updateClientStatus(id: string, status: ClientStatus) {
  const { supabase } = await requireAdmin()
  if (!(CLIENT_STATUSES as readonly string[]).includes(status)) {
    throw new Error(`Estat invàlid: "${status}".`)
  }

  const { error } = await supabase
    .from('clients')
    .update({ status })
    .eq('id', id)

  if (error) throw new Error(`Error canviant estat: ${error.message}`)

  revalidatePath('/admin/clients')
  revalidatePath(`/admin/clients/${id}`)
  revalidatePath('/admin/works')
}

/**
 * Elimina un client. ON DELETE SET NULL a `works.client_id` deslliga
 * els projectes (no els esborra). Les notes (client_notes) es cascadeen
 * automàticament per ON DELETE CASCADE.
 */
export async function deleteClient(id: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw new Error(`Error eliminant client: ${error.message}`)

  revalidatePath('/admin/clients')
  revalidatePath('/admin/works')
  redirect('/admin/clients')
}

/* ------------------------------------------------------------------ */
/*  Timeline de notes                                                    */
/* ------------------------------------------------------------------ */

/**
 * Afegeix una entrada nova al timeline d'interaccions del client.
 * Usat des del formulari "Afegir nota" de la fitxa.
 */
export async function addClientNote(clientId: string, formData: FormData) {
  const { supabase } = await requireAdmin()

  const body = String(formData.get('body') || '').trim()
  if (!body) throw new Error('La nota no pot estar buida.')

  const { error } = await supabase
    .from('client_notes')
    .insert({ client_id: clientId, body })

  if (error) throw new Error(`Error afegint nota: ${error.message}`)

  revalidatePath(`/admin/clients/${clientId}`)
}

/**
 * Elimina una entrada concreta del timeline. Es passa també `clientId`
 * per poder revalidar la ruta de la fitxa sense haver de fer una query
 * de lookup addicional.
 */
export async function deleteClientNote(clientId: string, noteId: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('client_notes')
    .delete()
    .eq('id', noteId)
    .eq('client_id', clientId) // defensa addicional contra IDs creuats

  if (error) throw new Error(`Error eliminant nota: ${error.message}`)

  revalidatePath(`/admin/clients/${clientId}`)
}
