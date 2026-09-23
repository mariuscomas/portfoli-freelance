"use server"

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/supabase'
import { notifyProposalSent } from '@/lib/notifyProposal'
import { formatEuro } from '@/lib/pricing'
import {
  QUOTE_STATUSES,
  QUOTE_REASONS_BY_STATUS,
  QUOTE_VALIDITY_DAYS,
  type QuoteStatus,
  type QuoteOutcomeReason,
} from '@/types/database'

/**
 * Mou una quote pel pipeline comercial (docs/estrategia-negoci.md §6).
 *
 * Dues regles que el CHECK de la BD també imposa, aquí amb missatge llegible:
 *  · declinada/perduda exigeixen motiu tipificat — sense motiu, un lead perdut
 *    no ensenya res i el repricing es faria per intuïció;
 *  · qualsevol altre estat neteja el motiu, perquè no en quedin d'orfes quan
 *    una quote torna enrere.
 *
 * Les dates del cicle s'escriuen soles i NOMÉS la primera vegada: passar a
 * "proposta" arrenca la validesa de 30 dies; passar a "vista" registra
 * l'obertura. Tornar-hi més tard no reinicia el rellotge.
 */
export async function updateQuoteStatus(
  id: string,
  status: string,
  reason?: string | null,
) {
  const { supabase } = await requireAdmin()

  if (!(QUOTE_STATUSES as readonly string[]).includes(status)) {
    throw new Error(`Estat invàlid: "${status}".`)
  }
  const next = status as QuoteStatus

  const allowed = QUOTE_REASONS_BY_STATUS[next]
  if (allowed) {
    if (!reason || !(allowed as readonly string[]).includes(reason)) {
      throw new Error(`L’estat "${next}" necessita un motiu vàlid.`)
    }
  }

  const patch: {
    status: QuoteStatus
    outcome_reason: QuoteOutcomeReason | null
    sent_at?: string
    expires_at?: string
    viewed_at?: string
  } = {
    status: next,
    outcome_reason: allowed ? (reason as QuoteOutcomeReason) : null,
  }

  const { data: current, error: readErr } = await supabase
    .from('quotes')
    .select('sent_at, viewed_at')
    .eq('id', id)
    .single()
  if (readErr) throw new Error(readErr.message)

  const now = new Date()
  if (next === 'proposta' && !current?.sent_at) {
    patch.sent_at = now.toISOString()
    patch.expires_at = new Date(
      now.getTime() + QUOTE_VALIDITY_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString()
  }
  if (next === 'vista' && !current?.viewed_at) {
    patch.viewed_at = now.toISOString()
  }

  const { error } = await supabase.from('quotes').update(patch).eq('id', id)
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

/**
 * Envia la proposta al client: arrenca la validesa de 30 dies, deixa constància
 * a l'historial i li fa arribar l'enllaç de /proposta/[token].
 *
 * És l'única manera que el token comenci a servir contingut: `get_proposal`
 * no retorna res mentre `sent_at` sigui null.
 */
export async function sendProposal(id: string) {
  const { supabase } = await requireAdmin()

  const { data: quote, error } = await supabase
    .from('quotes')
    .select('id, email, name, token, total_eur, rate_label, sent_at, expires_at, status')
    .eq('id', id)
    .single()
  if (error || !quote) throw new Error(error?.message || 'Quote no trobada.')
  if (!quote.email) throw new Error('Aquesta quote no té email: no hi ha on enviar-la.')

  // Un enllaç a localhost dins un correu al client és un correu cremat: val més
  // aturar-ho aquí que enviar-lo i haver-ho d'explicar després.
  const site = process.env.NEXT_PUBLIC_SITE_URL || ''
  if (!site || site.includes('localhost') || site.includes('127.0.0.1')) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL apunta a localhost: l’enllaç de la proposta no funcionaria. Posa-hi el domini abans d’enviar-la.",
    )
  }

  const now = new Date()
  const sentAt = quote.sent_at ?? now.toISOString()
  const expiresAt =
    quote.expires_at ?? new Date(now.getTime() + QUOTE_VALIDITY_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { error: upErr } = await supabase
    .from('quotes')
    .update({ status: 'proposta', sent_at: sentAt, expires_at: expiresAt, outcome_reason: null })
    .eq('id', id)
  if (upErr) throw new Error(upErr.message)

  await supabase.from('quote_events').insert({ quote_id: id, type: 'sent' })

  const mail = await notifyProposalSent({
    to: quote.email,
    name: quote.name,
    token: quote.token,
    totalLabel: quote.total_eur != null ? formatEuro(quote.total_eur) : (quote.rate_label ?? ''),
    expiresLabel: new Date(expiresAt).toLocaleDateString('ca-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
  })

  revalidatePath('/admin/quotes')

  // La proposta ja consta com a enviada (sent_at i l'event són a la BD), però
  // si el correu no ha sortit cal dir-ho: si no, l'única pista seria el silenci
  // del client. No llancem — desfer l'enviament seria pitjor que avisar-ne.
  if (mail.ok) return { mailed: true as const }

  const motiu = mail.skipped
    ? "no hi ha RESEND_API_KEY configurada en aquest entorn"
    : (mail.error ?? 'error desconegut')
  return {
    mailed: false as const,
    warning:
      `La proposta consta com a enviada, però el correu NO ha sortit: ${motiu}. ` +
      `Passa-li l’enllaç tu mateix o arregla-ho i prem «Reenvia».`,
  }
}
