"use client"

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlass, CaretDown, Trash } from '@phosphor-icons/react'
import type { Quote } from '@/types/database'
import {
  updateQuoteStatus,
  deleteQuote,
  linkQuoteToClient,
  createClientFromQuote,
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

const STATUSES = ['nou', 'revisat', 'proposta', 'guanyat', 'perdut'] as const
type Status = (typeof STATUSES)[number]
const STATUS_LABEL: Record<Status, string> = {
  nou: 'Nou',
  revisat: 'Revisat',
  proposta: 'Proposta',
  guanyat: 'Guanyat',
  perdut: 'Perdut',
}

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

  const setStatus = (id: string, status: string) =>
    startTransition(async () => {
      await updateQuoteStatus(id, status)
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
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-body-sm transition-colors ${
                  active
                    ? 'border-text-main bg-text-main text-text-main-inverse'
                    : 'border-surface-border text-text-secondary hover:border-text-main'
                }`}
              >
                {s === 'all' ? 'Tots' : STATUS_LABEL[s]}
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
            className="w-full min-w-[240px] rounded-full border border-surface-border bg-surface-card py-2 pl-9 pr-4 text-body-sm text-text-main placeholder:text-text-secondary/60 focus:border-text-main focus:outline-none"
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-card border border-surface-border bg-surface-card p-8 text-center text-body-sm text-text-secondary">
          Encara no hi ha configuracions{activeStatus !== 'all' ? ' amb aquest estat' : ''}.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-surface-border rounded-card border border-surface-border bg-surface-card">
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
                      className={`shrink-0 text-text-secondary transition-transform ${open ? '' : '-rotate-90'}`}
                      aria-hidden
                    />
                    <span className="inline-flex shrink-0 rounded-full border border-surface-border px-3 py-1 text-caption uppercase text-text-secondary">
                      {PRODUCT_LABEL[q.product] ?? q.product}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-body-md text-text-main">{q.email ?? '—'}</span>
                      {q.name && <span className="truncate text-body-sm text-text-secondary">{q.name}</span>}
                    </span>
                  </button>

                  <span className="text-body-md text-text-main tabular-nums">{amountOf(q)}</span>
                  <span className="hidden text-body-sm text-text-secondary tabular-nums md:block">
                    {fmtDate(q.created_at)}
                  </span>

                  <select
                    value={q.status}
                    onChange={(e) => setStatus(q.id, e.target.value)}
                    disabled={pending}
                    aria-label="Estat"
                    className="rounded-full border border-surface-border bg-surface-base px-3 py-1.5 text-body-sm text-text-main focus:border-text-main focus:outline-none disabled:opacity-50"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
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

                {open && (
                  <div className="flex flex-col gap-4 border-t border-surface-border bg-surface-base/60 p-4 md:p-6">
                    {q.summary && (
                      <div className="flex flex-col gap-1">
                        <span className="text-label text-text-secondary">Resum</span>
                        <pre className="whitespace-pre-wrap font-sans text-body-sm text-text-main">
                          {q.summary}
                        </pre>
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <DetailBlock title="Selecció" value={q.selection} />
                      <DetailBlock title="Càlcul (snapshot)" value={q.pricing} />
                    </div>
                    <div className="flex flex-col gap-2 border-t border-surface-border pt-4">
                      <span className="text-label text-text-secondary">Client (CRM)</span>
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={q.client_id ?? ''}
                          onChange={(e) => linkClient(q.id, e.target.value)}
                          disabled={pending}
                          aria-label="Client vinculat"
                          className="rounded-full border border-surface-border bg-surface-base px-3 py-1.5 text-body-sm text-text-main focus:border-text-main focus:outline-none disabled:opacity-50"
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
                            className="inline-flex items-center rounded-full border border-surface-border px-3 py-1.5 text-body-sm text-text-secondary transition-colors hover:border-text-main hover:text-text-main disabled:opacity-50"
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
      <pre className="overflow-x-auto rounded-base border border-surface-border bg-surface-card p-3 text-caption text-text-main">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  )
}
