"use client"

import { useId, useRef, useState, useCallback, useEffect, useImperativeHandle } from 'react'
import type { Ref } from 'react'
import imageCompression from 'browser-image-compression'
import {
  CloudArrowUp,
  X,
  CircleNotch,
  Warning,
  ArrowsCounterClockwise,
  PencilSimple,
  Trash,
  Copy,
  ArrowSquareOut,
} from '@phosphor-icons/react'
import { createClient } from '@/utils/supabase/client'

/**
 * <ImageUploadField />
 *
 * Camp d'imatge amb dues vies d'entrada (dropzone / URL externa) i tres
 * estats visuals diferenciats:
 *
 *   1. Sense valor → dropzone amb drag&drop + opció "URL externa"
 *   2. Pujant / comprimint → spinner dins el dropzone
 *   3. Amb valor → preview simplificat (només la imatge amb fons rounded)
 *      i un botó pencil al cantó superior dret que obre el modal de gestió.
 *
 * El modal de gestió (`ImageManagementModal`) agrupa totes les opcions
 * d'edició: reemplaçar fitxer, editar URL externa, editar alt text, i
 * esborrar. Així el card del form queda visualment net i les accions
 * secundàries no l'omplen.
 *
 * Modes de funcionament:
 *   - Uncontrolled (per <form> + FormData): es passa `name` i opcionalment
 *     `defaultValue`. Renderitza `<input type="hidden">` amb la URL.
 *     L'alt funciona igual via `altName` + `defaultAlt`.
 *   - Controlled: es passa `value` + `onChange` (i `alt` + `onAltChange`).
 *
 * Bucket: `media` (públic). Path: `{folder}/{timestamp}-{slug}.{ext}`.
 */

const ACCEPTED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
] as const

/** Límit del bucket `media`. S'aplica al fitxer JA optimitzat, no a l'origen. */
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
/**
 * Sostre del fitxer d'origen. No és el límit del bucket: els fitxers grans
 * s'optimitzen abans de pujar-los. Només frenem els absurdament grans, que
 * farien petar el decodificador d'imatges del navegador.
 */
const MAX_INPUT_BYTES = 75 * 1024 * 1024 // 75 MB
const BUCKET = 'media'

/** Format de sortida de l'optimització — WebP dona la millor ràtio qualitat/pes. */
const OUTPUT_MIME = 'image/webp'

/** Mime types que no comprimim — SVG és vector, GIF pot tenir animacions. */
const SKIP_COMPRESS_MIME = new Set<string>(['image/svg+xml', 'image/gif'])
/** Formats ja moderns: si a sobre són petits, re-comprimir no aporta res. */
const MODERN_MIME = new Set<string>(['image/webp', 'image/avif'])
/** Fitxers moderns més petits que aquest llindar no es toquen. */
const SKIP_COMPRESS_BYTES = 300 * 1024 // 300 KB

/**
 * Perfils d'optimització per carpeta de destí.
 *
 * ⚑ EL PROBLEMA QUE RESOL — abans hi havia un sol perfil per a tothom
 * (maxSizeMB 0.5 / 2400 px). `browser-image-compression` tracta el
 * `maxSizeMB` com a objectiu dur i, per arribar-hi, no només baixa qualitat:
 * també BAIXA RESOLUCIÓ. Els blocs del work detail acabaven a ~2280 px i
 * ~0,55 bpp quan la ranura en demana 3360 (1680 de caixa útil × 2 de retina).
 * Escalat cap amunt sobre mockups amb text = mullader.
 *
 * Per això el perfil ALTA no porta `maxSizeMB`: només limita el costat llarg
 * i puja amb qualitat 1. L'única compressió amb pèrdua que compta queda la
 * d'AVIF de `next/image`, que és on toca fer-la.
 *
 * `works/og` va a part i en direcció contrària: una OG image ha de ser
 * lleugera (1200×630), perquè WhatsApp i altres scrapers no llegeixen
 * previews grosses.
 */
type OptimiseProfile = {
  /** Límit del costat llarg, en píxels. */
  maxWidthOrHeight: number
  /** Qualitat de partida del WebP de sortida (0–1). */
  initialQuality: number
  /**
   * Objectiu de pes. `undefined` = sense objectiu, que és el que evita que la
   * llibreria sacrifiqui resolució per cabre en un número.
   */
  maxSizeMB?: number
}

/** Va a sang i a retina (work detail): qualitat per sobre de pes. */
const PROFILE_ALTA: OptimiseProfile = {
  maxWidthOrHeight: 3456,
  initialQuality: 1,
}
/** Es veu en graella, mai a amplada completa: thumbnails, serveis. */
const PROFILE_MITJANA: OptimiseProfile = {
  maxWidthOrHeight: 2400,
  initialQuality: 0.85,
  maxSizeMB: 0.8,
}
/** Open Graph: mida d'espec i pes petit, que és el que mana aquí. */
const PROFILE_OG: OptimiseProfile = {
  maxWidthOrHeight: 1200,
  initialQuality: 0.85,
  maxSizeMB: 0.3,
}

