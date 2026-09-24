"use client"

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CaretDown, MagnifyingGlass } from '@phosphor-icons/react'
import {
  CONTACT_FILTERS,
  CONTACT_FILTER_LABEL,
  CONTACT_STATUS_LABEL,
  cleanMessage,
  type ContactFilter,
  type ContactStatus,
} from '@/lib/leads'
import {
  createClientFromContact,
  setContactSpam,
  updateContactStatus,
} from '@/app/admin/leads/actions'
import type { Tables } from '@/types/database'

type Message = Tables<'contact_submissions'>
type Subscriber = Tables<'newsletter_subscribers'>

/**
 * <LeadsList /> — bústia de /admin/leads.
 *
 * Dues pestanyes perquè són dues feines diferents: contestar missatges i
 * tenir a mà qui s'ha subscrit. El detall s'obre inline, com a /admin/quotes,
 * per no perdre el context de la llista mentre en despatxes uns quants.
 */

const dateFmt = new Intl.DateTimeFormat('ca-ES', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export default function LeadsList({
  messages,
  subscribers,
}: {
  messages: Message[]
  subscribers: Subscriber[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [tab, setTab] = useState<'missatges' | 'newsletter'>('missatges')
  const [filter, setFilter] = useState<ContactFilter>('tots')
  const [query, setQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = { tots: 0, new: 0, replied: 0, archived: 0, spam: 0 }
    for (const m of messages) {
      if (m.is_spam) { c.spam++; continue }
      c.tots++
      c[m.status] = (c[m.status] ?? 0) + 1
    }
    return c
  }, [messages])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return messages.filter((m) => {
      if (filter === 'spam' ? !m.is_spam : m.is_spam) return false
      if (filter !== 'tots' && filter !== 'spam' && m.status !== filter) return false
      if (!q) return true
      return [m.name, m.email, m.message].some((v) => v?.toLowerCase().includes(q))
    })
  }, [messages, filter, query])

  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      setError(null)
      try {
        await fn()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ha fallat l’operació.')
      }
    })

  return (
    <div className={`flex flex-col gap-6 ${pending ? 'opacity-60' : ''}`}>
      {/* ====== Pestanyes ====== */}
      <div className="inline-flex w-fit gap-1 rounded-card border border-border-subtle bg-surface-card p-1">
        {([
          ['missatges', 'Missatges', messages.filter((m) => !m.is_spam).length],
          ['newsletter', 'Newsletter', subscribers.length],
        ] as const).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-current={tab === key}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-body-xs-light md:text-body-s-light transition-colors ${
              tab === key
                ? 'bg-text-main text-text-main-inverse'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            {label}
            <span className="tabular-nums opacity-70">{count}</span>
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-card border border-error/40 bg-error/5 p-4 text-body-xs-light md:text-body-s-light text-error">
          {error}
        </p>
      )}

      {tab === 'missatges' ? (
        <>
          {/* ====== Filtres + cerca ====== */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {CONTACT_FILTERS.map((f) => {
                const active = filter === f
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-body-xs-light md:text-body-s-light transition-colors ${
                      active
                        ? 'border-text-main bg-text-main text-text-main-inverse'
                        : 'border-border-default text-text-secondary hover:border-text-main'
                    }`}
                  >
                    {CONTACT_FILTER_LABEL[f]}
                    <span className="tabular-nums opacity-70">{counts[f] ?? 0}</span>
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
                placeholder="Cerca per nom, correu o text"
                className="w-full min-w-[240px] rounded-full border border-border-default bg-surface-card py-2 pl-9 pr-4 text-body-xs-light md:text-body-s-light text-text-main placeholder:text-text-secondary/60 focus:border-text-main focus:outline-none"
              />
            </label>
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-card border border-border-subtle bg-surface-card p-8 text-center text-body-xs-light md:text-body-s-light text-text-secondary">
              {messages.length === 0
                ? 'Encara no ha escrit ningú.'
                : 'Cap missatge amb aquest filtre.'}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border-subtle rounded-card border border-border-subtle bg-surface-card">
              {filtered.map((m) => {
                const open = expandedId === m.id
                const status = m.status as ContactStatus
                return (
                  <li key={m.id} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => setExpandedId(open ? null : m.id)}
                      aria-expanded={open}
                      className="flex items-center gap-4 p-4 text-left md:p-5"
                    >
                      <CaretDown
                        size={16}
                        className={`shrink-0 text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                      <span
                        className={`inline-flex shrink-0 rounded-md px-2.5 py-1 text-caption uppercase ${
                          m.is_spam
                            ? 'bg-warning-surface text-warning'
                            : status === 'new'
                              ? 'bg-accent text-text-main'
                              : 'border border-border-subtle text-text-secondary'
                        }`}
                      >
                        {m.is_spam ? 'Spam' : CONTACT_STATUS_LABEL[status] ?? status}
                      </span>
                      <span className="flex min-w-0 shrink-0 flex-col md:w-56">
                        <span className="truncate text-body-s md:text-body-m lg:text-body-l text-text-main">{m.name || '—'}</span>
                        <span className="truncate text-body-xs-light md:text-body-s-light text-text-secondary">{m.email}</span>
                      </span>
                      <span className="hidden min-w-0 flex-1 truncate text-body-xs-light md:text-body-s-light text-text-secondary md:block">
                        {cleanMessage(m.message)}
                      </span>
                      <span className="ml-auto shrink-0 text-caption text-text-secondary">
                        {dateFmt.format(new Date(m.created_at))}
                      </span>
                    </button>

                    {open && (
                      <div className="flex flex-col gap-5 border-t border-border-subtle bg-surface-base p-4 md:p-5">
                        <div className="rounded-card bg-surface-card p-4">
                          <p className="whitespace-pre-wrap text-body-s md:text-body-m lg:text-body-l text-text-main">
                            {cleanMessage(m.message)}
                          </p>
                          <p className="mt-3 text-caption text-text-secondary">
                            {[m.source, m.user_agent].filter(Boolean).join(' · ')}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={`mailto:${m.email}?subject=${encodeURIComponent('Re: el teu missatge')}`}
                            className="inline-flex items-center rounded-full bg-text-main px-4 py-2 text-body-xs-light md:text-body-s-light text-text-main-inverse"
                          >
                            Respon per correu
                          </a>
                          {status !== 'replied' && (
                            <button
                              type="button"
                              onClick={() => run(() => updateContactStatus(m.id, 'replied'))}
                              className="inline-flex items-center rounded-full border border-border-default px-4 py-2 text-body-xs-light md:text-body-s-light text-text-main hover:border-text-main"
                            >
                              Marca com a respost
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => run(() => createClientFromContact(m.id))}
                            className="inline-flex items-center rounded-full border border-border-default px-4 py-2 text-body-xs-light md:text-body-s-light text-text-main hover:border-text-main"
                          >
                            Crea fitxa de client
                          </button>
                          {status !== 'archived' && (
                            <button
                              type="button"
                              onClick={() => run(() => updateContactStatus(m.id, 'archived'))}
                              className="inline-flex items-center px-3 py-2 text-body-xs-light md:text-body-s-light text-text-secondary hover:text-text-main"
                            >
                              Arxiva
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => run(() => setContactSpam(m.id, !m.is_spam))}
                            className="inline-flex items-center px-3 py-2 text-body-xs-light md:text-body-s-light text-text-secondary hover:text-text-main"
                          >
                            {m.is_spam ? 'No és spam' : 'Marca com a spam'}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </>
      ) : subscribers.length === 0 ? (
        <p className="rounded-card border border-border-subtle bg-surface-card p-8 text-center text-body-xs-light md:text-body-s-light text-text-secondary">
          Encara no hi ha subscriptors.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border-subtle rounded-card border border-border-subtle bg-surface-card">
          {subscribers.map((s) => (
            <li key={s.id} className="flex items-center gap-4 p-4 md:p-5">
              <span className="min-w-0 flex-1 truncate text-body-s md:text-body-m lg:text-body-l text-text-main">{s.email}</span>
              <span className="shrink-0 text-caption text-text-secondary">{s.source}</span>
              <span className="shrink-0 text-caption text-text-secondary">
                {dateFmt.format(new Date(s.created_at))}
              </span>
              {s.unsubscribed_at && (
                <span className="shrink-0 rounded-md border border-border-subtle px-2.5 py-1 text-caption text-text-secondary">
                  Baixa
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
