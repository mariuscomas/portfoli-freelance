"use client"

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Eye,
  EyeSlash,
  Pencil,
  Star,
  Copy,
  Warning,
  ClockCounterClockwise,
  DotsSixVertical,
} from '@phosphor-icons/react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableSyntheticListeners,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { duplicateWork, reorderWorks } from '@/app/admin/works/actions'
import {
  countContentWarnings,
  localeStatus,
  relativeTime,
  type RawWorkContent,
  type LocaleStatus,
} from '@/lib/work-summary'
import type { Translatable } from '@/types/database'

/**
 * <WorksList />
 *
 * Llistat de treballs amb drag-and-drop per controlar l'ordre públic
 * (s'escriu a `order_index` a la BD). El públic — i el llistat mateix —
 * ordenen per `order_index`, així que aquest reorder canvia la
 * presentació del portfolio a /works.
 *
 * Optimistic UI: en deixar anar el drag, l'array local s'actualitza
 * immediatament i la mutació al server corre en background.
 */

interface WorkRow {
  id: string
  title: unknown
  slug: unknown
  year: string | null
  hero_color: string | null
  content: unknown
  client_name: unknown
  role: unknown
  short_description: unknown
  conclusion: unknown
  is_published: boolean | null
  is_featured: boolean | null
  order_index: number | null
  created_at: string
  updated_at: string | null
}

function pickLocale(field: unknown, locale: 'ca' | 'en' | 'es' = 'ca'): string {
  if (typeof field === 'string') return field
  if (typeof field === 'object' && field !== null) {
    const t = field as Translatable
    return t[locale] ?? t.ca ?? t.en ?? t.es ?? ''
  }
  return ''
}

export default function WorksList({ works: initialWorks }: { works: WorkRow[] }) {
  const [works, setWorks] = useState<WorkRow[]>(initialWorks)
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = works.findIndex((w) => w.id === active.id)
    const newIndex = works.findIndex((w) => w.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    // Optimistic update — actualitzem l'estat local primer perquè la UI
    // respongui de cop, després persistim al server. Si la mutació
    // falla, revertim.
    const prev = works
    const next = [...works]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved)
    setWorks(next)

    startTransition(async () => {
      try {
        await reorderWorks(next.map((w) => w.id))
      } catch (err) {
        console.error('[WorksList] reorder failed, reverting', err)
        setWorks(prev)
      }
    })
  }

  return (
    <DndContext
      id="admin-works-reorder"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={works.map((w) => w.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex flex-col divide-y divide-surface-border">
          {works.map((w) => (
            <SortableWorkItem key={w.id} work={w} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function SortableWorkItem({ work: w }: { work: WorkRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: w.id,
  })

  const title = pickLocale(w.title)
  const slug = pickLocale(w.slug)
  const heroContent = (w.content as { hero?: { backgroundColor?: string } } | null)?.hero
  const chipColor = heroContent?.backgroundColor || w.hero_color || '#1A1A1A'
  const warningsCount = countContentWarnings(w.content as RawWorkContent | null)
  const localeStatuses: Record<'ca' | 'en' | 'es', LocaleStatus> = {
    ca: localeStatus(w as unknown as Record<string, unknown>, 'ca'),
    en: localeStatus(w as unknown as Record<string, unknown>, 'en'),
    es: localeStatus(w as unknown as Record<string, unknown>, 'es'),
  }

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
        position: 'relative',
      }}
      {...attributes}
      className="group flex items-center gap-2 hover:bg-surface-card transition-colors px-2 -mx-2 rounded-md"
    >
      <DragHandleButton listeners={listeners} />

      <Link
        href={`/admin/works/${w.id}`}
        className="flex items-center justify-between gap-6 py-5 flex-1 min-w-0"
      >
        {/* Color chip + títol */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div
            className="w-8 h-8 rounded-md shrink-0 border border-surface-border"
            style={{ backgroundColor: chipColor }}
            aria-hidden="true"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-body-lg text-text-main font-medium truncate">
              {title || '(Sense títol)'}
            </span>
            <div className="flex items-center gap-3 text-body-sm text-text-secondary">
              <span className="truncate">
                /works/{slug || '...'} {w.year && `· ${w.year}`}
              </span>
              {w.updated_at && (
                <span
                  className="inline-flex items-center gap-1 shrink-0 opacity-80"
                  title={`Editat el ${new Date(w.updated_at).toLocaleString('ca-ES')}`}
                >
                  <ClockCounterClockwise size={12} weight="regular" />
                  {relativeTime(w.updated_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* i18n + warnings + estat */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-1" title="Estat de les traduccions">
            {(['ca', 'en', 'es'] as const).map((l) => (
              <span
                key={l}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-body-xs uppercase tracking-wider ${
                  localeStatuses[l] === 'complete'
                    ? 'text-accent'
                    : localeStatuses[l] === 'partial'
                      ? 'text-warning'
                      : 'text-text-secondary/50'
                }`}
              >
                <span
                  aria-hidden
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    localeStatuses[l] === 'complete'
                      ? 'bg-accent'
                      : localeStatuses[l] === 'partial'
                        ? 'bg-warning'
                        : 'bg-text-secondary/30'
                  }`}
                />
                {l}
              </span>
            ))}
          </div>

          {warningsCount > 0 && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning-surface text-warning text-body-xs font-medium"
              title={`${warningsCount} ${warningsCount === 1 ? 'avís' : 'avisos'} al case study (alt text, blocs sense títol…)`}
            >
              <Warning size={12} weight="fill" />
              {warningsCount}
            </span>
          )}

          {w.is_featured && (
            <span title="Destacat" aria-label="Destacat" className="text-accent">
              <Star size={18} weight="fill" />
            </span>
          )}
          {w.is_published ? (
            <span className="inline-flex items-center gap-1.5 text-body-xs text-text-secondary">
              <Eye size={14} weight="regular" />
              Publicat
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-body-xs text-text-secondary opacity-70">
              <EyeSlash size={14} weight="regular" />
              Esborrany
            </span>
          )}
          <Pencil
            size={16}
            weight="regular"
            className="text-text-secondary group-hover:text-accent transition-colors"
          />
        </div>
      </Link>

      <form action={duplicateWork}>
        <input type="hidden" name="id" value={w.id} />
        <button
          type="submit"
          title="Duplicar treball"
          aria-label="Duplicar treball"
          className="inline-flex items-center justify-center w-9 h-9 rounded-md text-text-secondary hover:text-text-main hover:bg-surface-base transition-colors"
        >
          <Copy size={16} weight="regular" />
        </button>
      </form>
    </li>
  )
}

/** Drag handle: només es veu al hover de la fila per no afegir soroll visual. */
function DragHandleButton({ listeners }: { listeners: DraggableSyntheticListeners }) {
  return (
    <button
      type="button"
      {...listeners}
      aria-label="Reordenar treball"
      title="Reordenar treball (arrossega)"
      className="cursor-grab active:cursor-grabbing p-1.5 -ml-2 text-text-secondary/40 hover:text-text-main opacity-0 group-hover:opacity-100 transition-opacity touch-none"
    >
      <DotsSixVertical size={16} weight="bold" />
    </button>
  )
}