const PROFILE_BY_FOLDER: Record<string, OptimiseProfile> = {
  'works/blocks': PROFILE_ALTA,
  'works/hero': PROFILE_ALTA,
  'works/final': PROFILE_ALTA,
  'works/og': PROFILE_OG,
}

/** Carpeta → perfil. Qualsevol carpeta no llistada va a mitjana. */
const profileFor = (folder: string): OptimiseProfile =>
  PROFILE_BY_FOLDER[folder] ?? PROFILE_MITJANA

/** Extensió canònica per mime — el fitxer optimitzat canvia de format. */
const MIME_EXT: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
}

/**
 * Accions que el pare pot disparar sobre el camp sense renderitzar-ne la UI.
 * Serveix el patró de la fila de media del WorkContentEditor, on els botons
 * viuen a la fila i el camp només hi posa la lògica (picker + modal).
 */
export interface ImageUploadFieldHandle {
  /** Obre el selector de fitxers del sistema directament. */
  openFilePicker: () => void
  /** Obre el modal de gestió (alt, reemplaçar, esborrar). */
  openManager: () => void
}

interface Props {
  /** Etiqueta visible. */
  label: string
  /**
   * Estil de la label:
   *  - `caps` (default): mida petita, uppercase, tracking ampliat — coincideix
   *    amb la resta de labels del form (TÍTOL, ROL, ANY, etc.).
   *  - `heading`: text-body-md amb font light i sense uppercase — pensat per
   *    a camps "destacats" com el thumbnail del work, on visualment fa de
   *    petit títol de la columna en lloc d'un simple field label.
   */
  labelVariant?: 'caps' | 'heading'
  /** Subcarpeta dins del bucket. Ex: 'services', 'works', 'works/content'. */
  folder?: string
  /** Hint sota el camp. */
  hint?: string
  /** Marca el camp com obligatori (només UI; la validació viu al server). */
  required?: boolean

  /* ---- Mode uncontrolled (per <form>) ---- */
  /** Nom de l'input hidden que durà la URL al FormData. */
  name?: string
  /** Valor inicial de la URL. */
  defaultValue?: string | null
  /** Nom de l'input hidden que durà l'alt text al FormData. */
  altName?: string
  /** Valor inicial de l'alt text. */
  defaultAlt?: string | null

  /* ---- Mode controlled ---- */
  /** Valor actual. Si està definit, el component és controlat. */
  value?: string | null
  /** Callback amb la nova URL (cadena buida = sense valor). */
  onChange?: (url: string) => void
  /** Valor actual de l'alt. */
  alt?: string | null
  /** Callback amb el nou alt text. */
  onAltChange?: (alt: string) => void

  /**
   * Aspect ratio CSS del preview (ex: `'1 / 1'`, `'16 / 10'`, `'21 / 10'`).
   * Hauria de coincidir amb com es renderitza la imatge al frontend públic
   * — així el preview comunica visualment el crop esperat. Default 16:10.
   */
  aspectRatio?: string
  /**
   * Estratègia de fit de la imatge dins el preview:
   *  - `'contain'` (default): la imatge es centra i conserva proporcions
   *    sense crop — el fons gris del wrapper queda visible si l'aspect
   *    ratio interior no coincideix. Ideal per a thumbnails on importa
   *    veure la imatge sencera (cas Característiques).
   *  - `'cover'`: la imatge ompli tot el rectangle i es retalla per
   *    encaixar. Ideal per a backgrounds del hero on el frontend també
   *    usa cover (cas Hero).
   */
  objectFit?: 'contain' | 'cover'
  /**
   * Variant visual quan hi ha imatge:
   *  - `'overlay'` (default): thumbnail quadrat amb pencil flotant a la
   *    cantonada superior dreta. Útil per camps petits del form (Hero
   *    background, OG image, final media).
   *  - `'card-info'`: card horitzontal amb la imatge a l'esquerra i una
   *    columna de metadata a la dreta (file name, alt text, accions
   *    visibles). Pensat per al thumbnail principal del work, on
   *    importa veure el nom del fitxer i l'alt sense obrir un modal.
   *  - `'headless'`: no renderitza res (ni label, ni preview, ni dropzone).
   *    El pare dibuixa la UI i dispara les accions via `controlRef`. El
   *    modal de gestió segueix disponible sota demanda.
   */
  variant?: 'overlay' | 'card-info' | 'headless'
  /**
   * Ref imperatiu per obrir el picker o el modal des de fora. Pensat per a
   * `variant='headless'`, però funciona amb qualsevol variant.
   */
  controlRef?: Ref<ImageUploadFieldHandle>
  /**
   * Notifica el pare de l'estat de la pujada. En mode headless el camp no
   * pinta cap spinner ni cap error: els ha de mostrar qui dibuixa la UI.
   */
  onStatusChange?: (busy: boolean, error: string | null) => void
}

