"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { Warning } from '@phosphor-icons/react'

/**
 * <ConfirmDialog /> + useConfirm()
 * --------------------------------------------------------------------
 * Substitueix `window.confirm()` per un modal del design system,
 * preservant l'API imperativa (retorna Promise<boolean>).
 *
 * Ús típic:
 *
 *   const { confirm, dialog } = useConfirm()
 *
 *   const handleDelete = async () => {
 *     const ok = await confirm({
 *       title: 'Eliminar treball',
 *       message: 'L\'acció no es pot desfer.',
 *       confirmLabel: 'Eliminar',
 *       danger: true,
 *     })
 *     if (!ok) return
 *     // ...
 *   }
 *
 *   return (
 *     <>
 *       <form>...</form>
 *       {dialog}
 *     </>
 *   )
 *
 * Funcionalitats:
 *   - Backdrop click → cancela
 *   - Escape → cancela
 *   - Focus automàtic al botó cancel (per evitar accions destructives accidentals)
 *   - aria-modal i role="dialog" per a11y
 */

interface ConfirmOptions {
  /** Títol del modal. Opcional. */
  title?: string
  /** Cos del missatge (la pregunta o explicació). */
  message: string
  /** Etiqueta del botó de confirmació. Per defecte "Confirmar". */
  confirmLabel?: string
  /** Etiqueta del botó de cancel·lar. Per defecte "Cancel·lar". */
  cancelLabel?: string
  /** Si true, el botó de confirmar es pinta en vermell. Per accions destructives. */
  danger?: boolean
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void
}

export function useConfirm() {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setPending({ ...options, resolve })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    pending?.resolve(true)
    setPending(null)
  }, [pending])

  const handleCancel = useCallback(() => {
    pending?.resolve(false)
    setPending(null)
  }, [pending])

  const dialog = pending ? (
    <ConfirmDialog
      title={pending.title}
      message={pending.message}
      confirmLabel={pending.confirmLabel}
      cancelLabel={pending.cancelLabel}
      danger={pending.danger}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null

  return { confirm, dialog }
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancel·lar',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmOptions & {
  onConfirm: () => void
  onCancel: () => void
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Tanca amb Escape, navega amb Tab dins del modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKey)
    // Focus al botó cancel·lar per defecte — més segur per evitar
    // confirmacions accidentals amb Enter.
    cancelRef.current?.focus()
    // Bloqueja el scroll del body mentre el modal és obert
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = originalOverflow
    }
  }, [onCancel])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'confirm-dialog-title' : undefined}
      aria-describedby="confirm-dialog-message"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop — click per cancel·lar */}
      <button
        type="button"
        onClick={onCancel}
        aria-label="Tancar modal"
        tabIndex={-1}
        className="absolute inset-0 bg-text-main/40 backdrop-blur-sm cursor-default"
      />

      {/* Modal card */}
      <div className="relative max-w-md w-full bg-surface-card rounded-[var(--radius-base)] border border-surface-border shadow-2xl p-6 flex flex-col gap-4">
        {danger && (
          <div
            aria-hidden
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-error-surface text-error"
          >
            <Warning size={20} weight="fill" />
          </div>
        )}

        {title && (
          <h2
            id="confirm-dialog-title"
            className="text-body-xl font-medium text-text-main"
          >
            {title}
          </h2>
        )}

        <p
          id="confirm-dialog-message"
          className="text-body-md text-text-secondary leading-relaxed"
        >
          {message}
        </p>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 rounded-full border border-surface-border text-text-main hover:border-text-secondary text-body-sm transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`inline-flex items-center px-4 py-2 rounded-full text-body-sm font-medium transition-colors ${
              danger
                ? 'bg-error text-text-main-inverse hover:opacity-90'
                : 'bg-text-main text-text-main-inverse hover:opacity-90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
