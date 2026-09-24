"use client"

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlass, CaretDown, Trash } from '@phosphor-icons/react'
import type { Quote } from '@/types/database'
import {
  QUOTE_STATUSES,
  QUOTE_STATUS_META,
  QUOTE_REASONS_BY_STATUS,
  QUOTE_OUTCOME_REASON_LABELS,
  type QuoteStatus,
  type QuoteOutcomeReason,
} from '@/types/database'
import {
  updateQuoteStatus,
  deleteQuote,
  linkQuoteToClient,
  createClientFromQuote,
  sendProposal,
} from '@/app/admin/quotes/actions'

export interface ClientOption {
  id: string
  name: string
  company: string | null
}

/**
 * <QuotesList /> — pipeline de configuracions rebudes.
 * Client component: filtres per estat, cerca i detall desplegable amb el
 * snapshot (selecció + càlcul). El canvi d'estat i l'esborrat criden les
 * Server Actions i refresquen la ruta.
 */

const STATUSES = QUOTE_STATUSES
type Status = QuoteStatus

/** Etiqueta d'un estat que ve de la BD (string) sense confiar-hi a cegues. */
const labelOf = (status: string) =>
  QUOTE_STATUS_META[status as QuoteStatus]?.label ?? status

/** Una proposta viva que ja ha passat la validesa. L'estat 'caducada' es posa
 *  a mà: això només és l'avís visual perquè no passi desapercebut. */
const isOverdue = (q: Quote) =>
  !!q.expires_at &&
  new Date(q.expires_at) < new Date() &&
  ['proposta', 'vista', 'negociacio'].includes(q.status)

const daysLeft = (iso: string) =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)

const PRODUCT_LABEL: Record<string, string> = {
  web: 'Web',
  landing: 'Landing',
  auditoria: 'Auditoria',
  collaboracio: 'Col·laboració',
}

const fmtEur = (n: number) => `${n.toLocaleString('ca-ES', { maximumFractionDigits: 0 })} €`
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' })

function amountOf(q: Quote): string {
  if (q.total_eur != null) return fmtEur(q.total_eur)
  if (q.rate_label) return q.rate_label
  return '—'
}