export default function ImageUploadField({
  label,
  labelVariant = 'caps',
  folder = 'misc',
  hint,
  required,
  name,
  defaultValue,
  altName,
  defaultAlt,
  value,
  onChange,
  alt,
  onAltChange,
  aspectRatio = '16 / 10',
  objectFit = 'contain',
  variant = 'overlay',
  controlRef,
  onStatusChange,
}: Props) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  // Determina si el component és controlat externament. Si el consumidor
  // passa `onChange`, considerem que la URL és controlada; igual per l'alt.
  const isControlled = onChange !== undefined
  const isAltControlled = onAltChange !== undefined

  const [internalValue, setInternalValue] = useState<string>(defaultValue || '')
  const [internalAlt, setInternalAlt] = useState<string>(defaultAlt || '')
  const currentValue = (isControlled ? (value ?? '') : internalValue) || ''
  const currentAlt = (isAltControlled ? (alt ?? '') : internalAlt) || ''

  const [status, setStatus] = useState<'idle' | 'compressing' | 'uploading' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  /** Resum opcional de l'última compressió per ensenyar a l'usuari l'estalvi de mida. */
  const [lastCompression, setLastCompression] = useState<{ before: number; after: number } | null>(null)
  /** Estat del modal de gestió — només actiu quan hi ha imatge i clica pencil. */
  const [modalOpen, setModalOpen] = useState(false)
  /**
   * Quan l'usuari clica "Reemplaçar fitxer" dins el modal, volem que el modal
   * mostri el progrés i es tanqui automàticament en acabar bé. Sense aquest
   * flag, no podríem distingir entre una pujada iniciada des del modal i una
   * iniciada des del dropzone (que NO ha de tancar res).
   */
  const [replacingFromModal, setReplacingFromModal] = useState(false)

  // Sincronitza l'estat intern si canvia defaultValue (p. ex. després de submit)
  useEffect(() => {
    if (!isControlled && defaultValue !== undefined) {
      setInternalValue(defaultValue || '')
    }
  }, [defaultValue, isControlled])

  useEffect(() => {
    if (!isAltControlled && defaultAlt !== undefined) {
      setInternalAlt(defaultAlt || '')
    }
  }, [defaultAlt, isAltControlled])

  // Si l'usuari ha iniciat una pujada des del modal i acaba bé (status torna
  // a 'idle' sense error), tanquem el modal — la imatge nova ja viu al pare i
  // l'usuari ha completat la seva intenció de reemplaçar.
  useEffect(() => {
    if (replacingFromModal && status === 'idle' && !error) {
      setModalOpen(false)
      setReplacingFromModal(false)
    }
    // Si hi ha error, deixem el flag actiu perquè l'usuari pugui veure
    // l'error dins el modal i reintentar sense que es tanqui.
  }, [replacingFromModal, status, error])

  const setValue = useCallback(
    (next: string) => {
      if (isControlled) onChange?.(next)
      else setInternalValue(next)
    },
    [isControlled, onChange]
  )

  const setAlt = useCallback(
    (next: string) => {
      if (isAltControlled) onAltChange?.(next)
      else setInternalAlt(next)
    },
    [isAltControlled, onAltChange]
  )

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_MIME.includes(file.type as (typeof ACCEPTED_MIME)[number])) {
      return `Format no admès (${file.type || 'desconegut'}). Usa JPG, PNG, WebP, AVIF, GIF o SVG.`
    }
    // Els fitxers grans NO es bloquegen aquí: s'optimitzen a WebP i es
    // revalida la mida un cop comprimits (veure uploadFile).
    if (file.size > MAX_INPUT_BYTES) {
      return `Fitxer massa gran (${formatBytes(file.size)}). Màxim ${formatBytes(MAX_INPUT_BYTES)}.`
    }
    // SVG i GIF no es poden optimitzar (vector / animació): han de cabre al
    // bucket tal com vénen.
    if (SKIP_COMPRESS_MIME.has(file.type) && file.size > MAX_BYTES) {
      const kind = file.type === 'image/svg+xml' ? 'SVG' : 'GIF'
      return `${kind} massa gran (${formatBytes(file.size)}). Màxim ${formatBytes(MAX_BYTES)} — aquest format no es pot optimitzar automàticament.`
    }
    return null
  }

  /**
   * Pre-processament d'una imatge abans de pujar-la:
   *   - SVG i GIF passen tal qual (l'un és vector, l'altre pot tenir
   *     animacions que browser-image-compression no preserva).
   *   - Si el fitxer ja és WebP/AVIF i prou petit (<300KB), no el toquem.
   *   - La resta es converteixen a WebP segons el perfil de la carpeta de
   *     destí (veure `profileFor`), amb WebWorker per no bloquejar la UI.
   *     Un PNG de 48 MB segueix sent vàlid: en surt un WebP dins del límit
   *     del bucket. Si el perfil no porta `maxSizeMB`, el guard dels 10 MB
   *     d'`uploadFile` és l'únic sostre de pes.
   *
   * Retorna el File a pujar (potser el mateix d'entrada, potser un de nou
   * més petit). Si la conversió falla, retorna l'original i log d'error;
   * qui crida ja revalida la mida contra el límit del bucket.
   */
  const optimiseImage = useCallback(async (file: File): Promise<File> => {
    if (SKIP_COMPRESS_MIME.has(file.type)) return file
    if (MODERN_MIME.has(file.type) && file.size < SKIP_COMPRESS_BYTES) return file
    const profile = profileFor(folder)
    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: profile.maxWidthOrHeight,
        initialQuality: profile.initialQuality,
        // Només el passem si el perfil en té: la llibreria el tracta com a
        // objectiu dur i baixa resolució per complir-lo.
        ...(profile.maxSizeMB !== undefined ? { maxSizeMB: profile.maxSizeMB } : {}),
        fileType: OUTPUT_MIME, // converteix a WebP sigui quin sigui l'origen
        useWebWorker: true,
        preserveExif: false,
      })
      // Si per algun motiu acaba més gran (cas patològic amb imatges molt
      // petites), conservem l'original — sempre el mínim entre els dos.
      return compressed.size < file.size ? compressed : file
    } catch (err) {
      console.warn('[ImageUploadField] optimisation failed, using original', err)
      return file
    }
  }, [folder])

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null)
      setLastCompression(null)
      const validation = validateFile(file)
      if (validation) {
        setStatus('error')
        setError(validation)
        return
      }

      try {
        setStatus('compressing')
        const optimised = await optimiseImage(file)
        if (optimised !== file) {
          setLastCompression({ before: file.size, after: optimised.size })
        }

        // Segona validació: el límit real és el del bucket i s'aplica al
        // fitxer que realment pugem. Només hi arribem si l'optimització ha
        // fallat o no ha pogut reduir prou.
        if (optimised.size > MAX_BYTES) {
          setStatus('error')
          setLastCompression(null)
          setError(
            `No s'ha pogut reduir la imatge per sota de ${formatBytes(MAX_BYTES)} (ha quedat en ${formatBytes(optimised.size)}). Prova d'exportar-la amb menys resolució.`
          )
          return
        }

        setStatus('uploading')
        const supabase = createClient()
        const outType = optimised.type || file.type
        const ext =
          MIME_EXT[outType] ||
          (optimised.name.split('.').pop() || file.name.split('.').pop() || 'png').toLowerCase()
        const baseName = file.name
          .replace(/\.[^.]+$/, '')
          .toLowerCase()
          .normalize('NFKD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 60) || 'image'
        const ts = Date.now()
        const path = `${folder}/${ts}-${baseName}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, optimised, {
            cacheControl: '31536000',
            upsert: false,
            contentType: outType,
          })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
        if (!data?.publicUrl) throw new Error('No s\'ha pogut obtenir la URL pública')

        setValue(data.publicUrl)
        setStatus('idle')
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Error desconegut pujant la imatge')
      }
    },
    [folder, setValue, optimiseImage]
  )

  // ----- Handlers -----

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    // Reset l'input perquè es pugui re-seleccionar el mateix fitxer
    if (inputRef.current) inputRef.current.value = ''
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const clearValue = () => {
    setValue('')
    setAlt('')
    setError(null)
    setStatus('idle')
  }

  const hasValue = currentValue.length > 0
  const isUploading = status === 'uploading'
  const isCompressing = status === 'compressing'
  /** L'usuari està fent feina amb un fitxer (compressing o uploading). */
  const isBusy = isCompressing || isUploading

  /** Accions que el pare pot disparar sense muntar la UI del camp. */
  useImperativeHandle(
    controlRef,
    () => ({
      openFilePicker: () => inputRef.current?.click(),
      openManager: () => setModalOpen(true),
    }),
    []
  )

  // Puja l'estat de la pujada al pare — en mode headless és l'única manera
  // que té de pintar el spinner i l'error.
  useEffect(() => {
    onStatusChange?.(isBusy, error)
  }, [isBusy, error, onStatusChange])

  const headless = variant === 'headless'

  return (
    <div className={headless ? 'contents' : 'flex flex-col gap-2'}>
      {label && !headless && (
        <label
          htmlFor={id}
          className={
            labelVariant === 'heading'
              ? 'inline-flex items-center gap-1 text-body-md font-light text-text-secondary'
              : 'inline-flex items-center gap-1 text-body-sm font-medium text-text-secondary'
          }
        >
          {label}
          {required && <span className="text-error">*</span>}
        </label>
      )}

      {/* Input file invisible — disparat des del dropzone, el botó pencil del
          preview o el botó "Reemplaçar fitxer" del modal. */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPTED_MIME.join(',')}
        onChange={onFileSelected}
        className="sr-only"
      />

      {/* Hidden fields per FormData (només si NO és controlat) */}
      {!isControlled && name && (
        <input type="hidden" name={name} value={currentValue} />
      )}
      {!isAltControlled && altName && (
        <input type="hidden" name={altName} value={currentAlt} />
      )}

      {/* ---- Vista amb imatge — variant 'overlay' ----
          Thumbnail quadrat amb pencil flotant top-right. Default —
          adequat per camps petits (Hero background, OG image, etc.). */}
      {hasValue && !isBusy && variant === 'overlay' && (
        <div
          className="relative w-full overflow-hidden rounded-md bg-surface-base border border-border-subtle"
          style={{ aspectRatio }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentValue}
            alt={currentAlt || label}
            className={`absolute inset-0 block w-full h-full rounded-md ${
              objectFit === 'cover' ? 'object-cover' : 'object-contain'
            }`}
            onError={() => setError('No s\'ha pogut carregar la previsualització')}
          />
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            title="Gestionar imatge"
            aria-label="Gestionar imatge"
            className="absolute top-2 right-2 z-10 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-surface-base text-text-main shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)] backdrop-blur-[5px] hover:bg-surface-card transition-colors"
          >
            <PencilSimple size={16} weight="regular" />
          </button>
        </div>
      )}

      {/* ---- Vista amb imatge — variant 'card-info' ----
          Row horitzontal: imatge esquerra (square) + columna dreta amb
          file name, alt text i 4 botons d'acció. Patró Figma per al
          thumbnail principal del work — la metadata és visible sense
          haver d'obrir cap modal. */}
      {hasValue && !isBusy && variant === 'card-info' && (
        <ThumbnailCardInfo
          imageUrl={currentValue}
          imageAlt={currentAlt}
          label={label}
          onError={() => setError('No s\'ha pogut carregar la previsualització')}
          onEdit={() => setModalOpen(true)}
          onReplace={() => inputRef.current?.click()}
          onOpenUrl={() => {
            if (typeof window !== 'undefined') {
              window.open(currentValue, '_blank', 'noopener,noreferrer')
            }
          }}
          onDelete={clearValue}
        />
      )}

      {/* ---- Dropzone (quan no hi ha valor, o mentre puja/comprimix) ---- */}
      {(!hasValue || isBusy) && !headless && (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragEnter={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !isBusy && inputRef.current?.click()}
          role="button"
          tabIndex={isBusy ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !isBusy) {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          aria-disabled={isBusy}
          className={`relative flex flex-col items-center justify-center gap-2 px-6 py-8 border-2 border-dashed rounded-[var(--radius-base)] cursor-pointer transition-colors text-center ${
            isDragging
              ? 'border-text-main bg-text-main/5'
              : 'border-border-subtle bg-surface-card hover:border-text-secondary hover:bg-surface-base'
          } ${isBusy ? 'pointer-events-none opacity-90' : ''}`}
        >
          {isCompressing ? (
            <>
              <CircleNotch size={28} weight="regular" className="animate-spin text-text-main" />
              <span className="text-body-md text-text-main">Optimitzant imatge…</span>
              <span className="text-body-sm text-text-secondary">Convertint a WebP i reduint la mida</span>
            </>
          ) : isUploading ? (
            <>
              <CircleNotch size={28} weight="regular" className="animate-spin text-text-main" />
              <span className="text-body-md text-text-main">Pujant imatge…</span>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-surface-base border border-border-subtle flex items-center justify-center text-text-secondary">
                <CloudArrowUp size={22} weight="regular" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-body-md text-text-main">
                  Arrossega una imatge o <span className="underline underline-offset-4">tria un fitxer</span>
                </span>
                <span className="text-body-sm text-text-secondary">
                  JPG, PNG, WebP, AVIF, GIF o SVG · s&apos;optimitzen a WebP automàticament
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ---- Error ---- */}
      {error && !headless && (
        <p role="alert" className="inline-flex items-start gap-2 text-body-sm text-error">
          <Warning size={16} weight="fill" className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* ---- Feedback de la compressió ---- */}
      {lastCompression && status === 'idle' && !error && !headless && (
        <p className="inline-flex items-center gap-1.5 text-body-sm text-accent">
          <span aria-hidden>✓</span>
          <span>
            Optimitzat de {formatBytes(lastCompression.before)} a {formatBytes(lastCompression.after)}{' '}
            <span className="text-text-secondary/80">
              ({Math.round((1 - lastCompression.after / lastCompression.before) * 100)}% menys)
            </span>
          </span>
        </p>
      )}

      {/* ---- Hint ---- */}
      {hint && !error && !lastCompression && !headless && (
        <p className="text-body-sm text-text-secondary/80 leading-snug">{hint}</p>
      )}

      {/* ---- Modal de gestió ---- */}
      {modalOpen && (
        <ImageManagementModal
          imageUrl={currentValue}
          imageAlt={currentAlt}
          aspectRatio={aspectRatio}
          status={status}
          error={error}
          lastCompression={lastCompression}
          onClose={() => {
            // No deixem tancar mentre s'està pujant: evita descartar visualment
            // un upload en curs (encara que la promesa segueix viva).
            if (isBusy) return
            setModalOpen(false)
            setReplacingFromModal(false)
          }}
          onReplaceClick={() => {
            setReplacingFromModal(true)
            inputRef.current?.click()
          }}
          onAltChange={setAlt}
          onDelete={() => {
            clearValue()
            setModalOpen(false)
            setReplacingFromModal(false)
          }}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  ThumbnailCardInfo — variant 'card-info' del preview                */
/* ------------------------------------------------------------------ */

/**
 * Vista alternativa del thumbnail amb metadata inline al costat.
 * Patró Figma 11192:11214 — pensat per al thumbnail principal del work,
 * on importa veure el File Name i l'Alt Text sense haver d'obrir cap
 * modal. Les 4 accions (edit alt, copy URL, open URL, delete) viuen com
 * a botons icon-only sota la metadata.
 *
 * Layout: row flex amb gap-6.
 *   ── LEFT: imatge quadrada (aspectRatio configurable, default usa el
 *      que el pare passi al ImageUploadField)
 *   ── RIGHT col flex-1:
 *      · "File Name" caption + filename truncat
 *      · divider
 *      · "Alt Text" caption + valor (o placeholder si està buit)
 *      · divider
 *      · row de 4 botons justify-end
 */
function ThumbnailCardInfo({
  imageUrl,
  imageAlt,
  label,
  onError,
  onEdit,
  onReplace,
  onOpenUrl,
  onDelete,
}: {
  imageUrl: string
  imageAlt: string
  label: string
  onError: () => void
  onEdit: () => void
  onReplace: () => void
  onOpenUrl: () => void
  onDelete: () => void
}) {
  const filename = filenameFromUrl(imageUrl)

  /**
   * Sincronitzar mida del thumbnail amb l'alçada de la columna dreta.
   * CSS pur no pot resoldre `aspect-square + height: 100%` quan el width
   * en depèn (referència circular). La solució neta és mesurar la
   * columna dreta amb ResizeObserver i aplicar `width=height=N` al
   * thumbnail a desktop. A mobile (flex-col), `w-full + aspect-square`
   * funciona perquè el width es coneix.
   */
  const rightColRef = useRef<HTMLDivElement>(null)
  const [matchedSize, setMatchedSize] = useState<number | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const el = rightColRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setMatchedSize(entry.contentRect.height)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Aplica width=height a desktop només quan hem mesurat. A mobile,
  // l'estil queda undefined i les classes Tailwind (w-full + aspect-square)
  // fan la feina sense conflicte.
  const desktopSize = isDesktop && matchedSize ? matchedSize : null

  return (
    <div className="flex flex-col md:flex-row gap-6 items-stretch">
      {/* LEFT — imatge SEMPRE square (object-cover). A desktop la mida
          es deriva de l'alçada de la columna dreta (inclou padding
          py-6 = 48px). A mobile, w-full + aspect-square dóna un
          square gran ocupant tota l'amplada. */}
      <div
        className="relative w-full md:w-auto aspect-square md:aspect-auto md:shrink-0 overflow-hidden rounded-md bg-surface-base border border-border-subtle"
        style={
          desktopSize !== null
            ? { width: `${desktopSize}px`, height: `${desktopSize}px` }
            : undefined
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={imageAlt || label}
          className="absolute inset-0 block w-full h-full object-cover rounded-md"
          onError={onError}
        />
      </div>

      {/* RIGHT — metadata + botons d'acció.
          Padding vertical 24px (md:py-6) coincident amb el Figma.
          El ref permet mesurar la seva alçada amb ResizeObserver per
          sincronitzar la mida del thumbnail (square) a desktop. */}
      <div ref={rightColRef} className="flex-1 flex flex-col gap-4 min-w-0 md:py-6">
        {/* File Name */}
        <div className="flex flex-col">
          <span className="text-body-sm text-text-secondary leading-tight">
            File Name
          </span>
          <span
            className="text-body-md font-light text-text-main truncate"
            title={filename}
          >
            {filename}
          </span>
        </div>

        <div className="h-px bg-border-subtle" aria-hidden />

        {/* Alt Text */}
        <div className="flex flex-col">
          <span className="text-body-sm text-text-secondary leading-tight">
            Alt Text
          </span>
          <span
            className={`text-body-md font-light truncate ${
              imageAlt ? 'text-text-main' : 'text-text-secondary/60 italic'
            }`}
            title={imageAlt || 'Sense alt text'}
          >
            {imageAlt || 'Sense alt text'}
          </span>
        </div>

        <div className="h-px bg-border-subtle" aria-hidden />

        {/* Botons d'acció — 4 icones alineades a l'esquerra. Així
            s'alineen amb les labels (File Name, Alt Text) i amb la
            jerarquia de lectura natural de la columna. */}
        <div className="flex items-center justify-start gap-2">
          <ThumbnailIconButton
            label="Editar"
            title="Editar alt text i reemplaçar"
            onClick={onEdit}
          >
            <PencilSimple size={14} weight="regular" />
          </ThumbnailIconButton>
          <ThumbnailIconButton
            label="Reemplaçar fitxer"
            title="Reemplaçar fitxer"
            onClick={onReplace}
          >
            <Copy size={14} weight="regular" />
          </ThumbnailIconButton>
          <ThumbnailIconButton
            label="Obrir URL en nova pestanya"
            title="Obrir en nova pestanya"
            onClick={onOpenUrl}
          >
            <ArrowSquareOut size={14} weight="regular" />
          </ThumbnailIconButton>
          <ThumbnailIconButton
            label="Esborrar imatge"
            title="Esborrar imatge"
            danger
            onClick={onDelete}
          >
            <Trash size={14} weight="regular" />
          </ThumbnailIconButton>
        </div>
      </div>
    </div>
  )
}

/** Botó icon-only del Thumbnail card (32×32 + border subtil + shadow). */
function ThumbnailIconButton({
  label,
  title,
  danger,
  onClick,
  children,
}: {
  label: string
  title: string
  danger?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={label}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border bg-surface-base shadow-[0_4px_20px_0px_rgba(0,0,0,0.08)] transition-colors ${
        danger
          ? 'border-error/40 text-error hover:border-error hover:bg-error-surface'
          : 'border-border-default text-text-main hover:border-text-main hover:bg-surface-card'
      }`}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  ImageManagementModal                                               */
/* ------------------------------------------------------------------ */

/**
 * Modal de gestió de la imatge actual. Agrupa les 3 accions habituals:
 *   - Reemplaçar fitxer (re-obre el file picker)
 *   - Editar Alt text (input controlat)
 *   - Esborrar (acció destructiva, sense confirmació — l'usuari pot
 *     re-pujar fàcilment, no és destrucció de dades irrevocables)
 *
 * Tots els canvis es propaguen instantàniament al pare via `onAltChange`.
 * No hi ha botó "Desar" — l'autosave del WorkForm s'encarrega de
 * persistir-los.
 */
function ImageManagementModal({
  imageUrl,
  imageAlt,
  aspectRatio,
  status,
  error,
  lastCompression,
  onClose,
  onReplaceClick,
  onAltChange,
  onDelete,
}: {
  imageUrl: string
  imageAlt: string
  aspectRatio: string
  status: 'idle' | 'compressing' | 'uploading' | 'error'
  error: string | null
  lastCompression: { before: number; after: number } | null
  onClose: () => void
  onReplaceClick: () => void
  onAltChange: (next: string) => void
  onDelete: () => void
}) {
  const isCompressing = status === 'compressing'
  const isUploading = status === 'uploading'
  const isBusy = isCompressing || isUploading

  // Tancar amb Escape — patró estàndard per a modals. Mentre s'està pujant
  // bloquegem la sortida per no perdre el feedback de progrés.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isBusy) {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, isBusy])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gestionar imatge"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop: click per tancar */}
      <div
        aria-hidden
        className="absolute inset-0 bg-text-main/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Contingut del modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface-card border border-border-subtle rounded-[var(--radius-base)] shadow-xl flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border-subtle">
          <h3 className="text-body-lg font-medium text-text-main">Gestionar imatge</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            title={isBusy ? 'Esperant a que acabi la pujada…' : 'Tancar'}
            aria-label="Tancar"
            className="inline-flex items-center justify-center w-8 h-8 rounded text-text-secondary hover:text-text-main hover:bg-surface-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-secondary"
          >
            <X size={16} weight="regular" />
          </button>
        </header>

        <div className="flex flex-col gap-5 p-5">
          {/* Preview de la imatge actual — amb overlay de progrés quan s'està
              comprimint o pujant. L'overlay tapa la imatge antiga amb una
              capa semitransparent + spinner + missatge perquè quedi 100%
              clar que el sistema està treballant. */}
          <div
            className="relative w-full overflow-hidden rounded-md bg-surface-base/60 border border-border-subtle"
            style={{ aspectRatio, maxHeight: '18rem' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={imageAlt || 'Imatge actual'}
              className="absolute inset-0 block w-full h-full object-contain"
            />
            {isBusy && (
              <div
                role="status"
                aria-live="polite"
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-surface-card/85 backdrop-blur-sm"
              >
                <CircleNotch
                  size={32}
                  weight="regular"
                  className="animate-spin text-text-main"
                />
                <span className="text-body-md text-text-main">
                  {isCompressing ? 'Optimitzant imatge…' : 'Pujant imatge…'}
                </span>
                <span className="text-body-sm text-text-secondary">
                  {isCompressing
                    ? 'Redueix la mida sense pèrdua visible'
                    : 'Un moment, gairebé hi som'}
                </span>
              </div>
            )}
          </div>

          {/* Feedback de pujada — error o resum de compressió, dins el modal
              per estar a la vista mentre l'usuari gestiona la imatge. */}
          {error && (
            <p role="alert" className="inline-flex items-start gap-2 text-body-sm text-error -mt-2">
              <Warning size={16} weight="fill" className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}
          {lastCompression && !isBusy && !error && (
            <p className="inline-flex items-center gap-1.5 text-body-sm text-accent -mt-2">
              <span aria-hidden>✓</span>
              <span>
                Optimitzat de {formatBytes(lastCompression.before)} a {formatBytes(lastCompression.after)}{' '}
                <span className="text-text-secondary/80">
                  ({Math.round((1 - lastCompression.after / lastCompression.before) * 100)}% menys)
                </span>
              </span>
            </p>
          )}

          {/* Acció: Reemplaçar fitxer */}
          <div className="flex flex-col gap-1.5">
            <span className="text-body-sm font-medium text-text-secondary">
              Fitxer
            </span>
            <button
              type="button"
              onClick={onReplaceClick}
              disabled={isBusy}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-border-default rounded-md text-body-md text-text-main hover:border-text-main hover:bg-surface-base transition-colors w-fit disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border-default disabled:hover:bg-transparent"
            >
              {isBusy ? (
                <>
                  <CircleNotch size={16} weight="regular" className="animate-spin" />
                  {isCompressing ? 'Optimitzant…' : 'Pujant…'}
                </>
              ) : (
                <>
                  <ArrowsCounterClockwise size={16} weight="regular" />
                  Reemplaçar fitxer
                </>
              )}
            </button>
          </div>

          {/* Acció: Alt text */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="img-modal-alt"
              className="text-body-sm font-medium text-text-secondary"
            >
              Alt text
            </label>
            <input
              id="img-modal-alt"
              type="text"
              value={imageAlt}
              onChange={(e) => onAltChange(e.target.value)}
              placeholder="Ex: Pantalla principal de l'app PADLL amb el mapa de pistes"
              maxLength={200}
              className="w-full bg-transparent border border-border-default rounded-md px-3 py-2 text-text-main font-sans text-body-md placeholder:text-text-secondary/50 transition-colors hover:border-text-secondary/60 focus:outline-none focus:border-text-main focus:ring-2 focus:ring-text-main/20"
            />
            <p className="text-body-sm text-text-secondary/80 leading-snug">
              Descripció curta de la imatge per a screen readers i SEO. Si està
              buit, els lectors de pantalla usaran el títol del treball.
            </p>
          </div>

          {/* Acció: Esborrar (destructiva, separada visualment) */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-border-subtle">
            <span className="text-body-sm font-medium text-text-secondary">
              Zona perillosa
            </span>
            <button
              type="button"
              onClick={onDelete}
              disabled={isBusy}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-error/30 text-error rounded-md text-body-md hover:bg-error-surface hover:border-error transition-colors w-fit disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-error/30"
            >
              <Trash size={16} weight="regular" />
              Esborrar imatge
            </button>
            <p className="text-body-sm text-text-secondary/80 leading-snug">
              Elimina la imatge i l&apos;alt text del treball. Pots tornar a pujar-ne una de nova.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`
}

/**
 * Extreu el nom de fitxer d'una URL. Si és una URL absoluta amb path,
 * agafa l'últim segment. Si és relativa o invàlida, treu el text
 * després de l'última `/`. Decoded URI per mostrar caràcters Unicode
 * (accents, etc.) correctament. Fallback al string sencer si no troba
 * cap segment vàlid.
 */
function filenameFromUrl(url: string): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    const last = u.pathname.split('/').filter(Boolean).pop() || url
    return decodeURIComponent(last)
  } catch {
    const last = url.split('/').filter(Boolean).pop() || url
    return last
  }
}
