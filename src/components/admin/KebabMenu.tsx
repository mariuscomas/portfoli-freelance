"use client"

import { useEffect, useId, useRef, useState } from 'react'
import { DotsThreeVertical } from '@phosphor-icons/react'

/**
 * <KebabMenu />
 *
 * Menú overflow estil Notion / Google Docs: un botó `⋮` que obre un
 * dropdown amb accions secundàries. Pensat per al top bar del WorkForm
 * però reutilitzable arreu.
 *
 * Items configurables amb:
 *  - `label` — text visible
 *  - `icon` — opcional, ReactNode
 *  - `onClick` — handler (es tanca el menú automàticament després)
 *  - `variant: 'danger'` — pinta el text en vermell (accions destructives)
 *  - `separator: true` — entrada que no és botó, només divisor
 *  - `disabled` — gris i no clickable
 *
 * UX:
 *  - Click outside → tanca
 *  - Escape → tanca + retorna focus al botó
 *  - Posicionament: anchor right per defecte (el menú s'expandeix cap a
 *    l'esquerra des del botó, perquè el botó sol viure al cantó dret)
 */

export type KebabMenuItem =
  | {
      label: string
      onClick: () => void
      icon?: React.ReactNode
      variant?: 'default' | 'danger'
      disabled?: boolean
    }
  | { separator: true }

interface Props {
  items: KebabMenuItem[]
  /** Label per a screen readers + tooltip del botó. */
  label?: string
  /** Mida del botó. Default 'md' (h-9 com els altres botons del top bar). */
  size?: 'sm' | 'md'
}

export default function KebabMenu({ items, label = 'Més accions', size = 'md' }: Props) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const id = useId()

  // Click outside per tancar
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Escape per tancar + focus back al botó
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        title={label}
        className={`${sizeClasses} inline-flex items-center justify-center rounded-full border border-surface-border text-text-main hover:border-text-main transition-colors ${
          open ? 'border-text-main bg-surface-base' : ''
        }`}
      >
        <DotsThreeVertical size={18} weight="bold" />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={`${id}-menu`}
          role="menu"
          aria-label={label}
          className="absolute right-0 z-50 min-w-[220px] flex flex-col rounded-md border border-surface-border bg-surface-card shadow-lg py-1 overflow-hidden"
          style={{ top: 'calc(100% + 0.75rem)' }}
        >
          {items.map((item, i) => {
            if ('separator' in item) {
              return (
                <div
                  key={`sep-${i}`}
                  role="separator"
                  className="my-1 h-px bg-surface-border"
                />
              )
            }
            const isDanger = item.variant === 'danger'
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false)
                  item.onClick()
                }}
                className={`flex items-center gap-2.5 px-3 py-2 text-body-sm text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDanger
                    ? 'text-error hover:bg-error-surface'
                    : 'text-text-main hover:bg-surface-base'
                }`}
              >
                {item.icon && (
                  <span className={`shrink-0 ${isDanger ? 'text-error' : 'text-text-secondary'}`}>
                    {item.icon}
                  </span>
                )}
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
