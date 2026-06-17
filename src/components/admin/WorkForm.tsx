"use client"

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Trash,
  FloppyDisk,
  ArrowLeft,
  Warning,
  Translate,
  CircleNotch,
  Eye,
  EyeSlash,
  ArrowSquareOut,
  CloudCheck,
  X,
  CaretDown,
  Star,
  Desktop,
  DeviceTablet,
  DeviceMobile,
} from '@phosphor-icons/react'
import {
  ContentEditorProvider,
  BlocksUIProvider,
  BlocksToolbar,
  HeroSection,
  BlocksSection,
  FinalMediaSection,
} from './WorkContentEditor'
import ImageUploadField from './ImageUploadField'
import RichTextEditor from './RichTextEditor'
import ColorField from './ColorField'
import KebabMenu from './KebabMenu'
import TaxonomyCombobox, { type TaxonomyOption } from './TaxonomyCombobox'
import { useConfirm } from './useConfirm'
import {
  createWorkRole,
  updateWorkRole,
  deleteWorkRole,
  createWorkCategory,
  updateWorkCategory,
  deleteWorkCategory,
} from '@/app/admin/works/taxonomy-actions'
import { DRAFT_PLACEHOLDER_TITLE, DRAFT_SLUG_PREFIX, isFreshDraft, slugify } from '@/lib/work-defaults'
import type { Work, Translatable, WorkRole, WorkCategory } from '@/types/database'

type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

/**
 * <WorkForm />
 * Formulari reutilitzat per /admin/works/new i /admin/works/[id].
 *
 * Props:
 * - mode: 'create' | 'edit'
 * - work: dada inicial (undefined en mode create)
 * - actions: server actions injectades pel parent (per evitar import directe
 *   d'actions a un client component sense bundle de cookies)
 */

type Locale = 'ca' | 'en' | 'es'

function localeValue(field: unknown, locale: Locale): string {
  if (typeof field === 'object' && field !== null) {
    return (field as Translatable)[locale] ?? ''
  }
  if (typeof field === 'string' && locale === 'ca') return field
  return ''
}

/**
 * Mínim subset d'un Client que necessitem per pintar el selector. Mantenim
 * l'interface molt acotat perquè el server no hagi d'enviar tot l'objecte
 * (només volem id, nom i empresa per al label del select).
 */
export interface ClientOption {
  id: string
  name: string
  company: string | null
}

interface Props {
  mode: 'create' | 'edit'
  work?: Work
  /** Slugs CA d'altres works (per detectar duplicats sense haver de fer query al client). */
  otherSlugsCa?: string[]
  /** Llista de clients per al selector del work. Si està buit, el selector no apareix. */
  clients?: ClientOption[]
  /** Rols disponibles (taula work_roles). Es passa pel server. */
  roles?: WorkRole[]
  /** Categories disponibles (taula work_categories). Es passa pel server. */
  categories?: WorkCategory[]
  onSubmit: (formData: FormData) => Promise<void>
  onDelete?: () => Promise<void>
}

/** Mapa de comptadors d'avisos per secció — usat pel TOC. */
type SectionWarnings = Partial<
  Record<'metadades' | 'hero' | 'blocs' | 'finalmedia', number>
>

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function validateSlug(slug: string, others: string[]): string | undefined {
  const trimmed = slug.trim()
  if (!trimmed) return undefined
  if (!SLUG_PATTERN.test(trimmed)) {
    return 'Format no vàlid: només minúscules, números i guions (ex. "el-meu-projecte").'
  }
  if (others.includes(trimmed)) {
    return 'Ja hi ha un treball amb aquest slug.'
  }
  return undefined
}

const YEAR_PATTERN = /^\d{4}$/
/** Evaluat al module load — evita Date.now/getFullYear() durant render. */
const MAX_YEAR = new Date().getFullYear() + 1
const MIN_YEAR = 2000

function validateYear(year: string): string | undefined {
  const trimmed = year.trim()
  if (!trimmed) return undefined
  if (!YEAR_PATTERN.test(trimmed)) {
    return 'Format no vàlid: ha de ser un any de 4 dígits (ex. 2024).'
  }
  const n = Number(trimmed)
  if (n < MIN_YEAR || n > MAX_YEAR) {
    return `Fora de rang: l'any ha d'estar entre ${MIN_YEAR} i ${MAX_YEAR}.`
  }
  return undefined
}

