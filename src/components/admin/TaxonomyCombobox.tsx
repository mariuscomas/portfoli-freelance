"use client"

import { useEffect, useId, useMemo, useRef, useState, useTransition } from 'react'
import { CaretDown, Plus, PencilSimple, Trash, Check, X, Palette } from '@phosphor-icons/react'
import type { Translatable } from '@/types/database'

/**
 * <TaxonomyCombobox />
 *
 * Combobox d'estil Linear/Notion per a taxonomies petites (rols,
 * categories, labels). Reutilitzable per a qualsevol entitat que tingui
 * `id, name (i18n), color`.
 *
 * Capacitats:
 *  1. Cerca incremental — filtra la llista pel `name` localitzat.
 *  2. Selecció — clic a una opció emet `onChange(id)` i tanca el popover.
 *  3. Creació inline — si la cerca no troba cap match, apareix una fila
 *     "+ Crear «{el que has escrit}»" al final. Click → crida `onCreate`
 *     amb el text introduït i selecciona el resultat.
 *  4. Edició inline — cada opció té un `kebab` que permet renombrar,
 *     canviar color i esborrar sense sortir del combobox.
 *
 * El component és **uncontrolled** respecte al FormData: renderitza un
 * `<input type="hidden" name={name} value={selectedId} />` perquè el
 * server action llegeixi l'ID directament. El consumidor només passa el
 * valor inicial.
 *
 * Decisions:
 *  - L'estat de les opcions (llista) és controlat externament — el pare
 *    decideix com obtenir-les (server-side al WorkForm). Així el component
 *    no fa fetches per ell mateix i es manté server-friendly.
 *  - Les mutacions (create/update/delete) deleguen a callbacks que el pare
 *    connecta amb les server actions. El TaxonomyCombobox només optimitza
 *    la UI; el pare se n'encarrega de refrescar la llista.
 */

/** Una opció del combobox — el mínim que necessita el component. */
export interface TaxonomyOption {
  id: string
  name: Translatable
  color: string | null
}

/** Paleta predefinida per als swatches de colors. Cobreix els casos típics. */
const COLOR_PALETTE: { value: string; label: string }[] = [
  { value: '#1a1a1a', label: 'Neutre' },
  { value: '#5c7894', label: 'Blau' },
  { value: '#6385a2', label: 'Cel' },
  { value: '#15803d', label: 'Verd' },
  { value: '#b45309', label: 'Ambre' },
  { value: '#dc2626', label: 'Vermell' },
  { value: '#9333ea', label: 'Violeta' },
  { value: '#db2777', label: 'Rosa' },
]

interface Props {
  /** Label visible a sobre del combobox. */
  label: string
  /** Marca el camp com a obligatori (visual). La validació és al server. */
  required?: boolean
  /** Nom del hidden input que enviarà l'ID al FormData. */
  name: string
  /** Locale actiu per mostrar el nom de l'opció. */
  locale: 'ca' | 'en' | 'es'
  /** Llista d'opcions disponibles (passada pel pare). */
  options: TaxonomyOption[]
  /** ID inicialment seleccionat (null o '' → cap selecció). */
  defaultValue?: string | null
  /** Placeholder del trigger quan no hi ha cap opció seleccionada. */
  placeholder?: string
  /** Hint sota el camp. */
  hint?: string

  /* Callbacks delegats al pare per persistir als actions */
  onCreate: (name: string, color: string | null) => Promise<TaxonomyOption>
  onUpdate: (
    id: string,
    patch: { name_ca?: string; color?: string | null }
  ) => Promise<TaxonomyOption>
  onDelete: (id: string) => Promise<void>
}

