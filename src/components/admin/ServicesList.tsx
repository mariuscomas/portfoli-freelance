"use client"

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Eye,
  EyeSlash,
  Pencil,
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
import { reorderServices } from '@/app/admin/serveis/actions'
import {
  localeStatus,
  relativeTime,
  SERVICE_I18N_FIELDS,
  type LocaleStatus,
} from '@/lib/work-summary'
import type { Translatable } from '@/types/database'

/**
 * <ServicesList />
 *
 * Llistat reordenable dels tres productes del catàleg. L'ordre és el de les
 * cards de la tríada a /serveis. No hi ha crear, duplicar ni esborrar: els
 * productes són fixos (product_id amb check constraint), perquè cada un té la
 * seva ruta i els seus preus a codi. Comparteix els helpers genèrics de
 * lib/work-summary.
 */

interface ServiceRow {
  id: string
  product_id: string
  title: unknown
  short_description: unknown
  cta: unknown
  includes: unknown
  is_published: boolean | null
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

export default function ServicesList({ services: initialServices }: { services: ServiceRow[] }) {
  const [services, setServices] = useState<ServiceRow[]>(initialServices)
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = services.findIndex((s) => s.id === active.id)
    const newIndex = services.findIndex((s) => s.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const prev = services
    const next = [...services]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved)
    setServices(next)

    startTransition(async () => {
      try {
        await reorderServices(next.map((s) => s.id))
      } catch (err) {
        console.error('[ServicesList] reorder failed, reverting', err)
        setServices(prev)
      }
    })
  }

  return (
    <DndContext
      id="admin-services-reorder"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={services.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex flex-col divide-y divide-border-subtle">
          {services.map((s) => (
            <SortableServiceItem key={s.id} service={s} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function SortableServiceItem({ service: s }: { service: ServiceRow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: s.id,
  })

  const title = pickLocale(s.title)
  const includesCount = Array.isArray(s.includes) ? s.includes.length : 0
  const localeStatuses: Record<'ca' | 'en' | 'es', LocaleStatus> = {
    ca: localeStatus(s as unknown as Record<string, unknown>, 'ca', SERVICE_I18N_FIELDS),
    en: localeStatus(s as unknown as Record<string, unknown>, 'en', SERVICE_I18N_FIELDS),
    es: localeStatus(s as unknown as Record<string, unknown>, 'es', SERVICE_I18N_FIELDS),
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
        href={`/admin/serveis/${s.id}`}
        className="flex items-center justify-between gap-6 py-5 flex-1 min-w-0"
      >
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-body-lg text-text-main font-medium truncate">
            {title || '(Sense títol)'}
          </span>
          <div className="flex items-center gap-3 text-body-sm text-text-secondary">
            <span className="truncate">
              /serveis/{s.product_id}
              {includesCount > 0 && ` · ${includesCount} línies al "què inclou"`}
            </span>
            {s.updated_at && (
              <span
                className="inline-flex items-center gap-1 shrink-0 opacity-80"
                title={`Editat el ${new Date(s.updated_at).toLocaleString('ca-ES')}`}
              >
                <ClockCounterClockwise size={12} weight="regular" />
                {relativeTime(s.updated_at)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* i18n status badges */}
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

          {s.is_published ? (
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

    </li>
  )
}

function DragHandleButton({ listeners }: { listeners: DraggableSyntheticListeners }) {
  return (
    <button
      type="button"
      {...listeners}
      aria-label="Reordenar servei"
      title="Reordenar servei (arrossega)"
      className="cursor-grab active:cursor-grabbing p-1.5 -ml-2 text-text-secondary/40 hover:text-text-main opacity-0 group-hover:opacity-100 transition-opacity touch-none"
    >
      <DotsSixVertical size={16} weight="bold" />
    </button>
  )
}