export default function QuotesList({
  quotes,
  clients,
}: {
  quotes: Quote[]
  clients: ClientOption[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [activeStatus, setActiveStatus] = useState<Status | 'all'>('all')
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const counts = useMemo(() => {
    const acc: Record<string, number> = { all: quotes.length }
    for (const s of STATUSES) acc[s] = 0
    for (const q of quotes) acc[q.status] = (acc[q.status] ?? 0) + 1
    return acc
  }, [quotes])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return quotes.filter((q) => {
      if (activeStatus !== 'all' && q.status !== activeStatus) return false
      if (!term) return true
      return (
        (q.email ?? '').toLowerCase().includes(term) ||
        (q.name ?? '').toLowerCase().includes(term) ||
        (PRODUCT_LABEL[q.product] ?? q.product).toLowerCase().includes(term)
      )
    })
  }, [quotes, activeStatus, query])

  /** Estat que espera motiu abans d'aplicar-se (declinada / perduda). */
  const [askReason, setAskReason] = useState<{ id: string; status: Status } | null>(null)

  const setStatus = (id: string, status: string) => {
    // declinada i perduda no s'apliquen fins que hi ha motiu: és el que
    // converteix un lead perdut en informació aprofitable.
    if (QUOTE_REASONS_BY_STATUS[status]) {
      setAskReason({ id, status: status as Status })
      return
    }
    setAskReason(null)
    startTransition(async () => {
      await updateQuoteStatus(id, status)
      router.refresh()
    })
  }

  const confirmReason = (id: string, status: Status, reason: QuoteOutcomeReason) =>
    startTransition(async () => {
      await updateQuoteStatus(id, status, reason)
      setAskReason(null)
      router.refresh()
    })

  const remove = (id: string) => {
    if (!confirm('Segur que vols esborrar aquesta configuració? No es pot desfer.')) return
    startTransition(async () => {
      await deleteQuote(id)
      router.refresh()
    })
  }

  const linkClient = (quoteId: string, clientId: string) =>
    startTransition(async () => {
      await linkQuoteToClient(quoteId, clientId || null)
      router.refresh()
    })

  const send = (q: Quote) => {
    if (!q.email) { alert('Aquesta configuració no porta email: no hi ha on enviar-la.'); return }
    const when = q.sent_at ? 'Ja s’ha enviat abans. Tornar a enviar el mateix enllaç?' : ''
    if (!confirm(`Enviar la proposta a ${q.email}?\n${when}`)) return
    startTransition(async () => {
      try {
        const res = await sendProposal(q.id)
        if (res && !res.mailed) alert(res.warning)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'No s\'ha pogut enviar la proposta.')
      }
      router.refresh()
    })
  }

  const createClient = (quoteId: string) =>
    startTransition(async () => {
      await createClientFromQuote(quoteId)
      router.refresh()
    })

  return (
    <div className={`flex flex-col gap-6 ${pending ? 'opacity-60' : ''}`}>
      {/* Filtres + cerca */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {(['all', ...STATUSES] as const).map((s) => {
            const active = activeStatus === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => setActiveStatus(s)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-body-xs-light md:text-body-s-light transition-colors ${
                  active
                    ? 'border-text-main bg-text-main text-text-main-inverse'
                    : 'border-border-default text-text-secondary hover:border-text-main'
                }`}
              >
                {s === 'all' ? 'Tots' : QUOTE_STATUS_META[s].label}
                <span className="tabular-nums opacity-70">{counts[s] ?? 0}</span>
              </button>
            )
          })}
        </div>
        <label className="relative">
          <MagnifyingGlass
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per email, nom o producte"
            className="w-full min-w-[240px] rounded-full border border-border-default bg-surface-card py-2 pl-9 pr-4 text-body-xs-light md:text-body-s-light text-text-main placeholder:text-text-secondary/60 focus:border-text-main focus:outline-none"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-card border border-border-subtle bg-surface-card p-8 text-center text-body-xs-light md:text-body-s-light text-text-secondary">
          Encara no hi ha configuracions{activeStatus !== 'all' ? ' amb aquest estat' : ''}.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border-subtle rounded-card border border-border-subtle bg-surface-card">
          {filtered.map((q) => {
            const open = expandedId === q.id
            return (
              <li key={q.id} className="flex flex-col">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4 md:p-5">
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : q.id)}
                    aria-expanded={open}
                    className="flex flex-1 items-center gap-4 text-left"
                  >
                    <CaretDown
                      size={16}
                      className={`shrink-0 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                    <span className="inline-flex shrink-0 rounded-full border border-border-subtle px-3 py-1 text-caption uppercase text-text-secondary">
                      {PRODUCT_LABEL[q.product] ?? q.product}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-body-s md:text-body-m lg:text-body-l text-text-main">{q.email ?? '—'}</span>
                      {q.name && <span className="truncate text-body-xs-light md:text-body-s-light text-text-secondary">{q.name}</span>}
                    </span>
                  </button>

                  <span className="text-body-s md:text-body-m lg:text-body-l text-text-main tabular-nums">{amountOf(q)}</span>
                  <span className="hidden flex-col items-end gap-1 md:flex">
                    <span className="text-body-xs-light md:text-body-s-light text-text-secondary tabular-nums">
                      {fmtDate(q.created_at)}
                    </span>
                    {q.outcome_reason && (
                      <span className="text-caption uppercase text-text-secondary">
                        {QUOTE_OUTCOME_REASON_LABELS[
                          q.outcome_reason as QuoteOutcomeReason
                        ] ?? q.outcome_reason}
                      </span>
                    )}
                    {isOverdue(q) ? (
                      <span className="text-caption uppercase text-error">Validesa vençuda</span>
                    ) : (
                      q.expires_at && (
                        <span className="text-caption uppercase text-text-secondary tabular-nums">
                          Caduca en {daysLeft(q.expires_at)} d
                        </span>
                      )
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={() => send(q)}
                    disabled={pending}
                    className="rounded-full border border-border-default px-3 py-1.5 text-body-xs-light md:text-body-s-light text-text-main transition-colors hover:border-text-main disabled:opacity-50"
                    title={q.sent_at ? 'Torna a enviar el mateix enllaç' : 'Envia la proposta i arrenca la validesa de 30 dies'}
                  >
                    {q.sent_at ? 'Reenvia' : 'Envia proposta'}
                  </button>

                  <select
                    value={q.status}
                    onChange={(e) => setStatus(q.id, e.target.value)}
                    disabled={pending}
                    aria-label="Estat"
                    className="rounded-full border border-border-default bg-surface-base px-3 py-1.5 text-body-xs-light md:text-body-s-light text-text-main focus:border-text-main focus:outline-none disabled:opacity-50"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {QUOTE_STATUS_META[s].label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => remove(q.id)}
                    disabled={pending}
                    aria-label="Esborra"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
                  >
                    <Trash size={16} />
                  </button>
                </div>

                {askReason?.id === q.id && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle bg-surface-base/60 px-4 py-3 md:px-6">
                    <span className="text-body-xs-light md:text-body-s-light text-text-secondary">
                      Per què? ({labelOf(askReason.status).toLowerCase()})
                    </span>
                    {(QUOTE_REASONS_BY_STATUS[askReason.status] ?? []).map((r) => (
                      <button
                        key={r}
                        type="button"
                        disabled={pending}
                        onClick={() => confirmReason(q.id, askReason.status, r)}
                        className="rounded-full border border-border-default px-3 py-1.5 text-body-xs-light md:text-body-s-light text-text-main transition-colors hover:border-text-main disabled:opacity-50"
                      >
                        {QUOTE_OUTCOME_REASON_LABELS[r]}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAskReason(null)}
                      className="ml-auto text-body-xs-light md:text-body-s-light text-text-secondary underline underline-offset-4 hover:text-text-main"
                    >
                      Cancel·la
                    </button>
                  </div>
                )}

                {open && (
                  <div className="flex flex-col gap-4 border-t border-border-subtle bg-surface-base/60 p-4 md:p-6">
                    {q.sent_at && (
                      <div className="flex flex-col gap-1">
                        <span className="text-label text-text-secondary">Enllaç del client</span>
                        <a
                          href={`/proposta/${q.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-body-xs-light md:text-body-s-light text-text-main underline underline-offset-4"
                        >
                          /proposta/{q.token}
                        </a>
                      </div>
                    )}
                    {q.summary && (
                      <div className="flex flex-col gap-1">
                        <span className="text-label text-text-secondary">Resum</span>
                        <pre className="whitespace-pre-wrap font-sans text-body-xs-light md:text-body-s-light text-text-main">
                          {q.summary}
                        </pre>
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <DetailBlock title="Selecció" value={q.selection} />
                      <DetailBlock title="Càlcul (snapshot)" value={q.pricing} />
                    </div>
                    <div className="flex flex-col gap-2 border-t border-border-subtle pt-4">
                      <span className="text-label text-text-secondary">Client (CRM)</span>
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={q.client_id ?? ''}
                          onChange={(e) => linkClient(q.id, e.target.value)}
                          disabled={pending}
                          aria-label="Client vinculat"
                          className="rounded-full border border-border-default bg-surface-base px-3 py-1.5 text-body-xs-light md:text-body-s-light text-text-main focus:border-text-main focus:outline-none disabled:opacity-50"
                        >
                          <option value="">— Sense client —</option>
                          {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                              {c.company ? ` · ${c.company}` : ''}
                            </option>
                          ))}
                        </select>
                        {!q.client_id && q.email && (
                          <button
                            type="button"
                            onClick={() => createClient(q.id)}
                            disabled={pending}
                            className="inline-flex items-center rounded-full border border-border-default px-3 py-1.5 text-body-xs-light md:text-body-s-light text-text-secondary transition-colors hover:border-text-main hover:text-text-main disabled:opacity-50"
                          >
                            Crea client des d&apos;aquesta quote
                          </button>
                        )}
                      </div>
                    </div>

                    <span className="text-caption text-text-secondary">
                      Model {q.pricing_version ?? '—'} · rebut {fmtDate(q.created_at)}
                    </span>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function DetailBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label text-text-secondary">{title}</span>
      <pre className="overflow-x-auto rounded-base border border-border-subtle bg-surface-card p-3 text-caption text-text-main">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  )
}