export default function TaxonomyCombobox({
  label,
  required,
  name,
  locale,
  options,
  defaultValue,
  placeholder = 'Selecciona…',
  hint,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [selectedId, setSelectedId] = useState<string>(defaultValue || '')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  /** ID de l'opció en mode edició inline (renaming). NULL si cap. */
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  /** Mostra la paleta de colors per a una opció concreta. */
  const [colorPickingId, setColorPickingId] = useState<string | null>(null)

  const [, startTransition] = useTransition()

  // Sincronitza si canvia defaultValue (després de submit del form)
  useEffect(() => {
    if (defaultValue !== undefined) setSelectedId(defaultValue || '')
  }, [defaultValue])

  // Focus a l'input de cerca quan obrim el popover
  useEffect(() => {
    if (open) {
      // Un microtic per esperar que el popover estigui muntat
      setTimeout(() => searchInputRef.current?.focus(), 0)
    } else {
      // Net els estats secundaris quan tanquem
      setQuery('')
      setEditingId(null)
      setColorPickingId(null)
    }
  }, [open])

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
        // Si estem editant, primer cancel·lem l'edició; sinó tanquem.
        if (editingId) {
          setEditingId(null)
        } else if (colorPickingId) {
          setColorPickingId(null)
        } else {
          setOpen(false)
          triggerRef.current?.focus()
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, editingId, colorPickingId])

  /** Nom localitzat d'una opció — agafa el locale actiu o fallback al CA. */
  const labelOf = (opt: TaxonomyOption): string => {
    return opt.name[locale]?.trim() || opt.name.ca?.trim() || '(sense nom)'
  }

  const selected = useMemo(
    () => options.find((o) => o.id === selectedId) || null,
    [options, selectedId]
  )

  /** Filtra la llista pel query case-insensitive. Si no hi ha query, mostra tot. */
  const filtered = useMemo(() => {
    if (!query.trim()) return options
    const q = query.trim().toLowerCase()
    return options.filter((o) => labelOf(o).toLowerCase().includes(q))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, query, locale])

  /**
   * Mostra l'opció "+ Crear «query»" només quan:
   *  - Hi ha query no-buit
   *  - El query no coincideix exactament amb cap opció existent
   */
  const canCreate = useMemo(() => {
    const q = query.trim()
    if (!q) return false
    return !options.some((o) => labelOf(o).toLowerCase() === q.toLowerCase())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, query, locale])

  const handleSelect = (optId: string) => {
    setSelectedId(optId)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const handleClear = () => {
    setSelectedId('')
    setOpen(false)
    triggerRef.current?.focus()
  }

  const handleCreate = async () => {
    const name = query.trim()
    if (!name) return
    try {
      const created = await onCreate(name, null)
      setSelectedId(created.id)
      setQuery('')
      setOpen(false)
    } catch (err) {
      // L'error es propaga al pare via revalidatePath; aquí només
      // mantenim el popover obert perquè l'usuari pugui reintentar.
      console.error('[TaxonomyCombobox] createWorkRole failed', err)
    }
  }

  const startEdit = (opt: TaxonomyOption) => {
    setEditingId(opt.id)
    setEditValue(labelOf(opt))
    setColorPickingId(null)
  }

  const commitEdit = async () => {
    if (!editingId) return
    const v = editValue.trim()
    if (!v) {
      setEditingId(null)
      return
    }
    try {
      await onUpdate(editingId, { name_ca: v })
    } catch (err) {
      console.error('[TaxonomyCombobox] update failed', err)
    } finally {
      setEditingId(null)
    }
  }

  const handleDelete = (opt: TaxonomyOption) => {
    if (typeof window !== 'undefined') {
      const ok = window.confirm(
        `Vols eliminar «${labelOf(opt)}»? Els works que el feien servir quedaran sense aquest valor.`
      )
      if (!ok) return
    }
    startTransition(async () => {
      try {
        await onDelete(opt.id)
        if (selectedId === opt.id) setSelectedId('')
      } catch (err) {
        console.error('[TaxonomyCombobox] delete failed', err)
      }
    })
  }

  const handlePickColor = async (opt: TaxonomyOption, color: string | null) => {
    try {
      await onUpdate(opt.id, { color })
    } catch (err) {
      console.error('[TaxonomyCombobox] color update failed', err)
    } finally {
      setColorPickingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={`${id}-trigger`}
        className="inline-flex items-center gap-1 text-body-sm font-medium text-text-secondary"
      >
        {label}
        {required && <span className="text-error">*</span>}
      </label>

      {/* Hidden input per FormData */}
      <input type="hidden" name={name} value={selectedId} readOnly />

      <div className="relative">
        {/* Trigger button */}
        <button
          id={`${id}-trigger`}
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((p) => !p)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`w-full appearance-none flex items-center gap-2.5 bg-surface-base border rounded-md pl-3.5 pr-10 py-2.5 text-text-main font-sans text-body-md transition-colors hover:border-text-secondary/60 focus:outline-none focus:border-text-main focus:ring-2 focus:ring-text-main/20 ${
            open ? 'border-text-main ring-2 ring-text-main/20' : 'border-surface-border'
          }`}
        >
          {selected ? (
            <>
              <ColorDot color={selected.color} />
              <span className="truncate flex-1 text-left">{labelOf(selected)}</span>
            </>
          ) : (
            <span className="truncate flex-1 text-left text-text-secondary/70">
              {placeholder}
            </span>
          )}
          <CaretDown
            size={16}
            weight="regular"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
          />
        </button>

        {open && (
          <div
            ref={popoverRef}
            role="listbox"
            aria-label={label}
            className="absolute z-50 mt-1.5 w-full min-w-[280px] flex flex-col rounded-md border border-surface-border bg-surface-card shadow-lg overflow-hidden"
          >
            {/* Cercador */}
            <div className="px-3 py-2 border-b border-surface-border">
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Cerca o crea ${label.toLowerCase()}…`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canCreate) {
                    e.preventDefault()
                    void handleCreate()
                  }
                }}
                className="w-full bg-transparent text-body-sm text-text-main placeholder:text-text-secondary/60 focus:outline-none"
              />
            </div>

            {/* Llista d'opcions (scroll si moltes) */}
            <ul className="max-h-72 overflow-y-auto py-1">
              {/* "Sense valor" — només quan ja hi ha selecció. Permet
                  desvincular sense necessitat d'esborrar la fila. */}
              {selectedId && (
                <li>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm text-text-secondary hover:bg-surface-base transition-colors"
                  >
                    <X size={14} weight="regular" className="shrink-0" />
                    <span className="italic">Sense valor</span>
                  </button>
                </li>
              )}

              {filtered.length === 0 && !canCreate && (
                <li className="px-3 py-3 text-body-sm text-text-secondary text-center italic">
                  No hi ha resultats
                </li>
              )}

              {filtered.map((opt) => {
                const isEditing = editingId === opt.id
                const isPickingColor = colorPickingId === opt.id
                const isSelected = selectedId === opt.id
                return (
                  <li key={opt.id} className="relative">
                    {/* Mode normal */}
                    {!isEditing && !isPickingColor && (
                      <div
                        className={`group flex items-center gap-2 px-3 py-2 transition-colors hover:bg-surface-base ${
                          isSelected ? 'bg-surface-base' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelect(opt.id)}
                          aria-selected={isSelected}
                          role="option"
                          className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                        >
                          <ColorDot color={opt.color} />
                          <span className="truncate text-body-sm text-text-main">
                            {labelOf(opt)}
                          </span>
                          {isSelected && (
                            <Check size={14} weight="bold" className="ml-auto text-text-main shrink-0" />
                          )}
                        </button>

                        {/* Mini-toolbar per a l'opció (apareix on hover/focus) */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                          <MiniIconButton
                            label="Canviar color"
                            onClick={() => {
                              setColorPickingId(opt.id)
                              setEditingId(null)
                            }}
                          >
                            <Palette size={12} weight="regular" />
                          </MiniIconButton>
                          <MiniIconButton
                            label="Renombrar"
                            onClick={() => startEdit(opt)}
                          >
                            <PencilSimple size={12} weight="regular" />
                          </MiniIconButton>
                          <MiniIconButton
                            label="Eliminar"
                            danger
                            onClick={() => handleDelete(opt)}
                          >
                            <Trash size={12} weight="regular" />
                          </MiniIconButton>
                        </div>
                      </div>
                    )}

                    {/* Mode edició (rename inline) */}
                    {isEditing && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-surface-base">
                        <ColorDot color={opt.color} />
                        <input
                          type="text"
                          value={editValue}
                          autoFocus
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              void commitEdit()
                            } else if (e.key === 'Escape') {
                              e.preventDefault()
                              setEditingId(null)
                            }
                          }}
                          onBlur={commitEdit}
                          className="flex-1 min-w-0 bg-transparent text-body-sm text-text-main focus:outline-none border-b border-text-main"
                        />
                      </div>
                    )}

                    {/* Mode picker de color */}
                    {isPickingColor && (
                      <div className="flex flex-col gap-2 px-3 py-2 bg-surface-base">
                        <div className="flex items-center justify-between">
                          <span className="text-body-xs text-text-secondary uppercase tracking-wider">
                            Color
                          </span>
                          <button
                            type="button"
                            onClick={() => setColorPickingId(null)}
                            className="text-text-secondary hover:text-text-main"
                            aria-label="Tancar paleta"
                          >
                            <X size={12} weight="regular" />
                          </button>
                        </div>
                        <div className="grid grid-cols-8 gap-1.5">
                          {COLOR_PALETTE.map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              onClick={() => void handlePickColor(opt, c.value)}
                              title={c.label}
                              aria-label={c.label}
                              className="w-5 h-5 rounded-full border border-surface-border hover:scale-110 transition-transform"
                              style={{ backgroundColor: c.value }}
                            />
                          ))}
                          {/* Sense color */}
                          <button
                            type="button"
                            onClick={() => void handlePickColor(opt, null)}
                            title="Sense color"
                            aria-label="Sense color"
                            className="w-5 h-5 rounded-full border border-dashed border-text-secondary hover:scale-110 transition-transform"
                          />
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}

              {/* Fila "+ Crear nou" — només si el query no coincideix amb res */}
              {canCreate && (
                <li>
                  <button
                    type="button"
                    onClick={handleCreate}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm text-text-main hover:bg-surface-base transition-colors border-t border-surface-border"
                  >
                    <Plus size={14} weight="bold" className="shrink-0 text-text-secondary" />
                    <span className="truncate">
                      Crear <span className="font-medium">«{query.trim()}»</span>
                    </span>
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {hint && (
        <p className="text-body-sm text-text-secondary/80 leading-snug max-w-prose">
          {hint}
        </p>
      )}
    </div>
  )
}

/** Cercle del color del rol/categoria. NULL → cercle outline neutre. */
function ColorDot({ color }: { color: string | null }) {
  if (!color) {
    return (
      <span
        aria-hidden
        className="inline-block w-3 h-3 rounded-full border border-text-secondary/40 shrink-0"
      />
    )
  }
  return (
    <span
      aria-hidden
      className="inline-block w-3 h-3 rounded-full shrink-0"
      style={{ backgroundColor: color }}
    />
  )
}

function MiniIconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center w-6 h-6 rounded transition-colors ${
        danger
          ? 'text-error/80 hover:text-error hover:bg-error-surface'
          : 'text-text-secondary hover:text-text-main hover:bg-surface-card'
      }`}
    >
      {children}
    </button>
  )
}
