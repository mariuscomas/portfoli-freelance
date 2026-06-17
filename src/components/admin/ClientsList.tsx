"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  MagnifyingGlass,
  Buildings,
  EnvelopeSimple,
  Phone,
  CaretUp,
  CaretDown,
  Briefcase,
  ClockCounterClockwise,
} from '@phosphor-icons/react'
import ClientStatusBadge from './ClientStatusBadge'
import {
  CLIENT_STATUSES,
  CLIENT_STATUS_META,
  type Client,
  type ClientStatus,
} from '@/types/database'

/**
 * <ClientsList />
 *
 * Llistat dels clients en format taula amb:
 *   - Filtres per estat (chips amb comptador).
 *   - Cerca instantània (nom, empresa, email).
 *   - Ordenació per columnes (nom, empresa, estat, projectes, última edició).
 *   - Comptador de projectes vinculats per client.
 *
 * És un client component perquè filtres/cerca/ordenació són purament
 * client-side (la llista completa és petita, < ~200 clients esperats).
 *
 * Si el llistat creix molt podriem migrar la cerca a server search params,
 * però per la mida d'un portfoli personal aquest patró és més responsiu.
 */

export interface ClientRow extends Client {
  /** Nombre de works vinculats — el calculem al server abans de passar la prop. */
  works_count: number
}

type SortKey = 'name' | 'company' | 'status' | 'works_count' | 'updated_at'
type SortDir = 'asc' | 'desc'

const STATUS_ORDER: Record<ClientStatus, number> = {
  new: 0,
  contacted: 1,
  proposal: 2,
  client: 3,
  lost: 4,
}

