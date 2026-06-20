"use client"

import { useId, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Trash,
  FloppyDisk,
  ArrowLeft,
  Warning,
  Translate,
  CircleNotch,
  Plus,
} from '@phosphor-icons/react'
import ImageUploadField from './ImageUploadField'
import { useConfirm } from './useConfirm'
import type { Service, Translatable } from '@/types/database'

type Locale = 'ca' | 'en' | 'es'

function localeValue(field: unknown, locale: Locale): string {
  if (typeof field === 'object' && field !== null) {
    return (field as Translatable)[locale] ?? ''
  }
  if (typeof field === 'string' && locale === 'ca') return field
  return ''
}

interface Props {
  mode: 'create' | 'edit'
  service?: Service
  onSubmit: (formData: FormData) => Promise<void>
  onDelete?: () => Promise<void>
}

export default function ServiceForm({ mode, service, onSubmit, onDelete }: Props) {
  const [isPending, startTransition] = useTransition()
  const [activeLocale, setActiveLocale] = useState<Locale>('ca')
  const [error, setError] = useState<string | null>(null)

  const isEdit = mode === 'edit'

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await onSubmit(formData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconegut')
      }
    })
  }

  const { confirm: confirmModal, dialog: confirmDialog } = useConfirm()

  const handleDelete = async () => {
    if (!onDelete) return
    const ok = await confirmModal({
      title: 'Eliminar servei',
      message:
        "El servei s'eliminarà del llistat /serveis i del modal de detall. L'acció no es pot desfer.",
      confirmLabel: 'Eliminar',
      danger: true,
    })
    if (!ok) return
    startTransition(async () => {
      try {
        await onDelete()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconegut')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full max-w-4xl">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 sticky top-0 -mx-4 px-4 py-3 bg-surface-base/90 backdrop-blur-md border-b border-surface-border z-10">
        <Link
          href="/admin/serveis"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors text-body-sm"
        >
          <ArrowLeft size={16} weight="regular" />
          Tornar a serveis
        </Link>

        <div className="flex items-center gap-2">
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
          <PrimaryAction isPending={isPending} isEdit={isEdit} />
        </div>
      </div>

      {/* Header */}
      <header className="flex flex-col gap-2">
        <span className="font-sans uppercase tracking-[0.15em] text-body-sm text-text-secondary">
          {isEdit ? 'Servei · Edició' : 'Servei · Nou'}
        </span>
        <h2 className="text-heading-h3 text-text-main">
          {isEdit ? 'Detalls del servei' : 'Crea un servei nou'}
        </h2>
        <p className="text-body-sm text-text-secondary max-w-prose">
          {isEdit
            ? 'Edita la informació del servei. Es propaga a /serveis i al modal de detall.'
            : 'Comença amb les dades mínimes (CA). Després podràs afegir el contingut narratiu i traduccions.'}
        </p>
      </header>

      {error && <ErrorBanner message={error} />}

      {isEdit && <LocaleSwitcher active={activeLocale} onChange={setActiveLocale} />}

      {/* Metadades */}
      <Card
        eyebrow="Metadades"
        title="Identificació i visibilitat"
        description="Icon de Phosphor, preu de referència i estat de publicació."
      >
        <Row>
          <Col span={6}>
            <Field
              label="Icon (Phosphor)"
              hint="Nom exacte d'un icon de Phosphor — p. ex. DeviceMobile, Cube, Browsers."
              type="text"
              name="icon_name"
              required
              placeholder="DeviceMobile"
              defaultValue={service?.icon_name || ''}
            />
          </Col>
          <Col span={6}>
            <Field
              label="Preu des de (€)"
              hint="Numèric, sense símbol. Es mostra com a 'des de X €'."
              type="number"
              name="price_starts_at"
              step="1"
              min="0"
              placeholder="2500"
              defaultValue={service?.price_starts_at?.toString() || ''}
            />
          </Col>
        </Row>

        <ImageUploadField
          label="Imatge representativa"
          hint="Apareix a la card del llistat /serveis. Pots arrossegar un fitxer o enganxar una URL externa."
          name="image_url"
          folder="services"
          defaultValue={service?.image_url || ''}
        />

        <Checkbox
          label="Publicat"
          description="Visible a /serveis. Desactiva per ocultar-lo sense esborrar."
          name="is_published"
          defaultChecked={service?.is_published ?? false}
        />
      </Card>

      {/* Fites de pagament (sub-editor estructurat) */}
      {isEdit && (
        <Card
          eyebrow="Preu · Fites de pagament"
          title="Fites de pagament"
          description="Defineix com es reparteix el pagament del servei. Si no n'hi ha cap, el modal mostra el 50/50 per defecte (Kickoff / Lliurament final). Els títols i notes segueixen l'idioma seleccionat a dalt."
        >
          <MilestonesEditor
            defaultValue={service?.payment_milestones}
            locale={activeLocale}
          />
        </Card>
      )}

      {/* i18n cards */}
      {(isEdit ? (['ca', 'en', 'es'] as const) : (['ca'] as const)).map((locale) => (
        <Card
          key={locale}
          eyebrow={`Contingut · ${locale.toUpperCase()}`}
          title="Resum i detalls bàsics"
          description={
            locale === 'ca'
              ? 'Camps obligatoris per a la versió en català (idioma per defecte).'
              : 'Traducció opcional. Si està buit, es mostrarà la versió en català.'
          }
          hidden={isEdit && activeLocale !== locale}
        >
          <Row>
            <Col span={6}>
              <Field
                label="Títol"
                type="text"
                name={`title_${locale}`}
                required={locale === 'ca'}
                defaultValue={localeValue(service?.title, locale)}
              />
            </Col>
            <Col span={6}>
              <Field
                label="Slug (URL)"
                hint="Identificador a /serveis."
                type="text"
                name={`slug_${locale}`}
                required={locale === 'ca'}
                placeholder="mobile-app-design"
                defaultValue={localeValue(service?.slug, locale)}
              />
            </Col>
          </Row>

          <Textarea
            label="Descripció curta"
            hint="Apareix a la card del llistat i com a intro al modal."
            name={`short_description_${locale}`}
            rows={3}
            defaultValue={localeValue(service?.short_description, locale)}
          />

          <Row>
            <Col span={6}>
              <Field
                label="Durada"
                type="text"
                name={`duration_${locale}`}
                placeholder="4–6 setmanes"
                defaultValue={localeValue(service?.duration, locale)}
              />
            </Col>
            <Col span={6}>
              <Field
                label="Revisions incloses"
                type="text"
                name={`revisions_${locale}`}
                placeholder="2 rondes"
                defaultValue={localeValue(service?.revisions, locale)}
              />
            </Col>
          </Row>

          {isEdit && (
            <NarrativeGroup>
              <Textarea
                label="Sobre aquest servei"
                hint="Què és, per qui i quin valor aporta."
                name={`content_about_${locale}`}
                rows={5}
                placeholder="Explica de què tracta aquest servei i quin valor aporta..."
                defaultValue={localeValue(service?.content_about, locale)}
              />
              <Textarea
                label="El nostre pla, pas a pas"
                hint="Procés del servei: descobriment, disseny, validació, lliurament."
                name={`content_steps_${locale}`}
                rows={6}
                placeholder="Descripció del procés (descobriment, disseny, validació, lliurament...)."
                defaultValue={localeValue(service?.content_steps, locale)}
              />
              <Textarea
                label="Principals lliuraments"
                hint="Què s'emporta el client al final."
                name={`content_deliverables_${locale}`}
                rows={5}
                placeholder="Figma file, design system, prototip..."
                defaultValue={localeValue(service?.content_deliverables, locale)}
              />
              <Textarea
                label="Per què triar aquesta oferta"
                hint="Diferenciadors, beneficis tangibles, garanties."
                name={`content_why_us_${locale}`}
                rows={5}
                placeholder="Què et fa diferent d'altres oferents..."
                defaultValue={localeValue(service?.content_why_us, locale)}
              />
            </NarrativeGroup>
          )}
        </Card>
      ))}

      <div className="flex items-center justify-end gap-3 pt-2">
        <PrimaryAction isPending={isPending} isEdit={isEdit} />
      </div>

      {/* Modal de confirmació (delete service). */}
      {confirmDialog}
    </form>
  )
}

/* ------------------------------------------------------------------ */
/*  Milestones sub-editor                                              */
/* ------------------------------------------------------------------ */

type I18nDraft = { ca: string; en: string; es: string }
type MilestoneDraft = { percent: string; title: I18nDraft; meta: I18nDraft }

const emptyI18n = (): I18nDraft => ({ ca: '', en: '', es: '' })

function toI18nDraft(field: unknown): I18nDraft {
  if (typeof field === 'string') return { ca: field, en: '', es: '' }
  if (field && typeof field === 'object') {
    const o = field as Record<string, unknown>
    return {
      ca: typeof o.ca === 'string' ? o.ca : '',
      en: typeof o.en === 'string' ? o.en : '',
      es: typeof o.es === 'string' ? o.es : '',
    }
  }
  return emptyI18n()
}

function parseInitialMilestones(value: unknown): MilestoneDraft[] {
  if (!Array.isArray(value)) return []
  return value.map((m) => {
    const obj = (m ?? {}) as Record<string, unknown>
    return {
      percent: typeof obj.percent === 'number' ? String(obj.percent) : '',
      title: toI18nDraft(obj.title),
      meta: toI18nDraft(obj.meta),
    }
  })
}

function pickI18n(v: I18nDraft): Record<string, string> | null {
  const o: Record<string, string> = {}
  if (v.ca.trim()) o.ca = v.ca.trim()
  if (v.en.trim()) o.en = v.en.trim()
  if (v.es.trim()) o.es = v.es.trim()
  return Object.keys(o).length ? o : null
}

function hasAnyContent(m: MilestoneDraft): boolean {
  return (
    m.percent.trim() !== '' ||
    Boolean(m.title.ca || m.title.en || m.title.es) ||
    Boolean(m.meta.ca || m.meta.en || m.meta.es)
  )
}

/**
 * Editor estructurat de fites de pagament. Manté els 3 idiomes en estat i
 * serialitza tot l'array a un únic <input hidden name="payment_milestones">
 * en JSON, que el server action parseja. Els camps de text mostren l'idioma
 * actiu (`locale`) però es desen tots tres.
 */
function MilestonesEditor({
  defaultValue,
  locale,
}: {
  defaultValue: unknown
  locale: Locale
}) {
  const [items, setItems] = useState<MilestoneDraft[]>(() =>
    parseInitialMilestones(defaultValue),
  )

  const setPercent = (i: number, val: string) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, percent: val } : it)))
  const setField = (i: number, field: 'title' | 'meta', val: string) =>
    setItems((prev) =>
      prev.map((it, idx) =>
        idx === i ? { ...it, [field]: { ...it[field], [locale]: val } } : it,
      ),
    )
  const add = () =>
    setItems((prev) => [...prev, { percent: '', title: emptyI18n(), meta: emptyI18n() }])
  const remove = (i: number) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i))

  const serialized = JSON.stringify(
    items.filter(hasAnyContent).map((m) => ({
      percent: m.percent.trim() === '' ? null : Number(m.percent),
      title: pickI18n(m.title),
      meta: pickI18n(m.meta),
    })),
  )

  const total = items.reduce(
    (sum, m) => sum + (m.percent.trim() === '' ? 0 : Number(m.percent) || 0),
    0,
  )

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="payment_milestones" value={serialized} />

      {items.length === 0 && (
        <p className="text-body-sm text-text-secondary leading-snug">
          Sense fites personalitzades. El modal mostrarà el 50/50 per defecte
          (Kickoff a la signatura · Lliurament final al handoff) mentre el servei
          tingui preu.
        </p>
      )}

      {items.map((m, i) => (
        <div
          key={i}
          className="flex flex-col gap-4 rounded-md border border-surface-border p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-medium text-text-secondary">
              Fita {i + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-error transition-colors"
            >
              <Trash size={14} weight="regular" />
              Treure
            </button>
          </div>

          <Row>
            <Col span={3}>
              <Field
                label="% del total"
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="50"
                value={m.percent}
                onChange={(e) => setPercent(i, e.target.value)}
              />
            </Col>
          </Row>

          <Row>
            <Col span={6}>
              <Field
                label={`Títol (${locale.toUpperCase()})`}
                type="text"
                placeholder="Kickoff"
                value={m.title[locale]}
                onChange={(e) => setField(i, 'title', e.target.value)}
              />
            </Col>
            <Col span={6}>
              <Field
                label={`Nota (${locale.toUpperCase()})`}
                hint="Text secundari, p. ex. 'A la signatura'."
                type="text"
                placeholder="A la signatura"
                value={m.meta[locale]}
                onChange={(e) => setField(i, 'meta', e.target.value)}
              />
            </Col>
          </Row>
        </div>
      ))}

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-2 px-4 py-2 border border-surface-border rounded-full text-body-sm text-text-main hover:border-text-main transition-colors"
        >
          <Plus size={16} weight="regular" />
          Afegir fita
        </button>

        {items.length > 0 && (
          <span
            className={`text-body-sm tabular-nums ${
              total === 100 ? 'text-text-secondary' : 'text-error'
            }`}
          >
            Total: {total}%{total !== 100 ? ' (hauria de sumar 100%)' : ''}
          </span>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Layout primitives                                                  */
/* ------------------------------------------------------------------ */

function Card({
  eyebrow,
  title,
  description,
  children,
  hidden,
}: {
  eyebrow: string
  title?: string
  description?: string
  children: React.ReactNode
  hidden?: boolean
}) {
  return (
    <fieldset
      className={`flex flex-col gap-6 rounded-[var(--radius-base)] border border-surface-border bg-surface-card p-5 md:p-7 ${
        hidden ? 'hidden' : ''
      }`}
    >
      <legend className="contents">
        <div className="flex flex-col gap-1">
          <span className="font-sans uppercase tracking-[0.15em] text-body-sm text-text-secondary">
            {eyebrow}
          </span>
          {title && <h3 className="text-body-xl text-text-main">{title}</h3>}
          {description && (
            <p className="text-body-sm text-text-secondary max-w-prose">{description}</p>
          )}
        </div>
      </legend>
      <div className="flex flex-col gap-6">{children}</div>
    </fieldset>
  )
}

function NarrativeGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5 pt-4 mt-2 border-t border-surface-border">
      <div className="flex flex-col gap-1">
        <span className="font-sans uppercase tracking-[0.15em] text-body-sm text-text-secondary">
          Contingut narratiu
        </span>
        <p className="text-body-sm text-text-secondary max-w-prose">
          Aquests textos es renderitzen com a paràgrafs dins del modal del servei.
        </p>
      </div>
      {children}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">{children}</div>
}

function Col({ span = 12, children }: { span?: 3 | 4 | 6 | 8 | 12; children: React.ReactNode }) {
  const cls = {
    3: 'md:col-span-3',
    4: 'md:col-span-4',
    6: 'md:col-span-6',
    8: 'md:col-span-8',
    12: 'md:col-span-12',
  }[span]
  return <div className={cls}>{children}</div>
}

/* ------------------------------------------------------------------ */
/*  Action / banner primitives                                         */
/* ------------------------------------------------------------------ */

function PrimaryAction({ isPending, isEdit }: { isPending: boolean; isEdit: boolean }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="inline-flex items-center gap-2 px-5 py-2 bg-text-main text-text-main-inverse rounded-full font-sans font-medium text-body-md hover:bg-accent hover:text-text-main transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <CircleNotch size={16} weight="regular" className="animate-spin" />
      ) : (
        <FloppyDisk size={16} weight="regular" />
      )}
      {isPending ? 'Desant…' : isEdit ? 'Desar canvis' : 'Crear servei'}
    </button>
  )
}