export default function WorkForm({
  mode,
  work,
  otherSlugsCa = [],
  clients = [],
  roles = [],
  categories = [],
  onSubmit,
  onDelete,
}: Props) {
  const [activeLocale, setActiveLocale] = useState<Locale>('ca')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [editorWarnings, setEditorWarnings] = useState<SectionWarnings>({})
  const formRef = useRef<HTMLFormElement>(null)
  /**
   * Snapshot serialitzat del darrer FormData desat. Comparem-lo amb el
   * snapshot actual al poll d'autosave per detectar canvis sense haver
   * de cablejar callbacks a cada child component (WorkContentEditor
   * gestiona el seu estat amb reducer, ImageUploadField puja imatges
   * asíncronament, etc.).
   */
  const lastSnapshotRef = useRef<string>('')
  /** Mirror del status en ref per llegir-lo dins l'interval sense re-mountar. */
  const statusRef = useRef<SaveStatus>('idle')

  const isEdit = mode === 'edit'

  // Estat derivat: és un draft acabat de crear amb placeholders?
  // En aquest cas adaptem el copy del header i convertim el títol/slug
  // placeholder a `placeholder` (gris) per no haver d'esborrar manualment.
  const titleCa = localeValue(work?.title, 'ca')
  const slugCa = localeValue(work?.slug, 'ca')
  const fresh = isFreshDraft(work?.title as Translatable, work?.is_published)
  const hasSlugPlaceholder = slugCa.startsWith(DRAFT_SLUG_PREFIX)

  /**
   * `is_published` i `is_featured` són toggles que viuen al top bar:
   *   - Publicat → click al status pill
   *   - Destacat → entrada al kebab menu
   * Mantenim l'estat al component i el persistim al form via hidden
   * inputs perquè l'autosave els envii sense haver de renderitzar
   * checkboxes dins del body.
   */
  const [isPublished, setIsPublished] = useState<boolean>(work?.is_published === true)
  const [isFeatured, setIsFeatured] = useState<boolean>(work?.is_featured === true)

  // Validació de slug en temps real. Llegim el valor actual del DOM (els
  // inputs són uncontrolled), que s'actualitza via handleFormChange.
  const [currentSlugCa, setCurrentSlugCa] = useState<string>(
    hasSlugPlaceholder ? '' : slugCa
  )
  const slugWarning = validateSlug(currentSlugCa, otherSlugsCa)

  // Mateixa idea per al camp `year`: validem format inline mentre escriu.
  const [currentYear, setCurrentYear] = useState<string>(work?.year || '')
  const yearWarning = validateYear(currentYear)

  // Suma d'avisos de Metadades — el TOC ho usa per mostrar el badge groc.
  const metadadesWarnings = (slugWarning ? 1 : 0) + (yearWarning ? 1 : 0)

  /**
   * Auto-slug: l'slug es genera automàticament des del títol mentre l'usuari
   * no l'hagi tocat manualment. Detectem "encara en auto-mode" si:
   *   - L'slug està buit, o
   *   - És un placeholder de draft (nou-treball-xxx), o
   *   - Coincideix amb slugify(títol actual) — útil per re-entrar a un work
   *     que ja venia sincronitzat (el manté auto després de F5).
   *
   * Quan l'usuari escriu un slug diferent del que generaríem nosaltres,
   * sortim de l'auto-mode i ja no toquem més l'slug a canvis de títol.
   */
  const [slugIsAuto, setSlugIsAuto] = useState<boolean>(() => {
    if (!slugCa.trim()) return true
    if (hasSlugPlaceholder) return true
    if (slugCa === slugify(titleCa)) return true
    return false
  })
  /** Darrer slug que el sistema ha escrit automàticament — usat per detectar override manual. */
  const lastAutoSlugRef = useRef<string>(hasSlugPlaceholder ? '' : slugCa)

  /**
   * Live preview lateral. A 2xl+ el botó "Preview" obre un panell lateral
   * amb un iframe que apunta a /works/[slug]?preview=draft. A pantalles
   * més petites manté el comportament d'obrir nova pestanya.
   *
   * El `previewKey` s'incrementa cada vegada que un autosave persisteix
   * — així l'iframe es recarrega per reflectir els canvis acabats de desar.
   * El `previewSrcSlug` separa la URL de l'iframe de l'slug actual: després
   * d'un save, fem snapshot del slug recent perquè reflecteixi el que hi ha
   * realment a la BD (no el que potser estem escrivint ara mateix).
   */
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)

  const togglePreview = () => setPreviewOpen((prev) => !prev)

  /**
   * Tab navigation: només una secció és visible alhora. Reduïm càrrega
   * cognitiva — l'usuari es focalitza en un grup de camps. Els altres
   * cards es renderitzen amb `hidden` perquè el FormData els capturi al
   * desar (autosave inclòs).
   *
   * Default: primera secció (`section-metadades`). En el futur podríem
   * persistir l'última activa per workId a localStorage.
   */
  const [activeSection, setActiveSection] = useState<string>('section-metadades')
  const [previewSrcSlug, setPreviewSrcSlug] = useState<string>(
    hasSlugPlaceholder ? slugCa : slugCa
  )
  useEffect(() => {
    if (status === 'saved') {
      setPreviewSrcSlug(currentSlugCa || slugCa)
      setPreviewKey((k) => k + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])


  const setStatusBoth = useCallback((s: SaveStatus) => {
    statusRef.current = s
    setStatus(s)
  }, [])

  /** Captura el formData actual com a string per comparació. */
  const captureSnapshot = useCallback((): string => {
    if (!formRef.current) return ''
    const fd = new FormData(formRef.current)
    // Excloem fitxers (input type=file) — només importen els valors
    // visibles del form (que sempre passen pels hidden inputs després
    // de la pujada a Storage).
    return JSON.stringify(
      Array.from(fd.entries())
        .filter(([, v]) => typeof v === 'string')
        .sort(([a], [b]) => a.localeCompare(b))
    )
  }, [])

  /** Executa el save (manual o automàtic). Centralitza la lògica. */
  const performSave = useCallback(async () => {
    if (!formRef.current) return
    if (statusRef.current === 'saving') return
    const snapshot = captureSnapshot()
    setStatusBoth('saving')
    setError(null)
    try {
      const fd = new FormData(formRef.current)

      // Fallback intel·ligent: si l'usuari encara no ha posat títol/slug en CA
      // (camps obligatoris al servidor), injectem els valors placeholder del
      // draft per evitar que l'autosave falli mentre encara no han escrit res.
      // Així pots tocar el hero color o pujar una imatge abans d'omplir el
      // títol i tot es desa correctament a la BD.
      if (!String(fd.get('title_ca') || '').trim()) {
        fd.set('title_ca', titleCa || DRAFT_PLACEHOLDER_TITLE)
      }
      if (!String(fd.get('slug_ca') || '').trim()) {
        fd.set(
          'slug_ca',
          slugCa || `${DRAFT_SLUG_PREFIX}${Math.random().toString(36).slice(2, 6)}`
        )
      }

      await onSubmit(fd)
      lastSnapshotRef.current = snapshot
      setLastSavedAt(new Date())
      setStatusBoth('saved')
    } catch (err) {
      setStatusBoth('error')
      setError(err instanceof Error ? err.message : 'Error desconegut')
      // Evitem el bucle: el poll torna a comparar el snapshot a la pròxima
      // iteració, però com que ja l'hem marcat com a "vist", no es repeteix
      // l'intent fins que l'usuari canviï una altra cosa.
      lastSnapshotRef.current = snapshot
    }
  }, [captureSnapshot, onSubmit, setStatusBoth, titleCa, slugCa])

  // Snapshot inicial: el form ja porta els valors actuals de la BD, així
  // que no autosaveem fins que l'usuari toqui alguna cosa.
  useEffect(() => {
    lastSnapshotRef.current = captureSnapshot()
  }, [captureSnapshot])

  // Poll d'autosave cada 2s: si el snapshot ha canviat des de l'últim
  // save i no estem ja desant, dispara performSave.
  useEffect(() => {
    const id = setInterval(() => {
      if (statusRef.current === 'saving') return
      const current = captureSnapshot()
      if (current === lastSnapshotRef.current) return
      void performSave()
    }, 2000)
    return () => clearInterval(id)
  }, [captureSnapshot, performSave])

  /**
   * Handler onChange/onInput del form. Tres responsabilitats:
   *   1. Auto-slug: si l'usuari escriu al títol CA i estem en auto-mode,
   *      regenerem l'slug. Usem el setter natiu del prototype perquè el
   *      canvi quedi reflectit a la DOM (els inputs són uncontrolled).
   *   2. Detectar override manual de l'slug → sortir d'auto-mode.
   *   3. Sincronitzar `currentSlugCa` (per validació) + snapshot d'autosave.
   */
  const handleFormChange = (e?: React.SyntheticEvent<HTMLFormElement>) => {
    const form = formRef.current
    if (!form) return
    const target = e?.target as HTMLInputElement | HTMLTextAreaElement | undefined

    // 1. Auto-slug des del títol CA
    if (target?.name === 'title_ca' && slugIsAuto) {
      const slugInput = form.elements.namedItem('slug_ca') as HTMLInputElement | null
      if (slugInput) {
        const newSlug = slugify(target.value)
        const nativeSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value'
        )?.set
        nativeSetter?.call(slugInput, newSlug)
        lastAutoSlugRef.current = newSlug
      }
    }

    // 2. Override manual de l'slug
    if (
      target?.name === 'slug_ca' &&
      slugIsAuto &&
      target.value !== lastAutoSlugRef.current
    ) {
      setSlugIsAuto(false)
    }

    // 3. Sync valors actuals per a validacions inline (slug + any)
    const slugInput = form.elements.namedItem('slug_ca') as HTMLInputElement | null
    if (slugInput) setCurrentSlugCa(slugInput.value)
    const yearInput = form.elements.namedItem('year') as HTMLInputElement | null
    if (yearInput) setCurrentYear(yearInput.value)

    // 4. Detecció de canvis per l'autosave
    if (statusRef.current === 'saving') return
    const current = captureSnapshot()
    if (current !== lastSnapshotRef.current) {
      setStatusBoth('pending')
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    void performSave()
  }

  const { confirm: confirmModal, dialog: confirmDialog } = useConfirm()

  const handleDelete = async () => {
    if (!onDelete) return
    const ok = await confirmModal(
      fresh
        ? {
            title: 'Descartar esborrany',
            message:
              "Aquest esborrany s'eliminarà definitivament. No s'havia publicat encara.",
            confirmLabel: 'Descartar',
            danger: true,
          }
        : {
            title: 'Eliminar treball',
            message:
              "El treball s'eliminarà del llistat i del públic. L'acció no es pot desfer.",
            confirmLabel: 'Eliminar',
            danger: true,
          }
    )
    if (!ok) return
    setStatusBoth('saving')
    setError(null)
    try {
      await onDelete()
    } catch (err) {
      setStatusBoth('error')
      setError(err instanceof Error ? err.message : 'Error desconegut')
    }
  }

  const isPending = status === 'saving'

  /**
   * Drecera de teclat CMD+S (macOS) / Ctrl+S (Windows/Linux): dispara
   * un save manual immediat sense esperar el poll d'autosave. Preventem
   * el comportament natiu del navegador (que obriria el dialog "Save Page
   * As..."), però només si l'usuari està a aquesta pàgina — el listener
   * es desmunta al cleanup.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void performSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [performSave])

  /**
   * Protecció contra pèrdua de dades: si tens canvis no desats (pending /
   * saving / error) i intentes tancar la pestanya, recarregar o navegar
   * fora del domini, el navegador mostrarà una confirmació nativa.
   *
   * Notes:
   *   - El missatge custom és ignorat per navegadors moderns (mostren un
   *     text genèric per evitar abús), però la simple presència del
   *     listener fa que el prompt aparegui.
   *   - No cobreix la navegació interna via <Link> de Next (no és
   *     `beforeunload`). Per a navegació local, l'autosave hauria d'haver
   *     acabat en pocs segons; si no, el problema és l'autosave, no la
   *     navegació.
   */
  useEffect(() => {
    const hasUnsaved = status === 'pending' || status === 'saving' || status === 'error'
    if (!hasUnsaved || typeof window === 'undefined') return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Cal assignar returnValue per compatibilitat amb navegadors antics
      // (el missatge concret és ignorat avui dia).
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [status])

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onChange={handleFormChange}
      onInput={handleFormChange}
      className="w-full"
    >
    {/* ============ TOP BAR ============
        Sticky a nivell de <form>, fora del layout de tres columnes. Així
        sempre queda visible durant tot el scroll, fins al final de la
        pàgina, perquè el form sencer és el seu containing block i mai
        s'acaba abans del que estàs editant. z-20 perquè quedi a sobre del
        TOC i el preview panel. */}
    {/* Top bar full-width sempre: el back link viu a la vora esquerra
        absoluta del viewport i les accions a la vora dreta. Limitar-ho
        a 1700px deixava un buit lateral lleig en monitors grans. El
        contingut del form per sota ja té el seu propi `max-w-[1700px]`
        per mantenir-se llegible — només el top bar és sense límit. */}
    <div className="sticky top-0 z-20 -mx-6 md:-mx-10 bg-surface-base/90 backdrop-blur-md border-b border-surface-border">
      <div className="flex items-center justify-between gap-4 px-6 md:px-10 py-3">
        <Link
          href="/admin/works"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-main transition-colors text-body-sm"
        >
          <ArrowLeft size={16} weight="regular" />
          Tornar a treballs
        </Link>

        <div className="flex items-center gap-3">
          <AutosaveIndicator status={status} lastSavedAt={lastSavedAt} />

          {/* Status pill abans del Preview — comunica d'un cop d'ull si
              el treball està publicat o és un esborrany. Clicable per
              alternar `is_published` sense haver d'obrir cap menú. */}
          <StatusPill
            isPublished={isPublished}
            onToggle={
              isEdit
                ? () => {
                    setIsPublished((p) => !p)
                    if (statusRef.current !== 'saving') setStatusBoth('pending')
                  }
                : undefined
            }
            disabled={isPending}
          />

          {slugCa && (
            <button
              type="button"
              onClick={togglePreview}
              className={`inline-flex items-center gap-2 px-4 py-2 border rounded-full transition-colors text-body-sm ${
                previewOpen
                  ? 'bg-text-main border-text-main text-text-main-inverse'
                  : 'border-surface-border text-text-main hover:border-text-main'
              }`}
              title="Obre el panell lateral amb el case study tal com es veurà al públic. Pots obrir-lo en una pestanya nova des del header del panell."
            >
              <ArrowSquareOut size={16} weight="regular" />
              {previewOpen ? 'Tancar preview' : 'Preview'}
            </button>
          )}
          <PrimaryAction isPending={isPending} isEdit={isEdit} />

          {/* Kebab menu — accions secundàries/destructives. Patró
              estil Notion: només les accions primàries (Preview, Desar)
              són botons visibles; la resta viu al menú overflow.
              - Destacat: toggle de `is_featured` (icon Star fill/regular)
              - Eliminar/Descartar: acció destructiva (variant danger)
              Futur: aquí entraran "Duplicar", "Veure al públic", etc. */}
          {isEdit && (
            <KebabMenu
              label="Més accions"
              items={[
                {
                  label: isFeatured ? 'Treure de destacats' : 'Marcar com a destacat',
                  icon: <Star size={14} weight={isFeatured ? 'fill' : 'regular'} />,
                  disabled: isPending,
                  onClick: () => {
                    setIsFeatured((p) => !p)
                    if (statusRef.current !== 'saving') setStatusBoth('pending')
                  },
                },
                ...(onDelete
                  ? ([
                      { separator: true } as const,
                      {
                        label: fresh ? 'Descartar esborrany' : 'Eliminar treball',
                        icon: <Trash size={14} weight="regular" />,
                        variant: 'danger' as const,
                        disabled: isPending,
                        onClick: handleDelete,
                      },
                    ])
                  : []),
              ]}
            />
          )}
        </div>
      </div>
    </div>

    {/* Hidden inputs per als toggles del top bar (Publicat / Destacat).
        Substitueixen els checkboxes que abans vivien al body — ara la
        font de veritat és l'estat React i el FormData els llegeix
        d'aquí. Format `on` / cadena buida → la server action compara
        contra `'on'` (igual que un checkbox HTML estàndard). */}
    <input type="hidden" name="is_published" value={isPublished ? 'on' : ''} readOnly />
    <input type="hidden" name="is_featured" value={isFeatured ? 'on' : ''} readOnly />

    {/* Fallback responsive del TOC: pills horitzontals sticky sota el
        top bar. Només visible sota xl (quan el TOC vertical s'amaga).
        Garanteix que l'usuari sempre pot canviar de secció,
        independentment de la mida del viewport. */}
    <TocPills
      isEdit={isEdit}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      warnings={{
        metadades: metadadesWarnings || undefined,
        ...editorWarnings,
      }}
    />

    {/* ============ LAYOUT amb TOC + Form column + Preview panel ============
        max-width condicional segons si tens un panell lateral obert.
        Padding-top per separar del top bar sticky. */}
    <div
      className={`flex items-start gap-6 2xl:gap-8 pt-8 ${
        previewOpen ? 'max-w-none' : 'max-w-[1700px]'
      }`}
    >
      {/* Taula de continguts (només xl+) — controla quina secció es veu */}
      <Toc
        activeLocale={activeLocale}
        isEdit={isEdit}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        warnings={{
          metadades: metadadesWarnings || undefined,
          ...editorWarnings,
        }}
      />

      {/* Columna principal del form.
          ── No hi ha header de pàgina (h2 global): el títol visible
             és el de la secció activa, dins de cada Card.
          ── El locale switcher ha estat mogut al header de cada Card
             (slot `headerRight`), així sempre acompanya la secció activa. */}
      <div className="flex flex-col gap-8 flex-1 min-w-0">

      {error && <ErrorBanner message={error} />}

      {/* ============ CARACTERÍSTIQUES — Card principal d'identificació ============
          Title viu fora del rectangle blanc. Body:
          ── 2-col: imatge LEFT (1:1) | rows de camps RIGHT
          ── Non-i18n + i18n interleaved (només la locale activa visible) */}
      <Card
        id="section-metadades"
        title="Característiques"
        hidden={activeSection !== 'section-metadades'}
        headerRight={isEdit ? <LocaleSwitcher active={activeLocale} onChange={setActiveLocale} work={work} formRef={formRef} /> : undefined}
      >
        {/* Layout Figma 11192:11214 — single-column vertical:
            ── Thumbnail (full width, variant card-info: imatge esquerra +
               File Name + Alt Text + botons d'acció a la dreta)
            ── Divider horitzontal
            ── Field Títol (full width, i18n)
            ── Row Rol + Categoria (2 cols)
            ── Row Client + Any + Accent Color (3 cols)
            Sense separador vertical: el thumbnail és full-width al top,
            els camps van a sota. */}
        <div className="flex flex-col gap-6">
          {/* Thumbnail — variant card-info: la metadata (file name + alt)
              i les 4 accions són visibles directament, sense modal. */}
          <ImageUploadField
            label="Thumbnail"
            required
            variant="card-info"
            name="main_image_url"
            folder="works"
            defaultValue={work?.main_image_url || ''}
            altName="main_image_alt"
            defaultAlt={work?.main_image_alt || ''}
            aspectRatio="1 / 1"
          />

          {/* Divider abans dels camps de text */}
          <div className="h-px bg-surface-border" aria-hidden />

          {/* Títol i18n — només el camp visible per locale */}
          {(isEdit ? (['ca', 'en', 'es'] as const) : (['ca'] as const)).map((locale) => (
            <div
              key={`title-${locale}`}
              hidden={isEdit && activeLocale !== locale}
            >
              <Field
                label="Títol"
                type="text"
                name={`title_${locale}`}
                required={locale === 'ca'}
                placeholder={locale === 'ca' && fresh ? DRAFT_PLACEHOLDER_TITLE : undefined}
                defaultValue={
                  locale === 'ca' && fresh
                    ? ''
                    : localeValue(work?.title, locale)
                }
              />
            </div>
          ))}

          {/* Rol + Categoria — NO i18n. FK a work_roles / work_categories. */}
          <Row>
            <Col span={6}>
              <TaxonomyCombobox
                label="Rol"
                name="role_id"
                locale={activeLocale}
                options={roles as TaxonomyOption[]}
                defaultValue={work?.role_id ?? ''}
                placeholder="Selecciona o crea un rol…"
                onCreate={async (n) => (await createWorkRole({ name_ca: n })) as TaxonomyOption}
                onUpdate={async (id, patch) =>
                  (await updateWorkRole(id, patch)) as TaxonomyOption
                }
                onDelete={async (id) => {
                  await deleteWorkRole(id)
                }}
              />
            </Col>
            <Col span={6}>
              <TaxonomyCombobox
                label="Categoria"
                name="category_id"
                locale={activeLocale}
                options={categories as TaxonomyOption[]}
                defaultValue={work?.category_id ?? ''}
                placeholder="Selecciona o crea una categoria…"
                onCreate={async (n) =>
                  (await createWorkCategory({ name_ca: n })) as TaxonomyOption
                }
                onUpdate={async (id, patch) =>
                  (await updateWorkCategory(id, patch)) as TaxonomyOption
                }
                onDelete={async (id) => {
                  await deleteWorkCategory(id)
                }}
              />
            </Col>
          </Row>

          {/* Client + Any + Accent color (3 cols) */}
          <Row>
            <Col span={6}>
              <ClientSelect
                clients={clients}
                defaultValue={work?.client_id ?? ''}
              />
            </Col>
            <Col span={3}>
              <Field
                label="Any"
                type="text"
                name="year"
                placeholder="2024"
                inputMode="numeric"
                maxLength={4}
                defaultValue={work?.year || ''}
                warning={yearWarning}
              />
            </Col>
            <Col span={3}>
              <ColorField
                label="Accent color"
                defaultValue={work?.accent_color || ''}
                name="accent_color"
              />
            </Col>
          </Row>
        </div>
      </Card>

      {/* Contingut estructurat (només a edit).
          El Provider envolta TRES cards (Hero, Blocs, Tancament) perquè
          totes comparteixin el mateix `content` JSON. El hidden input
          `content_json` es renderitza una sola vegada des del Provider.
          BlocksUIProvider va dins perquè la BlocksToolbar pugui llegir
          openBlocks/expandAll mentre viu al headerRight del Card. */}
      {isEdit && (
        <ContentEditorProvider
          initial={work?.content}
          onContentChange={() => {
            // Marca el form com a "Canvis sense desar" instantàniament
            if (statusRef.current !== 'saving') setStatusBoth('pending')
          }}
        >
          <BlocksUIProvider workId={work?.id ? String(work.id) : undefined}>
          {/* ============ HERO — portada del case study ============ */}
          <Card
            id="section-hero"
            title="Hero"
            hidden={activeSection !== 'section-hero'}
            headerRight={isEdit ? <LocaleSwitcher active={activeLocale} onChange={setActiveLocale} work={work} formRef={formRef} /> : undefined}
          >
            <HeroSection />
          </Card>

          {/* ============ BLOCS — cos del case study ============
              `bare` perquè cada bloc és la seva pròpia row blanca
              (no volem el wrapper card per sobre). El headerRight conté
              els controls de la secció: BlocksToolbar (Expandir + Afegir)
              i el LocaleSwitcher. */}
          <Card
            id="section-blocs"
            title="Blocs"
            bare
            hidden={activeSection !== 'section-blocs'}
            headerRight={
              isEdit ? (
                <div className="flex items-center gap-6">
                  <BlocksToolbar />
                  <LocaleSwitcher active={activeLocale} onChange={setActiveLocale} work={work} formRef={formRef} />
                </div>
              ) : (
                <BlocksToolbar />
              )
            }
          >
            <BlocksSection
              onValidationChange={(count) =>
                setEditorWarnings((prev) => ({ ...prev, blocs: count || undefined }))
              }
            />
          </Card>

          {/* ============ TANCAMENT — Conclusió i18n + Final media ============
              Combina dos elements que tanquen el case study al frontend:
              · Conclusió (text i18n, fallback de content.conclusion)
              · Final media (galeria d'imatges, dins el JSON content) */}
          <Card
            id="section-conclusio-text"
            title="Tancament del case study"
            hidden={activeSection !== 'section-conclusio-text'}
            headerRight={isEdit ? <LocaleSwitcher active={activeLocale} onChange={setActiveLocale} work={work} formRef={formRef} /> : undefined}
          >
            {(['ca', 'en', 'es'] as const).map((locale) => (
              <div
                key={locale}
                hidden={activeLocale !== locale}
              >
                <RichTextEditor
                  label="Conclusió"
                  hint="Una frase de tancament. S'usa al final del case study (sota l'últim bloc, sobre les imatges finals)."
                  name={`conclusion_${locale}`}
                  rows={5}
                  defaultValue={localeValue(work?.conclusion, locale)}
                />
              </div>
            ))}

            {/* Final media — gestionat via context, escriu a content.finalMedia */}
            <FinalMediaSection
              onValidationChange={(count) =>
                setEditorWarnings((prev) => ({ ...prev, finalmedia: count || undefined }))
              }
            />
          </Card>
          </BlocksUIProvider>
        </ContentEditorProvider>
      )}

      {/* ============ SEO ============
          Card al final del form per controlar com el case study es mostra
          a Google, LinkedIn i altres compartits. Tots els camps són
          opcionals — sense res, el frontend fa fallback a title /
          short_description / main_image_url respectivament.

          Estructura 2-col:
          ── LEFT: OG image (recomanat 1200×630 ≈ 1.91:1)
          ── RIGHT: Slug + Meta title + Meta description + noindex */}
      <Card
        id="section-seo"
        title="SEO i compartits"
        hidden={activeSection !== 'section-seo'}
        headerRight={isEdit ? <LocaleSwitcher active={activeLocale} onChange={setActiveLocale} work={work} formRef={formRef} /> : undefined}
      >
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* LEFT col — OG Image */}
          <div className="w-full md:w-1/2 md:shrink-0">
            <ImageUploadField
              label="OG image"
              hint="Apareix quan algú comparteix /works/[slug] a xarxes socials. Recomanat 1200×630 (~1.91:1). Si està buida, es fa fallback a la imatge principal del thumbnail."
              name="og_image_url"
              folder="works/og"
              defaultValue={work?.og_image_url || ''}
              aspectRatio="1200 / 630"
            />
          </div>

          {/* RIGHT col — Slug + Meta + noindex */}
          <div className="flex flex-col gap-6 flex-1 min-w-0 w-full">
            {/* Slug i18n (mogut d'Identificació) */}
            {(isEdit ? (['ca', 'en', 'es'] as const) : (['ca'] as const)).map((locale) => (
              <div
                key={`seo-slug-${locale}`}
                hidden={isEdit && activeLocale !== locale}
              >
                <Field
                  label="Slug (URL)"
                  hint={`Apareix a /works/${locale === 'ca' ? '[slug-ca]' : `[slug-${locale}]`}`}
                  type="text"
                  name={`slug_${locale}`}
                  required={locale === 'ca'}
                  placeholder={
                    locale === 'ca' && hasSlugPlaceholder
                      ? slugCa
                      : 'el-meu-projecte'
                  }
                  defaultValue={
                    locale === 'ca' && hasSlugPlaceholder
                      ? ''
                      : localeValue(work?.slug, locale)
                  }
                  warning={locale === 'ca' ? slugWarning : undefined}
                />
              </div>
            ))}

            {/* Meta title (i18n, override opcional) */}
            {(isEdit ? (['ca', 'en', 'es'] as const) : (['ca'] as const)).map((locale) => (
              <div
                key={`seo-mt-${locale}`}
                hidden={isEdit && activeLocale !== locale}
              >
                <Field
                  label="Meta title"
                  hint="Override del <title> i og:title. ~60 caràcters per evitar que Google el talli. Si està buit, fallback al títol del work."
                  type="text"
                  name={`meta_title_${locale}`}
                  maxLength={70}
                  defaultValue={localeValue(work?.meta_title, locale)}
                />
              </div>
            ))}

            {/* Meta description (i18n, text pla — sense rich text) */}
            {(isEdit ? (['ca', 'en', 'es'] as const) : (['ca'] as const)).map((locale) => (
              <div
                key={`seo-md-${locale}`}
                hidden={isEdit && activeLocale !== locale}
              >
                <PlainTextarea
                  label="Meta description"
                  hint="Override del meta description. ~155 caràcters òptim. Si està buit, fallback a la descripció curta (text pla)."
                  name={`meta_description_${locale}`}
                  rows={3}
                  maxLength={300}
                  defaultValue={localeValue(work?.meta_description, locale)}
                />
              </div>
            ))}

            {/* No indexable (non-i18n) */}
            <Checkbox
              label="No indexable"
              description="Marca aquesta opció per posar un noindex robots meta tag — el work seguirà accessible via URL directa, però NO apareixerà a Google. Útil per clients privats o NDAs."
              name="noindex"
              defaultChecked={work?.is_indexable === false}
            />
          </div>
        </div>
      </Card>

      {/* Sense footer CTA: el botó Desar viu només al top bar sticky (sempre
          visible). Autosave + Cmd+S cobreixen la resta — no calen dos CTA. */}

      </div>{/* fi columna principal */}

      {/* Preview panel — sticky a la dreta a 2xl+. Es renderitza només quan
          previewOpen i la viewport és prou ampla. En pantalles més petites
          el botó del top bar segueix obrint nova pestanya. */}
      {previewOpen && previewSrcSlug && (
        <PreviewPanel
          slug={previewSrcSlug}
          iframeKey={previewKey}
          onClose={() => setPreviewOpen(false)}
        />
      )}

    </div>{/* fi layout amb TOC + max-width condicional */}

    {/* Modal de confirmació (delete/discard work). Es renderitza
        condicionalment des del hook useConfirm. */}
    {confirmDialog}
    </form>
  )
}

