"use client"

import { useId, useState, useTransition } from 'react'
import Link from 'next/link'
import { Trash, ArrowLeft, Plus, Translate, Warning } from '@phosphor-icons/react'
import type { Service, Translatable } from '@/types/database'

type Locale = 'ca' | 'en' | 'es'

function localeValue(field: unknown, locale: Locale): string {
  if (typeof field === 'object' && field !== null) {
    return (field as Translatable)[locale] ?? ''
  }
  if (typeof field === 'string' && locale === 'ca') return field
  return ''
}

/** Els tres productes del catàleg. Coincideixen amb ProductId de pricing.ts. */
const PRODUCT_LABEL: Record<string, string> = {
  web: 'Web',
  landing: 'Landing',
  auditoria: 'Auditoria UI/UX',
}

interface Props {
  service: Service
  onSubmit: (formData: FormData) => Promise<void>
}

/**
 * Editor d'un dels tres productes del catàleg.
 *
 * No és un CRUD: els productes són fixos (`product_id` amb check constraint a
 * web · landing · auditoria) perquè cada un té la seva ruta i els seus preus a
 * codi. Aquí s'edita NOMÉS el copy; el preu surt de src/lib/pricing.ts.
 */
export default function ServiceForm({ service, onSubmit }: Props) {
  const [isPending, startTransition] = useTransition()
  const [activeLocale, setActiveLocale] = useState<Locale>('ca')
  const [error, setError] = useState<string | null>(null)

  const productId = service.product_id ?? ''
  const productName = PRODUCT_LABEL[productId] ?? productId

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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full max-w-4xl">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 sticky top-0 -mx-4 px-4 py-3 bg-surface-base/90 backdrop-blur-md border-b border-border-subtle z-10">
        <Link
          href="/admin/serveis"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors text-body-xs-light md:text-body-s-light"
        >
          <ArrowLeft size={16} weight="regular" />
          Tornar a serveis
        </Link>

        <PrimaryAction isPending={isPending} />
      </div>

      {/* Header */}
      <header className="flex flex-col gap-2">
        <span className="text-label text-text-secondary">
          Producte · {productName}
        </span>
        <h2 className="text-display-2xs-medium lg:text-display-xs-medium text-text-main">Contingut del producte</h2>
        <p className="text-body-xs-light md:text-body-s-light text-text-secondary max-w-prose">
          El copy que surt a la card de /serveis i a la seva pàgina de detall. El
          preu no s&apos;edita aquí: el calcula el catàleg de codi a partir dels
          esglaons del pla de preus.
        </p>
      </header>

      {error && <ErrorBanner message={error} />}

      {/* Metadades */}
      <Card
        eyebrow="Producte"
        title="Identificació i visibilitat"
        description="El producte i la seva ruta són fixos. Aquí decideixes si es veu i amb quina etiqueta de preu."
      >
        <Row>
          <Col span={6}>
            <ReadOnlyValue label="Producte" value={productName} hint={`product_id: ${productId}`} />
          </Col>
          <Col span={6}>
            <ReadOnlyValue
              label="Ruta pública"
              value={`/serveis/${productId}`}
              hint="Ve del producte, no d'un slug editable."
            />
          </Col>
        </Row>

        <Select
          label="Etiqueta de preu"
          hint="Va sobre la xifra a la card. Només en català: la web pública no té altres idiomes actius."
          name="price_label_ca"
          defaultValue={localeValue(service.price_label, 'ca') || 'DES DE'}
          options={['DES DE', 'PREU TANCAT']}
        />

        <Checkbox
          label="Publicat"
          description="Visible a /serveis. Si el desactives, el producte desapareix del hub, la seva pàgina fa 404 i surt del sitemap."
          name="is_published"
          defaultChecked={service.is_published ?? false}
        />
      </Card>

      <LocaleSwitcher active={activeLocale} onChange={setActiveLocale} />

      {/* i18n cards */}
      {(['ca', 'en', 'es'] as const).map((locale) => (
        <Card
          key={locale}
          eyebrow={`Contingut · ${locale.toUpperCase()}`}
          title="Nom, descripció i enllaç"
          description={
            locale === 'ca'
              ? 'Català: és el que es publica avui. El títol és obligatori.'
              : 'Traducció opcional. Si està buida, es mostra la versió en català.'
          }
          hidden={activeLocale !== locale}
        >
          <Field
            label="Nom del producte"
            hint="Titular de la card i del hero de la pàgina de detall."
            type="text"
            name={`title_${locale}`}
            required={locale === 'ca'}
            placeholder="Web"
            defaultValue={localeValue(service.title, locale)}
          />

          <Textarea
            label="Descripció curta"
            hint="Dues línies sota l’abast, a la card."
            name={`short_description_${locale}`}
            rows={3}
            defaultValue={localeValue(service.short_description, locale)}
          />

          <Field
            label="Text de l’enllaç"
            hint="El CTA de la card, p. ex. 'Mira el detall'."
            type="text"
            name={`cta_${locale}`}
            placeholder="Mira el detall"
            defaultValue={localeValue(service.cta, locale)}
          />
        </Card>
      ))}

      {/* Què inclou */}
      <Card
        eyebrow="Contingut · Què inclou"
        title="Tot el que entra a la base"
        description="Les línies de la llista, en ordre. Es mostren a la card i a la pàgina de detall de web i landing. L’auditoria té la seva llista detallada a codi. Els camps segueixen l’idioma seleccionat a dalt, però es desen tots tres."
      >
        <IncludesEditor defaultValue={service.includes} locale={activeLocale} />
      </Card>

      <div className="flex items-center justify-end gap-3 pt-2">
        <PrimaryAction isPending={isPending} />
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/*  Includes sub-editor                                                */
/* ------------------------------------------------------------------ */

type I18nDraft = { ca: string; en: string; es: string }

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

function parseInitialIncludes(value: unknown): I18nDraft[] {
  if (!Array.isArray(value)) return []
  return value.map(toI18nDraft)
}

function pickI18n(v: I18nDraft): Record<string, string> | null {
  const o: Record<string, string> = {}
  if (v.ca.trim()) o.ca = v.ca.trim()
  if (v.en.trim()) o.en = v.en.trim()
  if (v.es.trim()) o.es = v.es.trim()
  return Object.keys(o).length ? o : null
}

/**
 * Editor de la llista "què inclou". Manté els 3 idiomes en estat i serialitza
 * l'array sencer a un únic <input hidden name="includes"> en JSON, que el
 * server action parseja. Mateix patró que tenia l'editor de fites de pagament.
 *
 * La forma desada és [{ca,en,es}, ...]: `flattenI18n` la deixa en string[] al
 * costat públic.
 */
function IncludesEditor({
  defaultValue,
  locale,
}: {
  defaultValue: unknown
  locale: Locale
}) {
  const [items, setItems] = useState<I18nDraft[]>(() => parseInitialIncludes(defaultValue))

  const setLine = (i: number, val: string) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [locale]: val } : it)))
  const add = () => setItems((prev) => [...prev, emptyI18n()])
  const remove = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))
  const move = (i: number, dir: -1 | 1) =>
    setItems((prev) => {
      const next = [...prev]
      const target = i + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[i], next[target]] = [next[target], next[i]]
      return next
    })

  const serialized = JSON.stringify(
    items.map(pickI18n).filter((o): o is Record<string, string> => o !== null),
  )

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="includes" value={serialized} />

      {items.length === 0 && (
        <p className="text-body-xs-light md:text-body-s-light text-text-secondary leading-snug">
          Sense línies. Mentre la llista estigui buida, la web mostra la del
          catàleg de codi.
        </p>
      )}

      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3">
          <span className="w-8 shrink-0 pt-3 text-caption uppercase tabular-nums text-text-secondary">
            {String(i + 1).padStart(2, '0')}
          </span>

          <div className="flex-1">
            <Field
              label={`Línia ${i + 1} (${locale.toUpperCase()})`}
              type="text"
              placeholder="5 pàgines: inici, qui som, serveis, contacte i legals"
              value={item[locale]}
              onChange={(e) => setLine(i, e.target.value)}
            />
          </div>

          <div className="flex shrink-0 items-center gap-1 pt-3">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label={`Puja la línia ${i + 1}`}
              className="px-2 py-1 text-body-xs-light md:text-body-s-light text-text-secondary hover:text-text-main transition-colors disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === items.length - 1}
              aria-label={`Baixa la línia ${i + 1}`}
              className="px-2 py-1 text-body-xs-light md:text-body-s-light text-text-secondary hover:text-text-main transition-colors disabled:opacity-30"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Treu la línia ${i + 1}`}
              className="px-2 py-1 text-text-secondary hover:text-error transition-colors"
            >
              <Trash size={14} weight="regular" />
            </button>
          </div>
        </div>
      ))}

      <div>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-2 px-4 py-2 border border-border-default rounded-full text-body-xs-light md:text-body-s-light text-text-main hover:border-text-main transition-colors"
        >
          <Plus size={16} weight="regular" />
          Afegir línia
        </button>
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
      className={`flex flex-col gap-6 rounded-[var(--radius-base)] border border-border-subtle bg-surface-card p-5 md:p-7 ${
        hidden ? 'hidden' : ''
      }`}
    >
      <legend className="contents">
        <div className="flex flex-col gap-1">
          <span className="text-label text-text-secondary">
            {eyebrow}
          </span>
          {title && <h3 className="text-body-m-light md:text-body-xl-light lg:text-body-2xl-light text-text-main">{title}</h3>}
          {description && (
            <p className="text-body-xs-light md:text-body-s-light text-text-secondary max-w-prose">{description}</p>
          )}
        </div>
      </legend>
      <div className="flex flex-col gap-6">{children}</div>
    </fieldset>
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

function PrimaryAction({ isPending }: { isPending: boolean }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-text-main text-text-main-inverse rounded-full font-sans font-medium text-body-s md:text-body-m lg:text-body-l hover:bg-accent hover:text-text-main transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {isPending ? 'Desant…' : 'Desa els canvis'}
    </button>
  )
}

/** Valor que no s'edita: el producte i la seva ruta els fixa el codi. */
function ReadOnlyValue({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-body-xs-light md:text-body-s-light font-medium text-text-main">{label}</span>
      <span className="rounded-md border border-border-subtle bg-surface-card/40 px-3 py-2.5 text-body-s md:text-body-m lg:text-body-l text-text-secondary">
        {value || '—'}
      </span>
      {hint && <span className="text-caption text-text-secondary">{hint}</span>}
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
  options: readonly string[]
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const autoId = useId()
  const id = props.id ?? autoId
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-body-xs-light md:text-body-s-light font-medium text-text-main">
        {label}
      </label>
      <select
        {...props}
        id={id}
        className="rounded-md border border-border-default bg-surface-base px-3 py-2.5 text-body-s md:text-body-m lg:text-body-l text-text-main focus:border-text-main focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {hint && <span className="text-caption text-text-secondary">{hint}</span>}
    </div>
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
    <div className="flex items-center gap-2 text-body-xs-light md:text-body-s-light">
      <span className="inline-flex items-center gap-2 text-text-secondary mr-1">
        <Translate size={16} weight="regular" />
        Idioma
      </span>
      <div
        role="tablist"
        aria-label="Idioma"
        className="inline-flex items-center gap-1 p-1 rounded-full border border-border-subtle bg-surface-card"
      >
        {(['ca', 'en', 'es'] as const).map((l) => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={active === l}
            onClick={() => onChange(l)}
            className={`px-3 py-1 rounded-full uppercase tracking-wider text-body-xs-light md:text-body-s-light transition-colors ${
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
      className="flex items-start gap-3 p-4 border border-error/40 rounded-[var(--radius-base)] bg-error-surface text-error text-body-xs-light md:text-body-s-light"
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
      <label htmlFor={id} className="inline-flex items-center gap-1 text-body-xs-light md:text-body-s-light font-medium text-text-secondary">
        {label}
        {required && <span className="text-error">*</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-describedby={[hintId, errId].filter(Boolean).join(' ') || undefined}
        aria-invalid={Boolean(error) || undefined}
        {...props}
        className={`w-full bg-transparent border rounded-md px-3.5 py-2.5 text-text-main font-sans text-body-s md:text-body-m lg:text-body-l placeholder:text-text-secondary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-text-main/20 hover:border-border-strong ${
          error ? 'border-error focus:border-error focus:ring-error/20' : 'border-border-default focus:border-text-main'
        }`}
      />
      {hint && !error && (
        <p id={hintId} className="text-body-xs-light md:text-body-s-light text-text-secondary/80 leading-snug">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="text-body-xs-light md:text-body-s-light text-error leading-snug">
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
      <label htmlFor={id} className="text-body-xs-light md:text-body-s-light font-medium text-text-secondary">
        {label}
      </label>
      <textarea
        id={id}
        aria-describedby={hintId}
        {...props}
        className="w-full bg-transparent border border-border-default rounded-md px-3.5 py-3 text-text-main font-sans text-body-s md:text-body-m lg:text-body-l placeholder:text-text-secondary/50 transition-colors hover:border-border-strong focus:outline-none focus:border-text-main focus:ring-2 focus:ring-text-main/20 resize-y leading-relaxed"
      />
      {hint && (
        <p id={hintId} className="text-body-xs-light md:text-body-s-light text-text-secondary/80 leading-snug">
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
        <span className="text-body-s md:text-body-m lg:text-body-l text-text-main group-hover:text-text-main">{label}</span>
        {description && (
          <span className="text-body-xs-light md:text-body-s-light text-text-secondary leading-snug">{description}</span>
        )}
      </span>
    </label>
  )
}