function LocaleSwitcher({
  active,
  onChange,
}: {
  active: Locale
  onChange: (l: Locale) => void
}) {
  return (
    <div className="flex items-center gap-2 text-body-sm">
      <span className="inline-flex items-center gap-2 text-text-secondary mr-1">
        <Translate size={16} weight="regular" />
        Idioma
      </span>
      <div
        role="tablist"
        aria-label="Idioma"
        className="inline-flex items-center gap-1 p-1 rounded-full border border-surface-border bg-surface-card"
      >
        {(['ca', 'en', 'es'] as const).map((l) => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={active === l}
            onClick={() => onChange(l)}
            className={`px-3 py-1 rounded-full uppercase tracking-wider text-body-sm transition-colors ${
              active === l
                ? 'bg-text-main text-text-main-inverse'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 p-4 border border-error/40 rounded-[var(--radius-base)] bg-error-surface text-error text-body-sm"
    >
      <Warning size={18} weight="fill" className="flex-shrink-0 mt-0.5" />
      <div className="flex flex-col gap-1">
        <span className="font-medium">No s&apos;ha pogut desar</span>
        <span className="text-text-main">{message}</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Form primitives                                                    */
/* ------------------------------------------------------------------ */

function Field({
  label,
  hint,
  error,
  required,
  ...props
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const autoId = useId()
  const id = props.id ?? autoId
  const hintId = hint ? `${id}-hint` : undefined
  const errId = error ? `${id}-err` : undefined
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="inline-flex items-center gap-1 text-body-sm font-medium text-text-secondary">
        {label}
        {required && <span className="text-error">*</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-describedby={[hintId, errId].filter(Boolean).join(' ') || undefined}
        aria-invalid={Boolean(error) || undefined}
        {...props}
        className={`w-full bg-transparent border rounded-md px-3.5 py-2.5 text-text-main font-sans text-body-md placeholder:text-text-secondary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-text-main/20 hover:border-text-secondary/60 ${
          error ? 'border-error focus:border-error focus:ring-error/20' : 'border-surface-border focus:border-text-main'
        }`}
      />
      {hint && !error && (
        <p id={hintId} className="text-body-sm text-text-secondary/80 leading-snug">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="text-body-sm text-error leading-snug">
          {error}
        </p>
      )}
    </div>
  )
}

function Textarea({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const autoId = useId()
  const id = props.id ?? autoId
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-body-sm font-medium text-text-secondary">
        {label}
      </label>
      <textarea
        id={id}
        aria-describedby={hintId}
        {...props}
        className="w-full bg-transparent border border-surface-border rounded-md px-3.5 py-3 text-text-main font-sans text-body-md placeholder:text-text-secondary/50 transition-colors hover:border-text-secondary/60 focus:outline-none focus:border-text-main focus:ring-2 focus:ring-text-main/20 resize-y leading-relaxed"
      />
      {hint && (
        <p id={hintId} className="text-body-sm text-text-secondary/80 leading-snug">
          {hint}
        </p>
      )}
    </div>
  )
}

function Checkbox({
  label,
  description,
  ...props
}: { label: string; description?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="inline-flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        {...props}
        className="w-4 h-4 mt-0.5 accent-[var(--accent-main)] cursor-pointer"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-body-md text-text-main group-hover:text-text-main">{label}</span>
        {description && (
          <span className="text-body-sm text-text-secondary leading-snug">{description}</span>
        )}
      </span>
    </label>
  )
}
