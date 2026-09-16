"use server"

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/supabase'
import { isContactStatus } from '@/lib/leads'

/** Mou un missatge pel cicle curt: new → replied → archived. */
export async function updateContactStatus(id: string, status: string) {
  if (!isContactStatus(status)) throw new Error(`Estat desconegut: ${status}`)
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('contact_submissions')
    .update({ status })
    .eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/leads')
}

/**
 * Marca o desmarca spam. No toca l'estat: un missatge marcat com a spam
 * conserva el seu i només surt de la vista per defecte.
 */
export async function setContactSpam(id: string, isSpam: boolean) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('contact_submissions')
    .update({ is_spam: isSpam })
    .eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/admin/leads')
}

/**
 * Crea una fitxa de client a partir d'un missatge i el deixa com a respost.
 * Mateix patró que `createClientFromQuote`: el lead entra al CRM amb l'origen
 * anotat, i no es duplica si ja hi ha una fitxa amb aquell correu.
 */
export async function createClientFromContact(id: string) {
  const { supabase } = await requireAdmin()

  const { data: lead, error } = await supabase
    .from('contact_submissions')
    .select('id, name, email, message')
    .eq('id', id)
    .single()
  if (error || !lead) throw new Error(error?.message || 'Missatge no trobat.')

  const { data: existing } = await supabase
    .from('clients')
    .select('id')
    .eq('email', lead.email)
    .maybeSingle()

  if (existing) {
    revalidatePath('/admin/leads')
    return { clientId: existing.id as string, created: false as const }
  }

  const { data: client, error: insErr } = await supabase
    .from('clients')
    .insert({
      name: lead.name || lead.email,
      email: lead.email,
      source: 'contacte',
      status: 'new',
      notes: lead.message,
    })
    .select('id')
    .single()
  if (insErr || !client) throw new Error(insErr?.message || 'No s\'ha pogut crear el client.')

  revalidatePath('/admin/leads')
  revalidatePath('/admin/clients')
  return { clientId: client.id as string, created: true as const }
}
