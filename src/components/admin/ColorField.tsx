"use client"

import { useId, useState } from 'react'

/**
 * <ColorField />
 *
 * Camp de color amb swatch visual + input hex editable. Mostra el color
 * actual com a quadrat petit a l'esquerra del valor, evocant la
 * presentació del paleta de colors. L'estètica visual mimicritza els
 * altres inputs del WorkForm (bg-surface-base, border, focus ring).
 *
 * Suporta dos modes:
 *  - **Controlled** (per estats externs com el reducer del
 *    WorkContentEditor): es passa `value` + `onChange`.
 *  - **Uncontrolled** (per <form> + FormData): es passa `name` +
 *    opcionalment `defaultValue`. L'estat es gestiona localment i
 *    s'enregistra al FormData.
 */

interface Props {
  /** Label visible a sobre del swatch. */
  label: string
  /** Hint sota el camp (opcional). */
  hint?: string

  /* Mode controlat */
  value?: string
  onChange?: (v: string) => void

  /* Mode uncontrolled */
  /** Nom del camp al FormData. */
  name?: string
  /** Valor inicial. */
  defaultValue?: string
}

export default function ColorField({
  label,
  hint,
  value,
  onChange,
  name,
  defaultValue,
}: Props) {
  const id = useId()
  const isControlled = onChange !== undefined

  // En mode uncontrolled, mantenim un estat local per pintar el swatch
  // en temps real mentre l'usuari edita (el FormData captura el valor
  // de l'input nadiu en submit, però necessitem reactivitat visual).
  const [internalValue, setInternalValue] = useState<string>(defaultValue || '')
  const currentValue = isControlled ? (value ?? '') : internalValue

  const setValue = (v: string) => {
    if (isControlled) onChange?.(v)
    else setInternalValue(v)
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="inline-flex items-center gap-1 text-body-sm font-medium text-text-secondary"
      >
        {label}
      </label>
      {/* Wrapper: padding asimètric coincident amb el Figma (pl-2 pr-3.5
          py-1.5) — fa que el swatch quedi prop de la vora esquerra i el
          text hexa tingui aire respecte el dret. */}
      <div className="flex items-center gap-2.5 bg-transparent border border-surface-border rounded-md pl-2 pr-3.5 py-1.5 transition-colors hover:border-text-secondary/60 focus-within:border-text-main focus-within:ring-2 focus-within:ring-text-main/20">
        {/* Swatch — clickable per obrir el color picker natiu.
            Mida 36×36 (w-9 h-9) i rounded-md per coincidir amb el Figma. */}
        <label
          className="relative w-9 h-9 rounded-md shrink-0 cursor-pointer border border-surface-border overflow-hidden"
          style={{ backgroundColor: currentValue || '#ffffff' }}
          aria-label="Triar color"
        >
          <input
            type="color"
            value={currentValue || '#000000'}
            onChange={(e) => setValue(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        {/* Hex input editable — font sans (no mono) seguint el Figma. */}
        <input
          id={id}
          type="text"
          value={currentValue}
          onChange={(e) => setValue(e.target.value)}
          placeholder="#000000"
          className="flex-1 min-w-0 bg-transparent text-text-main font-sans text-body-md focus:outline-none"
        />
        {/* Hidden input per FormData (mode uncontrolled). Manté `name` per
            al submit; el valor sempre coincideix amb currentValue. */}
        {!isControlled && name && (
          <input type="hidden" name={name} value={currentValue} />
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
