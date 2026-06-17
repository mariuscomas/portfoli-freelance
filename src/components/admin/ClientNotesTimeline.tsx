"use client"

import { useRef, useState, useTransition } from 'react'
import {
  Plus,
  Trash,
  CircleNotch,
  Note as NoteIcon,
} from '@phosphor-icons/react'
import type { ClientNote } from '@/types/database'

/**
 * <ClientNotesTimeline />
 *
 * Llistat cronològic d'interaccions amb un client. Aporta:
 *   - Formulari "Afegir nota" amb textarea + drecera Cmd/Ctrl+Enter.
 *   - Llistat invertit (les més noves dalt) amb timestamp absolut + delete.
 *
 * Les server actions s'injecten via props perquè aquest és un client
 * component i no podem importar accions directament aquí — el patró
 * coincideix amb com `WorkForm` rep `onSubmit` / `onDelete`.
 */

interface Props {
  clientId: string
  notes: ClientNote[]
  onAdd: (formData: FormData) => Promise<void>
  onDelete: (noteId: string) => Promise<void>
}

export default function ClientNotesTimeline({
  clientId,
  notes,
  onAdd,
  onDelete,
}: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const submit = () => {
    const form = formRef.current
    if (!form) return
    const body = String(new FormData(form).get('body') || '').trim()
    if (!body) {
      setError('La nota no pot estar buida.')
      return
    }
    setError(null)
    const fd = new FormData(form)
    startTransition(async () => {
      try {
        await onAdd(fd)
        form.reset()
        // Re-focus al textarea perquè l'usuari pugui afegir-ne una altra
        // immediatament — flow típic de prendre notes seguides.
        textareaRef.current?.focus()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconegut')
      }
    })
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    submit()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd+Enter (macOS) / Ctrl+Enter (Win/Linux) = submit ràpid.
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  const handleDelete = (noteId: string) => {
    setPendingDeleteId(noteId)
    startTransition(async () => {
      try {
        await onDelete(noteId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconegut')
      } finally {
        setPendingDeleteId(null)
      }
    })
  }

  return (
    <aside
      className="flex flex-col gap-5 rounded-[var(--radius-base)] border border-surface-border bg-surface-card p-5"
      aria-label="Timeline d'interaccions"
    >
      <header className="flex flex-col">
        <span className="font-sans font-medium uppercase tracking-[0.18em] text-body-xs text-text-secondary">
          Timeline
        </span>
        <h3 className="text-body-lg text-text-main mt-1">
          Interaccions
        </h3>
        <p className="text-body-sm text-text-secondary/80 mt-1 leading-snug">
          Cada nota es guarda amb timestamp. Pots usar-ho com a historial de trucades, emails o reunions.
        </p>
      </header>

      {/* ====== Formulari "Afegir nota" ====== */}
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input type="hidden" name="client_id" value={clientId} />
        <textarea
          ref={textareaRef}
          name="body"
          rows={3}
          required
          onKeyDown={handleKeyDown}
          placeholder="Trucada amb el client el dilluns: m'envia el brief abans del divendres…"
          className="w-full bg-transparent border border-surface-border rounded-md px-3.5 py-2.5 text-text-main font-sans text-body-sm placeholder:text-text-secondary/50 focus:outline-none focus:border-text-main focus:ring-2 focus:ring-text-main/20 resize-y leading-relaxed"
        />
        {error && (
          <p className="text-body-sm text-error leading-snug">{error}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="text-body-xs text-text-secondary/70">
            Cmd/Ctrl + Enter per desar
          </span>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-text-main text-text-main-inverse rounded-full text-body-sm font-medium hover:bg-accent hover:text-text-main transition-colors disabled:opacity-50"
          >
            {isPending && pendingDeleteId === null ? (
              <CircleNotch size={14} weight="regular" className="animate-spin" />
            ) : (
              <Plus size={14} weight="bold" />
            )}
            Afegir nota
          </button>
        </div>
      </form>

      {/* ====== Llistat ====== */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center text-text-secondary text-body-sm border-t border-surface-border">
          <NoteIcon size={20} weight="regular" className="text-text-secondary/40" />
          Encara no hi ha cap interacció registrada.
        </div>
      ) : (
        <ol className="flex flex-col gap-4 border-t border-surface-border pt-5">
          {notes.map((n) => (
            <li key={n.id} className="flex flex-col gap-1 group">
              <div className="flex items-center justify-between gap-2">
                <time
                  dateTime={n.created_at}
                  className="text-body-xs text-text-secondary"
                  title={new Date(n.created_at).toLocaleString('ca-ES')}
                >
                  {formatDate(n.created_at)}
                </time>
                <button
                  type="button"
                  onClick={() => handleDelete(n.id)}
                  disabled={isPending && pendingDeleteId === n.id}
                  title="Eliminar nota"
                  aria-label="Eliminar nota"
                  className="text-text-secondary/40 hover:text-error opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
                >
                  {isPending && pendingDeleteId === n.id ? (
                    <CircleNotch size={14} weight="regular" className="animate-spin" />
                  ) : (
                    <Trash size={14} weight="regular" />
                  )}
                </button>
              </div>
              <p className="text-body-sm text-text-main whitespace-pre-wrap leading-relaxed">
                {n.body}
              </p>
            </li>
          ))}
        </ol>
      )}
    </aside>
  )
}

/** Format compacte amb data i hora ("15 maig · 14:32"). */
function formatDate(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('ca-ES', {
    day: 'numeric',
    month: 'short',
    year: isThisYear(d) ? undefined : 'numeric',
  })
  const time = d.toLocaleTimeString('ca-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${date} · ${time}`
}

function isThisYear(d: Date): boolean {
  return d.getFullYear() === new Date().getFullYear()
}
