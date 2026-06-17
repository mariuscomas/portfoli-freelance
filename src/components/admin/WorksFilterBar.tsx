"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { CaretDown, Check, MagnifyingGlass, X } from '@phosphor-icons/react'
import type { WorkRole, WorkCategory, Translatable } from '@/types/database'

/**
 * <WorksFilterBar />
 *
 * Barra de filtres per al llistat /admin/works. Té dos blocs visuals:
 *  1. Search input — cerca per títol (locale CA). Debounced 300ms.
 *  2. 4 chips dropdown — Client · Rol · Categoria · Any.
 *
 * Tot l'estat viu a la URL via `?q=...&role=...` perquè:
 *  - Pots compartir un enllaç filtrat amb tu mateix o un client
 *  - El botó "Enrere" del navegador funciona com s'espera
 *  - Recarregant la pàgina mantens els filtres aplicats
 *
 * La pàgina server llegeix els searchParams i aplica filtres a la query
 * de Supabase. Aquest component només toca la URL — no fa fetch.
 */

interface ClientOpt {
  id: string
  name: string
  company: string | null
}

interface Props {
  /** Llista de clients per al filtre. */
  clients: ClientOpt[]
  /** Rols disponibles per al filtre. */
  roles: WorkRole[]
  /** Categories disponibles per al filtre. */
  categories: WorkCategory[]
  /** Anys únics presents als works actuals (per al filtre d'any). */
  years: string[]
}

/** Treu el valor localitzat (fallback CA) d'un Translatable. */
function loc(t: Translatable | null | undefined): string {
  if (!t) return ''
  return t.ca?.trim() || t.en?.trim() || t.es?.trim() || ''
}

export default function WorksFilterBar({ clients, roles, categories, years }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Llegim valors actuals de la URL — són la font de veritat
  const currentQ = searchParams.get('q') ?? ''
  const currentClient = searchParams.get('client') ?? ''
  const currentRole = searchParams.get('role') ?? ''
  const currentCategory = searchParams.get('category') ?? ''
  const currentYear = searchParams.get('year') ?? ''

  // Local search input amb debounce — escrivim a URL només 300ms després
  // de l'última pulsació per no spammejar el router.
  const [searchValue, setSearchValue] = useState(currentQ)
  useEffect(() => {
    setSearchValue(currentQ)
  }, [currentQ])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParam('q', value || null)
    }, 300)
  }

  /**
   * Actualitza un searchParam i navega. Si el valor és null o cadena buida,
   * eliminem el paràmetre de la URL — així queda neta sense `?q=&role=`.
   */
  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams.toString())
    if (value && value.trim()) {
      next.set(key, value.trim())
    } else {
      next.delete(key)
    }
    const queryString = next.toString()
    startTransition(() => {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      })
    })
  }

  const clearAll = () => {
    setSearchValue('')
    startTransition(() => {
      router.replace(pathname, { scroll: false })
    })
  }

  /** Hi ha algun filtre actiu? Útil per mostrar el botó "Esborrar filtres". */
  const hasActive = useMemo(
    () =>
      Boolean(currentQ || currentClient || currentRole || currentCategory || currentYear),
    [currentQ, currentClient, currentRole, currentCategory, currentYear]
  )

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Search input */}
      <div className="relative flex-1 min-w-[240px] max-w-md">
        <MagnifyingGlass
          size={16}
          weight="regular"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
        />
        <input
          type="search"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Cerca treballs…"
          aria-label="Cerca treballs"
          className="w-full bg-surface-card border border-surface-border rounded-full pl-9 pr-3 py-2 text-body-sm text-text-main placeholder:text-text-secondary/60 transition-colors hover:border-text-secondary/60 focus:outline-none focus:border-text-main focus:ring-2 focus:ring-text-main/20"
        />
      </div>

      {/* Chip dropdowns */}
      <FilterChip
        label="Client"
        value={currentClient}
        options={clients.map((c) => ({
          id: c.id,
          label: c.company || c.name,
        }))}
        onChange={(v) => updateParam('client', v)}
      />
      <FilterChip
        label="Rol"
        value={currentRole}
        options={roles.map((r) => ({
          id: r.id,
          label: loc(r.name as Translatable),
          color: r.color,
        }))}
        onChange={(v) => updateParam('role', v)}
      />
      <FilterChip
        label="Categoria"
        value={currentCategory}
        options={categories.map((c) => ({
          id: c.id,
          label: loc(c.name as Translatable),
          color: c.color,
        }))}
        onChange={(v) => updateParam('category', v)}
      />
      <FilterChip
        label="Any"
        value={currentYear}
        options={years.map((y) => ({ id: y, label: y }))}
        onChange={(v) => updateParam('year', v)}
      />

      {/* Botó "Esborrar filtres" només si n'hi ha algun d'actiu */}
      {hasActive && (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-body-sm text-text-secondary hover:text-text-main transition-colors"
          title="Esborra tots els filtres"
        >
          <X size={14} weight="regular" />
          Esborrar filtres
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  FilterChip — chip dropdown amb popover de single-select             */
/* ------------------------------------------------------------------ */

interface ChipOption {
  id: string
  label: string
  color?: string | null
}

function FilterChip({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: ChipOption[]
  onChange: (v: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const selected = useMemo(() => options.find((o) => o.id === value), [options, value])
  const active = Boolean(value)

  // Click outside per tancar
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        !triggerRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Escape per tancar
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  // Si no hi ha cap opció disponible, no renderitzem el chip — no té sentit
  // mostrar un filtre buit.
  if (options.length === 0) return null

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-body-sm border transition-colors ${
          active
            ? 'border-text-main bg-text-main text-text-main-inverse'
            : 'border-surface-border bg-surface-card text-text-main hover:border-text-secondary/60'
        }`}
      >
        <span className="opacity-80">{label}</span>
        {selected ? (
          <>
            <span aria-hidden>·</span>
            {selected.color && (
              <span
                aria-hidden
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: selected.color }}
              />
            )}
            <span className="truncate max-w-[160px]">{selected.label}</span>
          </>
        ) : (
          <CaretDown size={12} weight="regular" />
        )}
        {active && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            aria-label={`Esborrar filtre ${label}`}
            className="ml-1 -mr-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={10} weight="bold" />
          </button>
        )}
      </button>

      {open && (
        <div
          ref={popoverRef}
          role="listbox"
          aria-label={label}
          className="absolute z-30 mt-1.5 min-w-[200px] max-w-[280px] flex flex-col rounded-md border border-surface-border bg-surface-card shadow-lg overflow-hidden"
        >
          <ul className="max-h-72 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = opt.id === value
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.id)
                      setOpen(false)
                    }}
                    role="option"
                    aria-selected={isSelected}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-body-sm transition-colors hover:bg-surface-base ${
                      isSelected ? 'bg-surface-base' : ''
                    }`}
                  >
                    {opt.color !== undefined && (
                      <span
                        aria-hidden
                        className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
                          opt.color ? '' : 'border border-text-secondary/40'
                        }`}
                        style={opt.color ? { backgroundColor: opt.color } : undefined}
                      />
                    )}
                    <span className="truncate flex-1 text-left text-text-main">
                      {opt.label || '(sense nom)'}
                    </span>
                    {isSelected && (
                      <Check size={12} weight="bold" className="text-text-main shrink-0" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
