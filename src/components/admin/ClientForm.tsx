"use client"

import { useState, useTransition, useId } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  FloppyDisk,
  Trash,
  Warning,
  CircleNotch,
  Buildings,
  EnvelopeSimple,
  Phone,
  Globe,
} from '@phosphor-icons/react'
import { useConfirm } from './useConfirm'
import ClientStatusBadge from './ClientStatusBadge'
import {
  CLIENT_SOURCES,
  CLIENT_SOURCE_LABELS,
  CLIENT_STATUSES,
  CLIENT_STATUS_META,
  type Client,
  type ClientStatus,
} from '@/types/database'

/**
 * <ClientForm />
 *
 * Formulari reutilitzat per /admin/clients/new i /admin/clients/[id].
 *
 * No fa autosave (a diferència de WorkForm): els clients tenen pocs
 * camps, no requereixen iteració constant. L'usuari prem "Desar canvis"
 * explícitament. Sí que valida nom mínim i format d'email/website.
 */

interface Props {
  mode: 'create' | 'edit'
  client?: Client
  onSubmit: (formData: FormData) => Promise<void>
  onDelete?: () => Promise<void>
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ClientForm({ mode, client, onSubmit, onDelete }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  // Pipeline visual: l'usuari pot canviar l'estat sense haver de mirar el
  // select natiu. El select hidden segueix sent l'única font de veritat
  // que arriba al server action.
  const [status, setStatus] = useState<ClientStatus>(
    (client?.status as ClientStatus) || 'new'
  )

  const isEdit = mode === 'edit'
  const { confirm: confirmModal, dialog: confirmDialog } = useConfirm()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = String(formData.get('email') || '').trim()
    if (email && !EMAIL_PATTERN.test(email)) {
      setEmailError('Format d\'email no vàlid.')
      return
    }
    setEmailError(null)

    // Assegurem-nos que l'status sincronitzat al state es persisteix
    formData.set('status', status)

    startTransition(async () => {
      try {
        await onSubmit(formData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconegut')
      }
    })
  }

  const handleDelete = async () => {
    if (!onDelete) return
    const ok = await confirmModal({
      title: 'Eliminar client',
      message:
        'El client s\'eliminarà definitivament, incloent totes les seves notes. Els projectes vinculats no s\'esborraran (només es desvinculen). Aquesta acció no es pot desfer.',
      confirmLabel: 'Eliminar',
      danger: true,
    })
    if (!ok) return
    setError(null)
    startTransition(async () => {
      try {
        await onDelete()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconegut')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-8">
      {/* ====== TOP BAR sticky ====== */}
      <div className="sticky top-0 z-20 -mx-6 md:-mx-10 bg-surface-base/90 backdrop-blur-md border-b border-surface-border">
        <div className="flex items-center justify-between gap-4 mx-auto px-6 md:px-10 py-3 max-w-4xl">
          <Link
            href="/admin/clients"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors text-body-sm"
          >
            <ArrowLeft size={16} weight="regular" />
            Tornar a clients
          </Link>

          <div className="flex items-center gap-3">
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 border border-error/40 text-error rounded-full hover:bg-error hover:text-text-main-inverse hover:border-error transition-colors text-body-sm disabled:opacity-50"
              >
                <Trash size={16} weight="regular" />
                Eliminar
              </button>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 bg-text-main text-text-main-inverse rounded-full font-sans font-medium text-body-md hover:bg-accent hover:text-text-main transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <CircleNotch size={16} weight="regular" className="animate-spin" />
              ) : (
                <FloppyDisk size={16} weight="regular" />
              )}
              {isPending ? 'Desant…' : isEdit ? 'Desar canvis' : 'Crear client'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 border border-error/40 rounded-md bg-error-surface text-error text-body-sm"
        >
          <Warning size={18} weight="fill" className="flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-medium">No s&apos;ha pogut desar</span>
            <span className="text-text-main">{error}</span>
          </div>
        </div>
      )}

      {/* ====== Header de pàgina ====== */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-sans uppercase tracking-[0.15em] text-body-sm text-text-secondary">
            Client
          </span>
          <ClientStatusBadge status={status} size="md" />
        </div>
        <h2 className="text-heading-h3 text-text-main">
          {isEdit ? client?.name || 'Editar client' : 'Nou client'}
        </h2>
        <p className="text-body-sm text-text-secondary max-w-prose">
          {isEdit
            ? 'Actualitza la informació de contacte, l\'estat al pipeline i les notes generals. Per afegir entrades al timeline d\'interaccions, fes-ho des de la columna lateral.'
            : 'Crea una fitxa nova. Només el nom és obligatori — la resta pots completar-la més tard.'}
        </p>
      </header>

      {/* ====== Pipeline visual ====== */}
      <Card eyebrow="Pipeline" title="Estat actual">
        <input type="hidden" name="status" value={status} />
        <div className="flex flex-wrap gap-2">
          {CLIENT_STATUSES.map((s) => {
            const meta = CLIENT_STATUS_META[s]
            const active = status === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                aria-pressed={active}
                title={meta.description}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-body-sm border transition-colors ${
                  active
                    ? 'bg-text-main text-text-main-inverse border-text-main'
                    : 'bg-surface-card text-text-secondary border-surface-border hover:text-text-main hover:border-text-main/40'
                }`}
              >
                {meta.label}
              </button>
            )
          })}
        </div>
        <p className="text-body-xs text-text-secondary/80 mt-2 leading-snug">
          {CLIENT_STATUS_META[status].description}
        </p>
      </Card>

      {/* ====== Identificació ====== */}
      <Card eyebrow="Contacte" title="Identificació">
        <Row>
          <Col span={6}>
            <Field
              label="Nom"
              type="text"
              name="name"
              required
              defaultValue={client?.name || ''}
              placeholder="Nom de la persona"
            />
          </Col>
          <Col span={6}>
            <Field
              label="Empresa"
              type="text"
              name="company"
              defaultValue={client?.company ?? ''}
              icon={<Buildings size={14} weight="regular" />}
              placeholder="Nom de l'empresa (opcional)"
            />
          </Col>
        </Row>

        <Row>
          <Col span={6}>
            <Field
              label="Email"
              type="email"
              name="email"
              defaultValue={client?.email ?? ''}
              icon={<EnvelopeSimple size={14} weight="regular" />}
              placeholder="nom@empresa.com"
              warning={emailError ?? undefined}
              onChange={() => emailError && setEmailError(null)}
            />
          </Col>
          <Col span={6}>
            <Field
              label="Telèfon"
              type="tel"
              name="phone"
              defaultValue={client?.phone ?? ''}
              icon={<Phone size={14} weight="regular" />}
              placeholder="+34 600 000 000"
            />
          </Col>
        </Row>

        <Row>
          <Col span={12}>
            <Field
              label="Web"
              type="url"
              name="website"
              defaultValue={client?.website ?? ''}
              icon={<Globe size={14} weight="regular" />}
              placeholder="https://exemple.com"
            />
          </Col>
        </Row>
      </Card>

      {/* ====== Origen + Notes ====== */}
      <Card eyebrow="Context" title="Origen i notes">
        <Row>
          <Col span={6}>
            <Select
              label="Origen"
              name="source"
              defaultValue={client?.source ?? ''}
              options={[
                { value: '', label: '— Sense especificar —' },
                ...CLIENT_SOURCES.map((s) => ({
                  value: s,
                  label: CLIENT_SOURCE_LABELS[s],
                })),
              ]}
              hint="Com et va trobar aquest client?"
            />
          </Col>
        </Row>

        <Row>
          <Col span={12}>
            <Textarea
              label="Notes generals"
              name="notes"
              rows={5}
              defaultValue={client?.notes ?? ''}
              placeholder="Detalls del projecte, preferències, conversa inicial… Per al timeline d'interaccions amb data, usa el panell lateral 'Afegir nota'."
              hint="Per a interaccions concretes amb data, fes servir el timeline lateral (Afegir nota). Aquí guarda informació estable de la fitxa."
            />
          </Col>
        </Row>
      </Card>

      {confirmDialog}
    </form>
  )
}

/* ------------------------------------------------------------------ */
/*  Primitives                                                          */
/* ------------------------------------------------------------------ */

function Card({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title?: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="flex flex-col gap-5 rounded-[var(--radius-base)] border border-surface-border bg-surface-card p-5 md:p-7">
      <legend className="contents">
        <div className="flex flex-col">
          <span className="font-sans font-medium uppercase tracking-[0.18em] text-body-xs text-text-secondary">
            {eyebrow}
          </span>
          {title && (
            <h3 className="text-body-lg text-text-main mt-1">{title}</h3>
          )}
        </div>
      </legend>
      {children}
    </fieldset>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
      {children}
    </div>
  )
}

function Col({
  span = 12,
  children,
}: {
  span?: 3 | 4 | 6 | 8 | 12
  children: React.ReactNode
}) {
  const cls = {
    3: 'md:col-span-3',
    4: 'md:col-span-4',
    6: 'md:col-span-6',
    8: 'md:col-span-8',
    12: 'md:col-span-12',
  }[span]
  return <div className={cls}>{children}</div>
}

function Field({
  label,
  hint,
  warning,
  required,
  icon,
  ...props
}: {
  label: string
  hint?: string
  warning?: string
  required?: boolean
  icon?: React.ReactNode
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const autoId = useId()
  const id = props.id ?? autoId
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="inline-flex items-center gap-1 text-body-sm font-medium text-text-secondary"
      >
        {label}
        {required && <span className="text-error">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={id}
          required={required}
          {...props}
          className={`w-full bg-transparent border rounded-md ${
            icon ? 'pl-9 pr-3.5' : 'px-3.5'
          } py-2.5 text-text-main font-sans text-body-md placeholder:text-text-secondary/50 transition-colors hover:border-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-text-main/20 ${
            warning
              ? 'border-warning-main focus:border-warning-main focus:ring-warning-main/20'
              : 'border-surface-border focus:border-text-main'
          }`}
        />
      </div>
      {warning && (
        <p className="inline-flex items-start gap-1.5 text-body-sm text-warning leading-snug">
          <Warning size={14} weight="fill" className="mt-0.5 shrink-0" />
          <span>{warning}</span>
        </p>
      )}
      {hint && !warning && (
        <p className="text-body-sm text-text-secondary/80 leading-snug">
          {hint}
        </p>
      )}
    </div>
  )
}

function Textarea({
  label,
  hint,
  ...props
}: {
  label: string
  hint?: string
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const autoId = useId()
  const id = props.id ?? autoId
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-body-sm font-medium text-text-secondary"
      >
        {label}
      </label>
      <textarea
        id={id}
        {...props}
        className="w-full bg-transparent border border-surface-border rounded-md px-3.5 py-3 text-text-main font-sans text-body-md placeholder:text-text-secondary/50 transition-colors hover:border-text-secondary/60 focus:outline-none focus:border-text-main focus:ring-2 focus:ring-text-main/20 resize-y leading-relaxed"
      />
      {hint && (
        <p className="text-body-sm text-text-secondary/80 leading-snug">
          {hint}
        </p>
      )}
    </div>
  )
}

function Select({
  label,
  hint,
  options,
  ...props
}: {
  label: string
  hint?: string
  options: { value: string; label: string }[]
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const autoId = useId()
  const id = props.id ?? autoId
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-body-sm font-medium text-text-secondary"
      >
        {label}
      </label>
      <select
        id={id}
        {...props}
        className="w-full bg-transparent border border-surface-border rounded-md px-3.5 py-2.5 text-text-main font-sans text-body-md transition-colors hover:border-text-secondary/60 focus:outline-none focus:border-text-main focus:ring-2 focus:ring-text-main/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && (
        <p className="text-body-sm text-text-secondary/80 leading-snug">
          {hint}
        </p>
      )}
    </div>
  )
}
