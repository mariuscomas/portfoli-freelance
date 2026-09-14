"use server"

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/supabase'

const VALID_STATUSES = ['nou', 'revisat', 'proposta', 'guanyat', 'perdut']

/** Canvia l'estat d'una quote al pipeline. */
export async function updateQuoteStatus(id: string, status: string) {
  const { supabase } = await requireAdmin()
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Estat invàlid: "${status}".`)
  }
  const { error } = await supabase.from('quotes').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/quotes')
}

/** Esborra una quote (leads descartats/spam). */
export async function deleteQuote(id: string) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('quotes').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/quotes')
}

/** Associa (o desassocia amb null) una quote a una fitxa de client del CRM. */
export async function linkQuoteToClient(quoteId: string, clientId: string | null) {
  const { supabase } = await requireAdmin()
  const { error } = await supabase.from('quotes').update({ client_id: clientId }).eq('id', quoteId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/quotes')
  revalidatePath('/admin/clients')
}

/** Crea una fitxa de client a partir de la quote (email/nom) i la hi vincula. */
export async function createClientFromQuote(quoteId: string) {
  const { supabase } = await requireAdmin()

  const { data: quote, error: qErr } = await supabase
    .from('quotes')
    .select('email, name')
    .eq('id', quoteId)
    .single()
  if (qErr || !quote) throw new Error(qErr?.message || 'Quote no trobada.')

  const { data: client, error: cErr } = await supabase
    .from('clients')
    .insert({
      name: quote.name || quote.email || 'Lead sense nom',
      email: quote.email,
      source: 'configurador',
      status: 'new',
    })
    .select('id')
    .single()
  if (cErr || !client) throw new Error(cErr?.message || 'No s\'ha pogut crear el client.')

  const { error: linkErr } = await supabase
    .from('quotes')
    .update({ client_id: client.id })
    .eq('id', quoteId)
  if (linkErr) throw new Error(linkErr.message)

  revalidatePath('/admin/quotes')
  revalidatePath('/admin/clients')
}