/* ------------------------------------------------------------------ */
/*  Layout primitives                                                  */
/* ------------------------------------------------------------------ */

/**
 * Card primitive simplificada — header (títol + slot dret) FORA del
 * panell blanc, body dins el panell amb fons surface-card.
 *
 * El títol viu sobre el rectangle blanc (no dins) per donar més aire i
 * fer-lo el "title de la pantalla" — pattern d'edició estil Linear /
 * Notion. El `LocaleSwitcher` viatja al `headerRight` del mateix grup.
 *
 * Sense `description`: l'eyebrow del TOC + el títol gran ja són
 * suficients per situar l'usuari.
 *
 * Cada card es renderitza amb `hidden` si no és la secció activa — el
 * contingut es manté al DOM perquè el FormData capturi tots els camps al
 * desar (autosave inclòs).
 */
function Card({
  id,
  title,
  children,
  hidden,
  padding = 'normal',
  headerRight,
  bare,
}: {
  id?: string
  title: string
  children: React.ReactNode
  hidden?: boolean
  padding?: 'normal' | 'loose'
  /**
   * Slot opcional al cantó dret del header (fora del rectangle blanc).
   * S'usa per al LocaleSwitcher — així el toggle d'idioma viu sempre al
   * costat del títol de la secció activa.
   */
  headerRight?: React.ReactNode
  /**
   * Quan `true`, el Card no renderitza el panell blanc embolcall. Els
   * children es posen directament sota el header. Útil per a seccions
   * com Blocs, on cada child ja és la seva pròpia "row" amb fons propi i
   * no volem el wrapper visual.
   */
  bare?: boolean
}) {
  const headingId = id ? `${id}-heading` : undefined
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={`flex flex-col gap-8 scroll-mt-20 ${hidden ? 'hidden' : ''}`}
    >
      <div className="flex items-center justify-between gap-4 px-1">
        <h2 id={headingId} className="text-body-lg font-semibold text-text-main">{title}</h2>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>
      {bare ? (
        children
      ) : (
        <div
          className={`flex flex-col gap-6 rounded-[var(--radius-base)] border border-surface-border bg-surface-card ${
            padding === 'loose'
              ? 'px-6 py-8 md:px-10 md:py-12'
              : 'px-6 py-8 md:px-8 md:py-10'
          }`}
        >
          {children}
        </div>
      )}
    </section>
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
      {isPending ? 'Desant…' : isEdit ? 'Desar canvis' : 'Crear treball'}
    </button>
  )
}