export default function ClientsList({ clients }: { clients: ClientRow[] }) {
  const [activeStatus, setActiveStatus] = useState<ClientStatus | 'all'>('all')
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('updated_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Comptadors per estat — visibles als chips de filtre.
  const counts = useMemo(() => {
    const acc: Record<ClientStatus | 'all', number> = {
      all: clients.length,
      new: 0,
      contacted: 0,
      proposal: 0,
      client: 0,
      lost: 0,
    }
    for (const c of clients) {
      const s = c.status as ClientStatus
      if (s in acc) acc[s] += 1
    }
    return acc
  }, [clients])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clients
      .filter((c) => activeStatus === 'all' || c.status === activeStatus)
      .filter((c) => {
        if (!q) return true
        return (
          c.name.toLowerCase().includes(q) ||
          (c.company ?? '').toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1
        switch (sortKey) {
          case 'name':
            return a.name.localeCompare(b.name) * dir
          case 'company':
            return (a.company ?? '').localeCompare(b.company ?? '') * dir
          case 'status':
            return (
              (STATUS_ORDER[a.status as ClientStatus] -
                STATUS_ORDER[b.status as ClientStatus]) *
              dir
            )
          case 'works_count':
            return (a.works_count - b.works_count) * dir
          case 'updated_at':
          default:
            return (
              (new Date(a.updated_at).getTime() -
                new Date(b.updated_at).getTime()) *
              dir
            )
        }
      })
  }, [clients, activeStatus, query, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      // Per a estats i comptadors té més sentit desc per defecte (top primer).
      setSortDir(key === 'name' || key === 'company' ? 'asc' : 'desc')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ====== Filtres per estat + cerca ====== */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        {/* Chips d'estat */}
        <div className="flex items-center gap-2 flex-wrap">
          <FilterChip
            label="Tots"
            count={counts.all}
            active={activeStatus === 'all'}
            onClick={() => setActiveStatus('all')}
          />
          {CLIENT_STATUSES.map((s) => (
            <FilterChip
              key={s}
              label={CLIENT_STATUS_META[s].label}
              count={counts[s]}
              active={activeStatus === s}
              onClick={() => setActiveStatus(s)}
            />
          ))}
        </div>

        {/* Cerca a la dreta */}
        <div className="md:ml-auto relative">
          <MagnifyingGlass
            size={16}
            weight="regular"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca nom, empresa o email…"
            className="pl-9 pr-3 py-2 w-full md:w-72 bg-transparent border border-surface-border rounded-md text-body-sm text-text-main placeholder:text-text-secondary/60 focus:outline-none focus:border-text-main"
            aria-label="Cerca clients"
          />
        </div>
      </div>

      {/* ====== Estat buit ====== */}
      {filtered.length === 0 && (
        <div className="py-12 text-center text-body-sm text-text-secondary border border-dashed border-surface-border rounded-md">
          {query || activeStatus !== 'all'
            ? 'No hi ha cap client que coincideixi amb els filtres actuals.'
            : 'Encara no tens cap client a la base de dades.'}
        </div>
      )}

      {/* ====== Taula ====== */}
      {filtered.length > 0 && (
        <div className="overflow-x-auto border border-surface-border rounded-md">
          <table className="w-full text-body-sm">
            <thead className="bg-surface-card text-text-secondary">
              <tr>
                <SortableHeader
                  label="Nom · Empresa"
                  sortKey="name"
                  current={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                  className="text-left pl-4"
                />
                <th className="text-left px-3 py-2.5 font-medium uppercase tracking-wider text-body-xs">
                  Contacte
                </th>
                <SortableHeader
                  label="Estat"
                  sortKey="status"
                  current={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <th className="text-left px-3 py-2.5 font-medium uppercase tracking-wider text-body-xs">
                  Origen
                </th>
                <SortableHeader
                  label="Projectes"
                  sortKey="works_count"
                  current={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Actualitzat"
                  sortKey="updated_at"
                  current={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                  className="pr-4"
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtered.map((c) => (
                <ClientRow key={c.id} client={c} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Subcomponents                                                       */
/* ------------------------------------------------------------------ */

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-body-sm transition-colors border ${
        active
          ? 'bg-text-main text-text-main-inverse border-text-main'
          : 'bg-surface-card text-text-secondary border-surface-border hover:text-text-main hover:border-text-main/40'
      }`}
    >
      {label}
      <span
        className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-body-xs rounded-full ${
          active
            ? 'bg-text-main-inverse/15 text-text-main-inverse'
            : 'bg-surface-base text-text-secondary'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

function SortableHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
  className?: string
}) {
  const isActive = current === sortKey
  return (
    <th className={`text-left px-3 py-2.5 ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 font-medium uppercase tracking-wider text-body-xs transition-colors ${
          isActive ? 'text-text-main' : 'text-text-secondary hover:text-text-main'
        }`}
      >
        {label}
        {isActive ? (
          dir === 'asc' ? (
            <CaretUp size={10} weight="bold" />
          ) : (
            <CaretDown size={10} weight="bold" />
          )
        ) : (
          <span className="w-2.5" aria-hidden />
        )}
      </button>
    </th>
  )
}

function ClientRow({ client: c }: { client: ClientRow }) {
  const updated = relativeTime(c.updated_at)
  return (
    <tr className="group hover:bg-surface-card transition-colors">
      {/* Nom + empresa */}
      <td className="pl-4 pr-3 py-3 align-top">
        <Link
          href={`/admin/clients/${c.id}`}
          className="flex flex-col group/link"
        >
          <span className="font-medium text-text-main group-hover/link:text-accent transition-colors">
            {c.name}
          </span>
          {c.company && (
            <span className="inline-flex items-center gap-1 text-text-secondary text-body-xs mt-0.5">
              <Buildings size={11} weight="regular" />
              {c.company}
            </span>
          )}
        </Link>
      </td>

      {/* Contacte (email + phone) */}
      <td className="px-3 py-3 align-top text-text-secondary">
        <div className="flex flex-col gap-1">
          {c.email && (
            <a
              href={`mailto:${c.email}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 hover:text-text-main transition-colors text-body-xs truncate max-w-[200px]"
              title={c.email}
            >
              <EnvelopeSimple size={11} weight="regular" />
              {c.email}
            </a>
          )}
          {c.phone && (
            <a
              href={`tel:${c.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 hover:text-text-main transition-colors text-body-xs"
            >
              <Phone size={11} weight="regular" />
              {c.phone}
            </a>
          )}
          {!c.email && !c.phone && (
            <span className="text-body-xs text-text-secondary/50">—</span>
          )}
        </div>
      </td>

      {/* Estat */}
      <td className="px-3 py-3 align-top">
        <ClientStatusBadge status={c.status as ClientStatus} size="sm" />
      </td>

      {/* Origen */}
      <td className="px-3 py-3 align-top text-text-secondary text-body-xs">
        {c.source ? (
          c.source
        ) : (
          <span className="text-text-secondary/50">—</span>
        )}
      </td>

      {/* Projectes */}
      <td className="px-3 py-3 align-top">
        {c.works_count > 0 ? (
          <span className="inline-flex items-center gap-1.5 text-text-main text-body-xs">
            <Briefcase size={11} weight="regular" />
            {c.works_count}
          </span>
        ) : (
          <span className="text-text-secondary/50 text-body-xs">—</span>
        )}
      </td>

      {/* Actualitzat */}
      <td className="px-3 pr-4 py-3 align-top text-text-secondary text-body-xs whitespace-nowrap">
        <span className="inline-flex items-center gap-1">
          <ClockCounterClockwise size={11} weight="regular" />
          {updated}
        </span>
      </td>
    </tr>
  )
}

/**
 * Formatador relatiu lleuger ("fa 3 dies", "fa 2 h", "ara mateix").
 * Duplica intencionalment la lògica de lib/work-summary.ts perquè
 * aquí no la cal importar amb tot el seu pes; només necessitem un
 * format breu.
 */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.round(diff / 1000)
  if (sec < 60) return 'ara mateix'
  const min = Math.round(sec / 60)
  if (min < 60) return `fa ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `fa ${h} h`
  const d = Math.round(h / 24)
  if (d < 30) return `fa ${d} d`
  const m = Math.round(d / 30)
  if (m < 12) return `fa ${m} mes${m > 1 ? 'os' : ''}`
  const y = Math.round(m / 12)
  return `fa ${y} any${y > 1 ? 's' : ''}`
}