/**
 * Camps i18n que comptem per calcular completesa de cada locale.
 * Coincideix amb els camps que es rendetzen dins de cada Card "Contingut · XX".
 */
// Camps i18n del work que compten per a la completesa del locale (badge
// del LocaleSwitcher). NOTE: `role` i `category` ja NO estan aquí — ara
// són FK a work_roles/work_categories i el nom i18n viu a la taula
// taxonomia, no al work. La completesa del locale només mira els camps
// que es tradueixen directament des del WorkForm.
const I18N_FIELDS = ['title', 'slug', 'conclusion'] as const

type LocaleCompleteness = 'complete' | 'partial' | 'empty'

/** Compta camps amb contingut per a un locale i retorna l'estat. */
function localeCompleteness(work: Work | undefined, locale: Locale): LocaleCompleteness {
  if (!work) return 'empty'
  const filled = I18N_FIELDS.reduce((acc, f) => {
    const v = (work as unknown as Record<string, Translatable | null>)[f]
    return acc + (v && typeof v[locale] === 'string' && v[locale]!.trim() ? 1 : 0)
  }, 0)
  if (filled === I18N_FIELDS.length) return 'complete'
  if (filled === 0) return 'empty'
  return 'partial'
}

function LocaleSwitcher({
  active,
  onChange,
  work,
  formRef,
}: {
  active: Locale
  onChange: (l: Locale) => void
  work?: Work
  formRef: React.RefObject<HTMLFormElement | null>
}) {
  /**
   * Copia tots els camps i18n CA al locale actiu via DOM (els inputs són
   * uncontrolled amb defaultValue). Després disparem un input event sintètic
   * perquè la detecció de canvis del form actualitzi el snapshot i activi
   * l'autosave.
   */
  const copyFromCA = () => {
    if (!formRef.current || active === 'ca') return
    for (const f of I18N_FIELDS) {
      const src = formRef.current.elements.namedItem(`${f}_ca`) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null
      const dst = formRef.current.elements.namedItem(`${f}_${active}`) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null
      if (src && dst && src.value) {
        dst.value = src.value
        // Cal que React detecti el canvi: fem servir el setter natiu del
        // prototip i després disparem un input event "bubbling".
        const setter = Object.getOwnPropertyDescriptor(
          dst instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype,
          'value'
        )?.set
        if (setter) setter.call(dst, src.value)
        dst.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }
  }

  return (
    <div className="flex items-center gap-3 text-body-sm flex-wrap">
      <span className="inline-flex items-center gap-2 text-text-secondary">
        <Translate size={16} weight="regular" />
        Idioma
      </span>
      <div
        role="tablist"
        aria-label="Idioma"
        className="inline-flex items-center gap-1 p-1 rounded-full border border-surface-border bg-surface-card"
      >
        {(['ca', 'en', 'es'] as const).map((l) => {
          const completeness = localeCompleteness(work, l)
          return (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={active === l}
              onClick={() => onChange(l)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full uppercase tracking-wider text-body-sm transition-colors ${
                active === l
                  ? 'bg-text-main text-text-main-inverse'
                  : 'text-text-secondary hover:text-text-main'
              }`}
              title={
                completeness === 'complete'
                  ? `${l.toUpperCase()} complet`
                  : completeness === 'partial'
                    ? `${l.toUpperCase()} parcial`
                    : `${l.toUpperCase()} buit`
              }
            >
              <CompletenessDot state={completeness} inverse={active === l} />
              {l}
            </button>
          )
        })}
      </div>

      {/* Copiar de CA visible només quan estem en EN/ES */}
      {active !== 'ca' && (
        <button
          type="button"
          onClick={copyFromCA}
          className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-main transition-colors underline underline-offset-4 decoration-text-secondary/40 hover:decoration-text-main"
          title="Copia els 6 camps de la versió CA als camps de l'idioma actiu"
        >
          ↪ Copiar de CA
        </button>
      )}
    </div>
  )
}

/** Punt de color que indica completesa del locale (verd/groc/gris). */
function CompletenessDot({
  state,
  inverse,
}: {
  state: LocaleCompleteness
  inverse: boolean
}) {
  const color =
    state === 'complete'
      ? 'bg-accent'
      : state === 'partial'
        ? 'bg-warning'
        : inverse
          ? 'bg-text-main-inverse/40'
          : 'bg-text-secondary/40'
  return <span aria-hidden className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />
}

/**
 * Indicador d'autosave compacte, sempre visible al top bar. Comunica de cop
 * d'ull si hi ha canvis pendents, si està guardant, o si el darrer save va
 * fallar — sense haver de mirar el botó Desar.
 */
function AutosaveIndicator({
  status,
  lastSavedAt,
}: {
  status: SaveStatus
  lastSavedAt: Date | null
}) {
  // Mantenim "segons des de l'últim save" en state per evitar cridar
  // Date.now() durant el render (react-hooks/purity).
  const [secondsAgo, setSecondsAgo] = useState(0)

  useEffect(() => {
    if (status !== 'saved' || !lastSavedAt) return
    const update = () =>
      setSecondsAgo(Math.max(0, Math.round((Date.now() - lastSavedAt.getTime()) / 1000)))
    update()
    const id = setInterval(update, 5_000) // refresc cada 5s — suficient
    return () => clearInterval(id)
  }, [status, lastSavedAt])

  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary">
        <CircleNotch size={14} weight="regular" className="animate-spin" />
        Desant…
      </span>
    )
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 text-body-sm text-warning">
        <span aria-hidden className="inline-block w-2 h-2 rounded-full bg-warning" />
        Canvis sense desar
      </span>
    )
  }
  if (status === 'saved' && lastSavedAt) {
    const label = secondsAgo < 5 ? 'Desat ara mateix' : `Desat fa ${formatAgo(secondsAgo)}`
    return (
      <span className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary">
        <CloudCheck size={14} weight="regular" className="text-accent" />
        {label}
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-body-sm text-error">
        <Warning size={14} weight="fill" />
        Error en autosave
      </span>
    )
  }
  return null
}

function formatAgo(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(minutes / 60)
  return `${hours} h`
}

/**
 * Panell de preview lateral. Carrega /works/[slug]?preview=draft dins
 * d'un iframe sticky a 2xl+. Es recarrega via `iframeKey` (incrementat
 * pel pare quan un autosave persisteix), perquè reflecteixi l'estat
 * acabat de guardar a la BD.
 *
 * El propi botó "Tancar" + l'enllaç a nova pestanya viuen al header
 * del panell. La iframe ocupa la resta de l'alçada del viewport.
 */
/** Mides "reals" del viewport per a cada dispositiu (width × height).
 *  L'iframe renderitza amb aquestes dimensions com si fos un dispositiu
 *  real, i el wrapper fa `transform: scale(...)` per fer-lo cabre dins
 *  el panell. Així el case study respon als breakpoints com ho faria al
 *  dispositiu real — no és una simple reducció CSS.
 *
 *  - desktop (1440×900): MacBook Pro 14"-15" / monitor petit, ratio 16:10
 *  - tablet (768×1024): iPad portrait, breakpoint Tailwind md:, ratio 3:4
 *  - mobile (375×812): iPhone 12/13/14 / SE 3, ratio aprox 9:19.5
 */
type PreviewViewport = 'desktop' | 'tablet' | 'mobile'
const VIEWPORT_DIMS: Record<PreviewViewport, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
}

/** Padding del contenidor pare (en píxels) entorn del device frame. Així el
 *  recuadre interior queda "respirat" del header i les vores del panell. */
const PREVIEW_FRAME_PADDING = 24

function PreviewPanel({
  slug,
  iframeKey,
  onClose,
}: {
  slug: string
  iframeKey: number
  onClose: () => void
}) {
  const [viewport, setViewport] = useState<PreviewViewport>('desktop')
  const containerRef = useRef<HTMLDivElement>(null)
  /** Mesura real del contenidor (excloent padding del wrapper extern). */
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  /**
   * Observem l'amplada/alçada del wrapper per recalcular l'escala quan
   * el panell creix o decreix (resize de finestra, obertura del TOC,
   * etc.). ResizeObserver és barat i evita un event listener manual.
   */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setContainerSize({ width, height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { width: deviceWidth, height: deviceHeight } = VIEWPORT_DIMS[viewport]

  // Espai disponible després de descomptar el padding del contenidor pare
  // — el device frame ha de "respirar" del header i les vores.
  const availableWidth = Math.max(0, containerSize.width - PREVIEW_FRAME_PADDING * 2)
  const availableHeight = Math.max(0, containerSize.height - PREVIEW_FRAME_PADDING * 2)

  // L'escala respecta tant width com height — el frame manté aspect ratio
  // real del dispositiu (no s'estira). Cap=1 perquè no ampliem un mobile
  // 375×812 a mida més gran del seu real (es veuria pixelat conceptual).
  const scale =
    availableWidth > 0 && availableHeight > 0
      ? Math.min(1, availableWidth / deviceWidth, availableHeight / deviceHeight)
      : 0

  // Mida visual del frame (post-scale).
  const framedWidth = deviceWidth * scale
  const framedHeight = deviceHeight * scale

  return (
    <aside
      className="flex flex-col flex-none w-[460px] xl:w-auto xl:flex-1 sticky top-24 self-start"
      style={{ height: 'calc(100vh - 7rem)' }}
      aria-label="Preview del case study"
    >
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 border border-surface-border rounded-t-md bg-surface-card">
        <div className="flex flex-col">
          <span className="text-body-sm font-medium text-text-main">Preview · live</span>
          <span className="text-body-xs text-text-secondary">
            {viewport === 'desktop' && `Desktop · 1440×900${scale < 1 ? ` · ${Math.round(scale * 100)}%` : ''}`}
            {viewport === 'tablet' && `Tablet · 768×1024${scale < 1 ? ` · ${Math.round(scale * 100)}%` : ''}`}
            {viewport === 'mobile' && `Mòbil · 375×812${scale < 1 ? ` · ${Math.round(scale * 100)}%` : ''}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Viewport switcher: Desktop / Tablet / Mobile. L'iframe renderitza
              a la mida real del dispositiu i s'escala via transform — així
              els media queries responen com a un dispositiu real i el frame
              manté l'aspect ratio. */}
          <ViewportSwitcher value={viewport} onChange={setViewport} />
          <span aria-hidden className="mx-1 h-5 w-px bg-surface-border" />
          <a
            href={`/works/${slug}?preview=draft`}
            target="_blank"
            rel="noreferrer"
            title="Obrir en nova pestanya"
            aria-label="Obrir en nova pestanya"
            className="inline-flex items-center justify-center w-8 h-8 rounded text-text-secondary hover:text-text-main hover:bg-surface-base transition-colors"
          >
            <ArrowSquareOut size={14} weight="regular" />
          </a>
          <button
            type="button"
            onClick={onClose}
            title="Tancar preview"
            aria-label="Tancar preview"
            className="inline-flex items-center justify-center w-8 h-8 rounded text-text-secondary hover:text-text-main hover:bg-surface-base transition-colors"
          >
            <X size={14} weight="regular" />
          </button>
        </div>
      </header>
      {/* Contenidor pare: fons subtil per donar context al device frame i
          centra el frame horitzontal+verticalment amb padding interior. */}
      <div
        ref={containerRef}
        className="relative flex-1 border-x border-b border-surface-border rounded-b-md bg-surface-base/60 overflow-hidden flex items-center justify-center"
        style={{ padding: `${PREVIEW_FRAME_PADDING}px` }}
      >
        {/* Device frame: recuadre interior amb l'aspect ratio del dispositiu.
            L'iframe renderitza a mida real i s'escala via transform.
            Sense `containerSize` no podem calcular scale → mantenim ocult
            fins al primer measure (un sol frame de delay). */}
        {scale > 0 && (
          <div
            className="relative bg-surface-base rounded-md shadow-md border border-surface-border overflow-hidden"
            style={{
              width: `${framedWidth}px`,
              height: `${framedHeight}px`,
            }}
          >
            <iframe
              key={iframeKey}
              src={`/works/${slug}?preview=draft`}
              title="Preview del case study"
              loading="lazy"
              className="bg-surface-base absolute top-0 left-0 border-0"
              style={{
                width: `${deviceWidth}px`,
                height: `${deviceHeight}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            />
          </div>
        )}
      </div>
    </aside>
  )
}

/** Toggle group de 3 botons icon-only (desktop/tablet/mobile). */
function ViewportSwitcher({
  value,
  onChange,
}: {
  value: PreviewViewport
  onChange: (v: PreviewViewport) => void
}) {
  const items: { id: PreviewViewport; label: string; icon: React.ReactNode }[] = [
    { id: 'desktop', label: 'Desktop', icon: <Desktop size={14} weight="regular" /> },
    { id: 'tablet', label: 'Tablet (768px)', icon: <DeviceTablet size={14} weight="regular" /> },
    { id: 'mobile', label: 'Mòbil (375px)', icon: <DeviceMobile size={14} weight="regular" /> },
  ]
  return (
    <div
      role="group"
      aria-label="Mida del viewport del preview"
      className="inline-flex items-center gap-0.5 p-0.5 rounded-md bg-surface-base border border-surface-border"
    >
      {items.map((it) => {
        const active = value === it.id
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            aria-pressed={active}
            title={it.label}
            aria-label={it.label}
            className={`inline-flex items-center justify-center w-7 h-7 rounded transition-colors ${
              active
                ? 'bg-text-main text-text-main-inverse'
                : 'text-text-secondary hover:text-text-main hover:bg-surface-card'
            }`}
          >
            {it.icon}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Taula de continguts sticky a l'esquerra del form, amb scroll-spy.
 * Visible només a partir d'`xl:` perquè el form ja és de 896px d'ample;
 * a viewports més petits es pot navegar amb scroll normal.
 *
 * El scroll-spy fa servir IntersectionObserver amb un rootMargin que
 * "talla" un 30% del top i un 60% del bottom del viewport — així la
 * secció marcada és la que ocupa visualment el centre superior, no
 * el primer pixel que entra a pantalla.
 */
/**
 * TOC en mode **tab navigation**: cada entrada és un botó que controla
 * quina secció es renderitza al form. Substitueix el scroll-spy anterior
 * (IntersectionObserver) per un patró més clar — només una secció és
 * visible alhora, així es minimitza la càrrega cognitiva.
 *
 * Les altres seccions es renderitzen `hidden` al DOM perquè el FormData
 * segueixi capturant tots els camps quan es desa (autosave inclòs).
 */
/** Definició compartida dels items del TOC. La fa servir tant la versió
 *  vertical (xl+) com la fila de pills horitzontals (sota xl). */
interface TocItem {
  id: string
  label: string
  warningKey: keyof SectionWarnings
}

function getTocItems(isEdit: boolean): TocItem[] {
  return [
    { id: 'section-metadades', label: 'Característiques', warningKey: 'metadades' },
    ...(isEdit
      ? ([
          { id: 'section-hero', label: 'Hero', warningKey: 'hero' as const },
          { id: 'section-blocs', label: 'Blocs', warningKey: 'blocs' as const },
          { id: 'section-conclusio-text', label: 'Tancament', warningKey: 'finalmedia' as const },
          { id: 'section-seo', label: 'SEO', warningKey: 'metadades' as const },
        ] as TocItem[])
      : []),
  ]
}

function Toc({
  isEdit,
  activeSection,
  onSectionChange,
  warnings = {},
}: {
  activeLocale: Locale
  isEdit: boolean
  activeSection: string
  onSectionChange: (sectionId: string) => void
  warnings?: SectionWarnings
}) {
  const items = getTocItems(isEdit)

  const handleClick = (id: string) => {
    onSectionChange(id)
    // Scroll suau al top del form perquè la nova secció comenci a dalt
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <aside className="hidden xl:block w-60 shrink-0 sticky top-24 self-start">
      {/* Header "Seccions" — bold + text-body-sm, sense uppercase ni tracking
          ampliat (Figma 11180:984). */}
      <span className="block font-bold text-body-sm text-text-secondary mb-2">
        Seccions
      </span>
      <nav aria-label="Navegació entre seccions del formulari">
        {/* Items group: cada item té el seu propi border-l-2 (color depèn de
            l'estat active). Sense gap entre items — formen una pila contígua. */}
        <ol className="flex flex-col">
          {items.map((it) => {
            const active = activeSection === it.id
            const count = warnings[it.warningKey] ?? 0
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => handleClick(it.id)}
                  aria-current={active ? 'page' : undefined}
                  /* Item del TOC:
                     · py-3 (12px) per donar més aire vertical
                     · px-3 (12px), gap-2.5 (10px)
                     · border-l-2 sempre (active=primary, inactive=border)
                     · Font: Regular en active, Light en inactive
                     · Color text estable text-secondary (només canvia el
                       weight + el border) — l'active NO canvia de color. */
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-3 border-l-2 text-body-sm text-text-secondary transition-colors ${
                    active
                      ? 'border-text-main font-normal'
                      : 'border-surface-border font-light hover:border-text-secondary/60 hover:text-text-main'
                  }`}
                >
                  <span className="truncate">{it.label}</span>
                  {count > 0 && (
                    <span
                      /* Badge avisos (Figma I11180:989;11173:9860):
                         · w-6 h-6 (24×24), rounded-full
                         · bg-warning-surface, text-warning, font-bold
                         · text-body-sm (14px), no body-xs (12px) */
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-warning-surface text-warning text-body-sm font-bold shrink-0"
                      aria-label={`${count} ${count === 1 ? 'avís' : 'avisos'}`}
                      title={`${count} ${count === 1 ? 'avís' : 'avisos'}`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ol>
      </nav>
    </aside>
  )
}

/**
 * Fallback responsive del TOC: pills horitzontals sticky sota xl (1280px).
 *
 * Patró Vercel/Stripe/Linear — quan el sidebar vertical no cap, les
 * seccions es transformen en una fila horitzontal scrollable sota el
 * top bar sticky. Mateixos items i badges d'avisos que la versió
 * vertical; estat compartit via `activeSection` / `onSectionChange`.
 *
 * Visible només a `< xl`. A `xl+` resta amagat perquè el `<Toc>` vertical
 * ja existeix a la columna esquerra.
 */
function TocPills({
  isEdit,
  activeSection,
  onSectionChange,
  warnings = {},
}: {
  isEdit: boolean
  activeSection: string
  onSectionChange: (sectionId: string) => void
  warnings?: SectionWarnings
}) {
  const items = getTocItems(isEdit)

  const handleClick = (id: string) => {
    onSectionChange(id)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    /* Sticky sota el top bar (top-[57px] cobreix l'alçada del top bar:
       py-3 + contingut). Backdrop blur + fons translúcid per donar la
       sensació "vidre" del top bar i mantenir lectura sobre contingut
       scrollat per sota. Overflow-x scroll garanteix que afegir més
       seccions en el futur no trenqui el layout. */
    <nav
      aria-label="Seccions del treball"
      className="xl:hidden sticky top-[57px] z-[15] -mx-6 md:-mx-10 bg-surface-base/90 backdrop-blur-md border-b border-surface-border"
    >
      <ol className="flex items-center gap-1 px-6 md:px-10 py-2 overflow-x-auto">
        {items.map((it) => {
          const active = activeSection === it.id
          const count = warnings[it.warningKey] ?? 0
          return (
            <li key={it.id} className="shrink-0">
              <button
                type="button"
                onClick={() => handleClick(it.id)}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-body-sm whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-surface-card text-text-main font-normal shadow-sm border border-surface-border'
                    : 'text-text-secondary font-light hover:bg-surface-card/60 hover:text-text-main'
                }`}
              >
                <span>{it.label}</span>
                {count > 0 && (
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-warning-surface text-warning text-body-xs font-bold shrink-0"
                    aria-label={`${count} ${count === 1 ? 'avís' : 'avisos'}`}
                    title={`${count} ${count === 1 ? 'avís' : 'avisos'}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/**
 * Pill d'estat publicat/esborrany al top bar. Si rep `onToggle`, es
 * comporta com un botó clicable (per canviar `is_published` sense
 * obrir cap menú). Sense handler, queda com un indicador estàtic.
 *
 * Visual:
 *  - Publicat → fons accent + icona Eye + text "Publicat"
 *  - Esborrany → fons card + icona EyeSlash + text "Esborrany"
 * El tooltip explica què passarà en clicar — important perquè
 * publicar/despublicar és una acció amb efecte públic immediat.
 */
function StatusPill({
  isPublished,
  onToggle,
  disabled,
}: {
  isPublished: boolean
  onToggle?: () => void
  disabled?: boolean
}) {
  const baseClasses = isPublished
    ? 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-surface text-text-main text-body-xs font-medium'
    : 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-card border border-surface-border text-text-secondary text-body-xs font-medium'

  const content = (
    <>
      {isPublished ? (
        <Eye size={12} weight="regular" />
      ) : (
        <EyeSlash size={12} weight="regular" />
      )}
      {isPublished ? 'Publicat' : 'Esborrany'}
    </>
  )

  if (!onToggle) {
    return <span className={baseClasses}>{content}</span>
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      title={
        isPublished
          ? 'Treballa publicat. Click per despublicar (passarà a esborrany).'
          : 'Esborrany. Click per publicar (serà visible a /works).'
      }
      className={`${baseClasses} transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
    >
      {content}
    </button>
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
  warning,
  required,
  ...props
}: {
  label: string
  hint?: string
  error?: string
  /** Avís soft (no bloqueja submit). Es renderitza en color warning sota el camp. */
  warning?: string
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
        className={`w-full max-w-[500px] bg-transparent border rounded-md px-3.5 py-2.5 text-text-main font-sans text-body-md placeholder:text-text-secondary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-text-main/20 hover:border-text-secondary/60 ${
          error ? 'border-error focus:border-error focus:ring-error/20' : 'border-surface-border focus:border-text-main'
        }`}
      />
      {hint && !error && !warning && (
        <p id={hintId} className="text-body-sm text-text-secondary/80 leading-snug max-w-prose">
          {hint}
        </p>
      )}
      {warning && !error && (
        <p className="inline-flex items-start gap-1.5 text-body-sm text-warning leading-snug max-w-prose">
          <Warning size={14} weight="fill" className="mt-0.5 shrink-0" />
          <span>{warning}</span>
        </p>
      )}
      {error && (
        <p id={errId} className="text-body-sm text-error leading-snug max-w-prose">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Selector per vincular el work amb una fitxa de Client. Mostra el nom
 * del client + l'empresa al label per facilitar la identificació en
 * llistes llargues. Si encara no hi ha cap client a la BD, es renderitza
 * un missatge inline amb un enllaç a /admin/clients/new perquè l'usuari
 * pugui crear-ne un sense perdre el context del work que està editant.
 */
function ClientSelect({
  clients,
  defaultValue,
}: {
  clients: ClientOption[]
  defaultValue: string
}) {
  const id = useId()
  if (clients.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-body-sm font-medium text-text-secondary">
          Client
        </span>
        <div className="text-body-sm text-text-secondary leading-snug p-3 border border-dashed border-surface-border rounded-md bg-surface-base">
          Encara no hi ha cap fitxa de client a la BD.{' '}
          <Link
            href="/admin/clients/new"
            className="text-text-main underline underline-offset-2 hover:text-accent"
          >
            Crea&apos;n una
          </Link>{' '}
          per poder vincular-la a aquest treball.
        </div>
        {/* Mantenim el camp al form perquè el server action no rebi
            `undefined` (el conserva com a null gracias al fallback). */}
        <input type="hidden" name="client_id" value="" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="inline-flex items-center gap-1 text-body-sm font-medium text-text-secondary"
      >
        Client
      </label>
      {/* Wrapper relatiu per posicionar el chevron custom sobre el <select>.
          Amagar la fletxa nativa requereix `appearance-none` + el prefix
          webkit explícit (Tailwind v4 ja no l'inclou per defecte). També
          `-moz-appearance:none` per Firefox antic. Així el camp queda
          visualment idèntic als <input> del form. */}
      <div className="relative max-w-[500px]">
        <select
          id={id}
          name="client_id"
          defaultValue={defaultValue}
          className="w-full appearance-none [-webkit-appearance:none] [-moz-appearance:none] bg-transparent border border-surface-border rounded-md pl-3.5 pr-10 py-2.5 text-text-main font-sans text-body-md transition-colors hover:border-text-secondary/60 focus:outline-none focus:border-text-main focus:ring-2 focus:ring-text-main/20"
        >
          <option value="">— Sense client vinculat —</option>
          {/* Mostrem només el nom de l'empresa (fallback al name del contacte
              si encara no s'ha omplert el camp `company` a la fitxa). Més
              endavant, quan suportem múltiples contactes per empresa, el
              `company` serà sempre obligatori i el `name` representarà la
              persona dins de l'empresa. */}
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company || c.name}
            </option>
          ))}
        </select>
        <CaretDown
          size={16}
          weight="regular"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary"
        />
      </div>
    </div>
  )
}

/**
 * Textarea de text pla (sense rich text). Per a camps com Meta description
 * on les xarxes socials/buscadors esperen text pla, no HTML. Comparteix
 * estilística amb el <Field> (label uppercase, bg-surface-base, focus).
 */
function PlainTextarea({
  label,
  hint,
  required,
  ...props
}: {
  label: string
  hint?: string
  required?: boolean
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const autoId = useId()
  const id = props.id ?? autoId
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="inline-flex items-center gap-1 text-body-sm font-medium text-text-secondary">
        {label}
        {required && <span className="text-error">*</span>}
      </label>
      <textarea
        id={id}
        required={required}
        aria-describedby={hintId}
        {...props}
        className="w-full max-w-[500px] bg-transparent border border-surface-border rounded-md px-3.5 py-3 text-text-main font-sans text-body-md placeholder:text-text-secondary/50 transition-colors hover:border-text-secondary/60 focus:outline-none focus:border-text-main focus:ring-2 focus:ring-text-main/20 resize-y leading-relaxed"
      />
      {hint && (
        <p id={hintId} className="text-body-sm text-text-secondary/80 leading-snug max-w-prose">
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
