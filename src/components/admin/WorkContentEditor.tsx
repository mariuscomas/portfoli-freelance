"use client"

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useReducer, useRef, useState } from 'react'
import {
  Plus,
  Trash,
  CaretUp,
  CaretDown,
  CaretRight,
  CaretUpDown,
  DotsSixVertical,
  Warning,
  PencilSimple,
  ArrowsCounterClockwise,
  ArrowSquareOut,
  Eye,
  Rows,
  GridFour,
  X,
} from '@phosphor-icons/react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DraggableSyntheticListeners,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import ImageUploadField from './ImageUploadField'
import RichTextEditor from './RichTextEditor'
import ColorField from './ColorField'
import { useConfirm } from './useConfirm'
import type { WorkDetailData, WorkBlock, WorkMedia, WorkTextSection } from '@/types/works'

/**
 * <WorkContentEditor />
 *
 * Editor estructurat per al camp `content` (jsonb) de la taula `works`.
 * Substitueix el textarea JSON cru per una UI amb camps separats per
 * cada secció, blocs col·lapsables i reordenació amb fletxes.
 *
 * Serialitza l'estat actual en un <input type="hidden" name="content_json">
 * perquè el server action `updateWork` (que llegeix `content_json` com a
 * string i fa JSON.parse) continuï funcionant sense canvis.
 */

// -----------------------------------------------------------------------
// Tipus de l'estat local. Coincideix amb WorkDetailData del types/works.ts
// però sense `id` ni `slug` que viuen com a columnes pròpies a la taula.
// -----------------------------------------------------------------------

type HeroState = {
  title: string
  description: string
  backgroundMode: 'color' | 'image'
  backgroundColor: string
  backgroundImage: string
  overlayOpacity: number // 0–80
  textColor: 'light' | 'dark'
}

type ContentState = {
  hero: HeroState
  blocks: WorkBlock[]
  conclusion: string
  finalMedia: WorkMedia[]
}

const EMPTY_STATE: ContentState = {
  hero: {
    title: '',
    description: '',
    backgroundMode: 'color',
    backgroundColor: '#1A1A1A',
    backgroundImage: '',
    overlayOpacity: 0,
    textColor: 'light',
  },
  blocks: [],
  conclusion: '',
  finalMedia: [],
}

// -----------------------------------------------------------------------
// Reducer — totes les mutacions passen aquí. Així no hi ha incoherències.
// -----------------------------------------------------------------------

type Action =
  | { type: 'SET_HERO_TEXT'; field: 'title' | 'description'; value: string }
  | { type: 'SET_HERO_MODE'; value: 'color' | 'image' }
  | { type: 'SET_HERO_COLOR'; value: string }
  | { type: 'SET_HERO_IMAGE'; value: string }
  | { type: 'SET_HERO_OVERLAY'; value: number }
  | { type: 'SET_HERO_TEXT_COLOR'; value: 'light' | 'dark' }
  | { type: 'SET_CONCLUSION'; value: string }
  | { type: 'ADD_BLOCK' }
  | { type: 'REMOVE_BLOCK'; index: number }
  | { type: 'MOVE_BLOCK'; index: number; direction: -1 | 1 }
  | { type: 'REORDER_BLOCKS'; fromId: string; toId: string }
  | { type: 'REORDER_FINAL_MEDIA'; fromId: string; toId: string }
  | { type: 'SET_BLOCK_FIELD'; index: number; field: keyof WorkTextSection; value: string }
  | { type: 'SET_BLOCK_LIST_TYPE'; index: number; value: NonNullable<WorkTextSection['listType']> }
  | { type: 'SET_BLOCK_LIST_ITEMS'; index: number; value: string[] }
  | { type: 'SET_BLOCK_LIST_DETAILS'; index: number; value: { label: string; value: string }[] }
  | { type: 'ADD_BLOCK_MEDIA'; index: number }
  | { type: 'REMOVE_BLOCK_MEDIA'; index: number; mediaIndex: number }
  | { type: 'REORDER_BLOCK_MEDIA'; index: number; fromId: string; toId: string }
  | { type: 'SET_BLOCK_MEDIA_FIELD'; index: number; mediaIndex: number; field: keyof WorkMedia; value: string }
  | { type: 'ADD_FINAL_MEDIA' }
  | { type: 'REMOVE_FINAL_MEDIA'; index: number }
  | { type: 'SET_FINAL_MEDIA_FIELD'; index: number; field: keyof WorkMedia; value: string }

function genId(prefix = 'b'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

function reducer(state: ContentState, action: Action): ContentState {
  switch (action.type) {
    case 'SET_HERO_TEXT':
      return { ...state, hero: { ...state.hero, [action.field]: action.value } }

    case 'SET_HERO_MODE':
      return { ...state, hero: { ...state.hero, backgroundMode: action.value } }

    case 'SET_HERO_COLOR':
      return { ...state, hero: { ...state.hero, backgroundColor: action.value } }

    case 'SET_HERO_IMAGE': {
      // Auto-set del backgroundMode: si l'admin afegeix una imatge → 'image'
      // (el frontend la renderitzarà); si la treu → 'color' (fallback al fons sòlid).
      // Així el toggle Color/Imatge del UI antic ja no és necessari.
      const hasImage = Boolean(action.value)
      return {
        ...state,
        hero: {
          ...state.hero,
          backgroundImage: action.value,
          backgroundMode: hasImage ? 'image' : 'color',
        },
      }
    }

    case 'SET_HERO_OVERLAY':
      return {
        ...state,
        hero: {
          ...state.hero,
          overlayOpacity: Math.max(0, Math.min(80, Math.round(action.value))),
        },
      }

    case 'SET_HERO_TEXT_COLOR':
      return { ...state, hero: { ...state.hero, textColor: action.value } }

    case 'SET_CONCLUSION':
      return { ...state, conclusion: action.value }

    case 'ADD_BLOCK': {
      const nextNumber = String(state.blocks.length + 1).padStart(2, '0')
      const newBlock: WorkBlock = {
        id: genId(),
        textSection: {
          id: genId('ts'),
          number: nextNumber,
          title: '',
          heading: '',
          description: '',
          listType: 'none',
        },
        media: [],
      }
      return { ...state, blocks: [...state.blocks, newBlock] }
    }

    case 'REMOVE_BLOCK':
      return { ...state, blocks: state.blocks.filter((_, i) => i !== action.index) }

    case 'MOVE_BLOCK': {
      const newIndex = action.index + action.direction
      if (newIndex < 0 || newIndex >= state.blocks.length) return state
      const blocks = [...state.blocks]
      ;[blocks[action.index], blocks[newIndex]] = [blocks[newIndex], blocks[action.index]]
      return { ...state, blocks }
    }

    case 'REORDER_BLOCKS': {
      const fromIdx = state.blocks.findIndex((b) => b.id === action.fromId)
      const toIdx = state.blocks.findIndex((b) => b.id === action.toId)
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return state
      const blocks = [...state.blocks]
      const [moved] = blocks.splice(fromIdx, 1)
      blocks.splice(toIdx, 0, moved)
      return { ...state, blocks }
    }

    case 'REORDER_FINAL_MEDIA': {
      const fromIdx = state.finalMedia.findIndex((m) => m.id === action.fromId)
      const toIdx = state.finalMedia.findIndex((m) => m.id === action.toId)
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return state
      const finalMedia = [...state.finalMedia]
      const [moved] = finalMedia.splice(fromIdx, 1)
      finalMedia.splice(toIdx, 0, moved)
      return { ...state, finalMedia }
    }

    case 'SET_BLOCK_FIELD':
      return {
        ...state,
        blocks: state.blocks.map((b, i) =>
          i === action.index
            ? { ...b, textSection: { ...b.textSection, [action.field]: action.value } }
            : b
        ),
      }

    case 'SET_BLOCK_LIST_TYPE':
      return {
        ...state,
        blocks: state.blocks.map((b, i) =>
          i === action.index
            ? { ...b, textSection: { ...b.textSection, listType: action.value } }
            : b
        ),
      }

    case 'SET_BLOCK_LIST_ITEMS':
      return {
        ...state,
        blocks: state.blocks.map((b, i) =>
          i === action.index
            ? { ...b, textSection: { ...b.textSection, listItems: action.value } }
            : b
        ),
      }

    case 'SET_BLOCK_LIST_DETAILS':
      return {
        ...state,
        blocks: state.blocks.map((b, i) =>
          i === action.index
            ? { ...b, textSection: { ...b.textSection, listDetails: action.value } }
            : b
        ),
      }

    case 'ADD_BLOCK_MEDIA':
      return {
        ...state,
        blocks: state.blocks.map((b, i) =>
          i === action.index
            ? { ...b, media: [...b.media, { id: genId('m'), url: '', type: 'image' }] }
            : b
        ),
      }

    case 'REMOVE_BLOCK_MEDIA':
      return {
        ...state,
        blocks: state.blocks.map((b, i) =>
          i === action.index
            ? { ...b, media: b.media.filter((_, mi) => mi !== action.mediaIndex) }
            : b
        ),
      }

    case 'REORDER_BLOCK_MEDIA': {
      return {
        ...state,
        blocks: state.blocks.map((b, i) => {
          if (i !== action.index) return b
          const fromIdx = b.media.findIndex((m) => m.id === action.fromId)
          const toIdx = b.media.findIndex((m) => m.id === action.toId)
          if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return b
          const media = [...b.media]
          const [moved] = media.splice(fromIdx, 1)
          media.splice(toIdx, 0, moved)
          return { ...b, media }
        }),
      }
    }

    case 'SET_BLOCK_MEDIA_FIELD':
      return {
        ...state,
        blocks: state.blocks.map((b, i) =>
          i === action.index
            ? {
                ...b,
                media: b.media.map((m, mi) =>
                  mi === action.mediaIndex ? { ...m, [action.field]: action.value } : m
                ),
              }
            : b
        ),
      }

    case 'ADD_FINAL_MEDIA':
      return {
        ...state,
        finalMedia: [...state.finalMedia, { id: genId('fm'), url: '', type: 'image' }],
      }

    case 'REMOVE_FINAL_MEDIA':
      return { ...state, finalMedia: state.finalMedia.filter((_, i) => i !== action.index) }

    case 'SET_FINAL_MEDIA_FIELD':
      return {
        ...state,
        finalMedia: state.finalMedia.map((m, i) =>
          i === action.index ? { ...m, [action.field]: action.value } : m
        ),
      }

    default:
      return state
  }
}

// -----------------------------------------------------------------------
// Inicialització: si l'usuari ja té content desat, l'usem; si no, blank.
//
// Compat: dades antigues poden tenir camps i18n {ca,en,es} dins del JSON
// content. L'editor actual treballa amb strings purs (mono-idioma CA),
// així que normalitzem qualsevol objecte translatable a string extraient
// la versió CA (o la primera disponible).
// -----------------------------------------------------------------------

function isTranslatable(v: unknown): v is { ca?: string; en?: string; es?: string } {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false
  const keys = Object.keys(v as object)
  if (keys.length === 0) return false
  // És translatable si TOTS els seus keys són codis d'idioma coneguts
  const langKeys = new Set(['ca', 'en', 'es', 'fr', 'de', 'pt', 'it'])
  return keys.every((k) => langKeys.has(k))
}

function pickTranslatable(v: { ca?: string; en?: string; es?: string }): string {
  return v.ca ?? v.en ?? v.es ?? ''
}

/** Converteix recursivament objectes i18n a strings (versió CA prioritària). */
function flattenI18n(value: unknown): unknown {
  if (value == null) return value
  if (isTranslatable(value)) return pickTranslatable(value)
  if (Array.isArray(value)) return value.map(flattenI18n)
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = flattenI18n(v)
    }
    return out
  }
  return value
}

function asString(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (isTranslatable(v)) return pickTranslatable(v)
  return fallback
}

function normalizeInitial(initial: unknown): ContentState {
  if (!initial || typeof initial !== 'object') return EMPTY_STATE
  // Aplanem recursivament qualsevol i18n abans de mapejar al state local
  const i = flattenI18n(initial) as Partial<WorkDetailData> & {
    hero?: {
      title?: unknown
      description?: unknown
      backgroundMode?: unknown
      backgroundColor?: unknown
      backgroundImage?: unknown
      overlayOpacity?: unknown
      textColor?: unknown
    }
  }
  const rawImage = asString(i.hero?.backgroundImage)
  const rawMode = asString(i.hero?.backgroundMode)
  // Retrocompat: si el JSON no diu el mode però ja porta imatge, assumim 'image'.
  const heroMode: 'color' | 'image' =
    rawMode === 'image' ? 'image' : rawMode === 'color' ? 'color' : rawImage ? 'image' : 'color'
  const rawOverlay = i.hero?.overlayOpacity
  const overlay =
    typeof rawOverlay === 'number'
      ? Math.max(0, Math.min(80, Math.round(rawOverlay)))
      : 0
  const rawTextColor = asString(i.hero?.textColor)
  const textColor: 'light' | 'dark' = rawTextColor === 'dark' ? 'dark' : 'light'
  return {
    hero: {
      title: asString(i.hero?.title),
      description: asString(i.hero?.description),
      backgroundMode: heroMode,
      backgroundColor: asString(i.hero?.backgroundColor, '#1A1A1A'),
      backgroundImage: rawImage,
      overlayOpacity: overlay,
      textColor,
    },
    blocks: Array.isArray(i.blocks)
      ? (i.blocks as WorkBlock[]).map((b) => ({
          ...b,
          textSection: {
            id: asString(b.textSection?.id, genId('ts')),
            number: asString(b.textSection?.number),
            title: asString(b.textSection?.title),
            heading: asString(b.textSection?.heading),
            description: asString(b.textSection?.description),
            listType: (b.textSection?.listType as WorkTextSection['listType']) || 'none',
            listItems: Array.isArray(b.textSection?.listItems)
              ? b.textSection.listItems.map((x) => asString(x))
              : undefined,
            listDetails: Array.isArray(b.textSection?.listDetails)
              ? b.textSection.listDetails.map((d) => ({
                  label: asString((d as { label?: unknown })?.label),
                  value: asString((d as { value?: unknown })?.value),
                }))
              : undefined,
          },
          media: Array.isArray(b.media)
            ? b.media.map((m) => ({
                id: asString(m.id, genId('m')),
                url: asString(m.url),
                type: (m.type as WorkMedia['type']) || 'image',
                alt: m.alt ? asString(m.alt) : undefined,
              }))
            : [],
        }))
      : [],
    conclusion: asString(i.conclusion),
    finalMedia: Array.isArray(i.finalMedia)
      ? i.finalMedia.map((m) => ({
          id: asString(m.id, genId('fm')),
          url: asString(m.url),
          type: (m.type as WorkMedia['type']) || 'image',
          alt: m.alt ? asString(m.alt) : undefined,
        }))
      : [],
  }
}

// -----------------------------------------------------------------------
// Component principal
// -----------------------------------------------------------------------

/**
 * Comptadors d'avisos soft per a cada subsecció. Es propaguen al pare
 * (`WorkForm`) perquè el TOC pugui dibuixar punts d'alerta al costat
 * de les seccions amb problemes.
 */
export interface EditorValidationCounts {
  hero: number
  blocs: number
  conclusio: number
  finalmedia: number
}

/* ------------------------------------------------------------------ */
/*  Context — comparteix state + dispatch entre WorkContentEditor      */
/*  (Hero + Blocs) i FinalMediaSection (renderitzat dins la Tancament  */
/*  card del WorkForm). Així els dos editen el mateix `content` JSON   */
/*  que es serialitza al hidden input.                                  */
/* ------------------------------------------------------------------ */

type ContentEditorContextValue = {
  state: ContentState
  dispatch: React.Dispatch<Action>
}

const ContentEditorContext = createContext<ContentEditorContextValue | null>(null)

function useContentEditor(): ContentEditorContextValue {
  const ctx = useContext(ContentEditorContext)
  if (!ctx) {
    throw new Error('useContentEditor must be used within ContentEditorProvider')
  }
  return ctx
}

/**
 * Provider que conté l'estat del case study (reducer) i la
 * serialització al hidden input `content_json`. Envoltant la Case
 * study card i la Tancament card al WorkForm, ambdues poden
 * accedir/modificar les mateixes dades.
 */
export function ContentEditorProvider({
  initial,
  onContentChange,
  children,
}: {
  initial?: unknown
  onContentChange?: () => void
  children: React.ReactNode
}) {
  const [state, dispatch] = useReducer(reducer, normalizeInitial(initial))

  // Serialització a JSON pel hidden input — el server segueix llegint
  // `content_json` igual que abans, sense canvis al backend.
  const serialized = JSON.stringify(
    {
      hero: state.hero,
      blocks: state.blocks,
      conclusion: state.conclusion,
      finalMedia: state.finalMedia,
    },
    null,
    2,
  )

  // Notifica al pare quan canvia el contingut (per marcar "Canvis
  // sense desar" instantàniament, sense esperar el poll d'autosave).
  // Saltem el primer render (montatge inicial amb les dades del work).
  const onContentChangeRef = useRef(onContentChange)
  useEffect(() => {
    onContentChangeRef.current = onContentChange
  })
  const prevSerializedRef = useRef<string>(serialized)
  useEffect(() => {
    if (prevSerializedRef.current === serialized) return
    prevSerializedRef.current = serialized
    onContentChangeRef.current?.()
  }, [serialized])

  return (
    <ContentEditorContext.Provider value={{ state, dispatch }}>
      {/* Hidden input — el server action segueix llegint content_json */}
      <input type="hidden" name="content_json" value={serialized} readOnly />
      {children}
    </ContentEditorContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
/*  BlocksUIProvider — estat d'UI compartit dels blocs (col·lapse).    */
/*                                                                     */
/*  Viu separat del ContentEditor perquè és estat només-UI (no es      */
/*  persisteix al `content_json`). Però el necessitem en un context    */
/*  perquè el `BlocksToolbar` (que viu al headerRight del Card al      */
/*  WorkForm) pugui controlar el col·lapse global, mentre que cada     */
/*  bloc individual al `BlocksSection` també pot togglejar el seu     */
/*  estat. La persistència a localStorage segueix sent per workId.    */
/* ------------------------------------------------------------------ */

type BlocksUIContextValue = {
  openBlocks: Set<string>
  toggleBlock: (id: string) => void
  expandAll: () => void
  collapseAll: () => void
  allBlocksOpen: boolean
  hasMultipleBlocks: boolean
}

const BlocksUIContext = createContext<BlocksUIContextValue | null>(null)

function useBlocksUI(): BlocksUIContextValue {
  const ctx = useContext(BlocksUIContext)
  if (!ctx) {
    throw new Error('useBlocksUI must be used within BlocksUIProvider')
  }
  return ctx
}

export function BlocksUIProvider({
  workId,
  children,
}: {
  /**
   * ID del work — usat per persistir l'estat d'expansió a localStorage.
   * Sense workId (cas drafts nous), no es persisteix res; el comportament
   * per defecte és obrir només el primer bloc.
   */
  workId?: string
  children: React.ReactNode
}) {
  const { state } = useContentEditor()
  const storageKey = workId ? `work-editor:openBlocks:${workId}` : null

  // Init SSR-safe — primer bloc obert per defecte.
  const [openBlocks, setOpenBlocks] = useState<Set<string>>(() => {
    return new Set(state.blocks.slice(0, 1).map((b) => b.id))
  })

  // Hidrata des de localStorage al primer mount (no fer-ho a init evita
  // hydration mismatches: el servidor no té accés a localStorage).
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return
      const arr = JSON.parse(raw) as string[]
      if (!Array.isArray(arr)) return
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpenBlocks(new Set(arr))
    } catch {
      /* localStorage corromput o restringit — mantenim el default */
    }
  }, [storageKey])

  // Persistència cada vegada que canvia openBlocks
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...openBlocks]))
    } catch {
      /* QuotaExceeded o storage off — silenciós */
    }
  }, [openBlocks, storageKey])

  // Auto-obre blocs acabats d'afegir.
  const knownBlockIdsRef = useRef<Set<string>>(new Set(state.blocks.map((b) => b.id)))
  useEffect(() => {
    const currentIds = state.blocks.map((b) => b.id)
    const newIds = currentIds.filter((id) => !knownBlockIdsRef.current.has(id))
    if (newIds.length > 0) {
      setOpenBlocks((prev) => {
        const next = new Set(prev)
        newIds.forEach((id) => next.add(id))
        return next
      })
    }
    knownBlockIdsRef.current = new Set(currentIds)
  }, [state.blocks])

  const toggleBlock = useCallback((id: string) => {
    setOpenBlocks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const expandAll = useCallback(() => {
    setOpenBlocks(new Set(state.blocks.map((b) => b.id)))
  }, [state.blocks])

  const collapseAll = useCallback(() => setOpenBlocks(new Set()), [])

  const allBlocksOpen =
    state.blocks.length > 0 && state.blocks.every((b) => openBlocks.has(b.id))
  const hasMultipleBlocks = state.blocks.length > 1

  return (
    <BlocksUIContext.Provider
      value={{ openBlocks, toggleBlock, expandAll, collapseAll, allBlocksOpen, hasMultipleBlocks }}
    >
      {children}
    </BlocksUIContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
/*  BlocksToolbar — botons "Expandir Tots" + "Afegir Bloc" pensats     */
/*  per viure al `headerRight` del Card "Blocs" al WorkForm.           */
/* ------------------------------------------------------------------ */

export function BlocksToolbar() {
  const { dispatch } = useContentEditor()
  const { allBlocksOpen, expandAll, collapseAll, hasMultipleBlocks } = useBlocksUI()
  return (
    <div className="flex items-center gap-3">
      {hasMultipleBlocks && (
        <button
          type="button"
          onClick={allBlocksOpen ? collapseAll : expandAll}
          className="inline-flex items-center gap-1.5 px-3 h-8 text-body-sm text-text-main hover:bg-surface-base rounded-full transition-colors"
          title={
            allBlocksOpen
              ? 'Col·lapsa tots els blocs'
              : 'Expandeix tots els blocs'
          }
        >
          <CaretUpDown size={14} weight="regular" />
          {allBlocksOpen ? 'Col·lapsar Tots' : 'Expandir Tots'}
        </button>
      )}
      <button
        type="button"
        onClick={() => dispatch({ type: 'ADD_BLOCK' })}
        className="inline-flex items-center gap-1.5 px-4 h-8 border border-text-main rounded-full text-body-sm hover:bg-text-main hover:text-text-main-inverse transition-colors"
      >
        <Plus size={14} weight="bold" />
        Afegir Bloc
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  HeroSection — render del hero (portada del case study).            */
/*  Component sense estat propi; tot ve de ContentEditorContext.       */
/* ------------------------------------------------------------------ */

export function HeroSection() {
  const { state, dispatch } = useContentEditor()
  const hasImage = Boolean(state.hero.backgroundImage)

  // NOTE: no posem `id="section-hero"` aquí — el Card pare ja el porta.
  // Tenir-lo a dos llocs viola la regla d'IDs únics i pot causar
  // hydration mismatches.
  return (
    /* Layout 2-col fidel al Figma 11176-4407:
       ── LEFT 347px fixe amb separador vertical (border-r + pr-6) —
          mateixa estructura que el thumbnail de Característiques.
          Conté Background Image (label heading) + Hero Fill (label caps).
       ── RIGHT flex-1 amb gap-8 (32px) entre seccions i dividers
          horitzontals separant Color text · Card Head · Overlay. */
    <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-stretch">

      {/* ─── LEFT ─── */}
      <div className="flex flex-col gap-6 w-full md:w-[347px] md:shrink-0 md:pr-6 md:border-r md:border-surface-border">
        <ImageUploadField
          label="Background Image"
          labelVariant="heading"
          folder="works/hero"
          value={state.hero.backgroundImage}
          onChange={(v) => dispatch({ type: 'SET_HERO_IMAGE', value: v })}
          aspectRatio="16 / 9"
          objectFit="cover"
        />

        {/* Hero Fill — color sòlid usat com a fallback quan no hi ha
            imatge (o mentre carrega). El label coincideix amb el Figma. */}
        <ColorField
          label="Hero Fill"
          value={state.hero.backgroundColor || '#1A1A1A'}
          onChange={(v) => dispatch({ type: 'SET_HERO_COLOR', value: v })}
        />
      </div>

      {/* ─── RIGHT ─── */}
      <div className="flex flex-col gap-8 flex-1 min-w-0 w-full self-stretch justify-center md:py-2">

        {/* Color del Text toggle — Pills LIGHT/DARK al cantó dret, label + descripció a l'esquerra */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-body-sm font-medium text-text-secondary">
              Color del text
            </span>
            <span className="text-body-sm text-text-secondary/80 leading-snug">
              Light per a fons foscos / imatges; Dark si el fons és clar.
            </span>
          </div>
          <div
            role="tablist"
            aria-label="Color del text"
            className="inline-flex items-center gap-1 p-1 rounded-full border border-surface-border bg-surface-card shrink-0"
          >
            {(['light', 'dark'] as const).map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={state.hero.textColor === c}
                onClick={() => dispatch({ type: 'SET_HERO_TEXT_COLOR', value: c })}
                className={`px-3 py-1 rounded-full text-body-xs uppercase tracking-wider transition-colors ${
                  state.hero.textColor === c
                    ? 'bg-text-main text-text-main-inverse'
                    : 'text-text-secondary hover:text-text-main'
                }`}
              >
                {c === 'light' ? 'LIGHT' : 'DARK'}
              </button>
            ))}
          </div>
        </div>

        {/* Divider abans del Card Head */}
        <div className="h-px bg-surface-border" aria-hidden />

        {/* Card Head — Títol + Descripció agrupats amb gap-6 (24px), com
            al Figma "Card Head" wrapper. */}
        <div className="flex flex-col gap-6">
          <Input
            label="Títol hero"
            placeholder="PADLL"
            value={state.hero.title}
            onChange={(v) => dispatch({ type: 'SET_HERO_TEXT', field: 'title', value: v })}
          />

          <Textarea
            label="Descripció hero"
            rows={4}
            placeholder="Una frase potent que resumeixi el projecte..."
            value={state.hero.description}
            onChange={(v) => dispatch({ type: 'SET_HERO_TEXT', field: 'description', value: v })}
          />
        </div>

        {/* Divider abans del OverlaySlider */}
        <div className="h-px bg-surface-border" aria-hidden />

        {/* Overlay — només té sentit quan hi ha imatge. Si no, el slider
            es renderitza disabled per donar visibilitat al control sense
            que tingui efecte. */}
        <OverlaySlider
          value={state.hero.overlayOpacity}
          onChange={(v) => dispatch({ type: 'SET_HERO_OVERLAY', value: v })}
          disabled={!hasImage}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  BlocksSection — render dels blocs del case study (el cos).         */
/*  Manté el seu propi UI state: openBlocks (localStorage per workId), */
/*  active drag id, sensors, confirm modal.                            */
/* ------------------------------------------------------------------ */

export function BlocksSection({
  onValidationChange,
}: {
  onValidationChange?: (count: number) => void
}) {
  const { state, dispatch } = useContentEditor()
  // Estat d'UI dels blocs (col·lapse + accions globals) ve del provider
  // dedicat — els controls "Expandir Tots" / "Afegir Bloc" viuen ara al
  // headerRight del Card al WorkForm, no aquí dins.
  const { openBlocks, toggleBlock } = useBlocksUI()
  const { confirm: confirmModal, dialog: confirmDialog } = useConfirm()

  // --- Validacions soft ---
  // Per a cada bloc: si no té ni `title` ni `heading`, és un avís.
  // Per a cada mèdia (a blocs o final): si té URL però no alt text, és un avís.
  // L'overlay del hero no compta com a warning (sempre vàlid).
  const blockWarnings = useMemo(() => {
    return state.blocks.map((b) => {
      const issues: string[] = []
      const hasHeading = Boolean(b.textSection.title || b.textSection.heading)
      if (!hasHeading) issues.push('Falta un títol o heading per al bloc.')
      const mediaMissingAlt = b.media.filter((m) => m.url && !m.alt?.trim()).length
      if (mediaMissingAlt > 0)
        issues.push(`${mediaMissingAlt} imatge${mediaMissingAlt === 1 ? '' : 's'} sense alt text.`)
      return issues
    })
  }, [state.blocks])

  // Comptador total de blocs amb warnings. Bubble al pare via callback.
  // Usem ref per al callback i així evitem incloure'l a les deps de
  // l'effect — d'altra manera, com que el pare el recrea a cada render,
  // l'effect entraria en loop infinit.
  const blocsCount = useMemo(
    () => blockWarnings.reduce((acc, issues) => acc + issues.length, 0),
    [blockWarnings],
  )
  const onValidationChangeRef = useRef(onValidationChange)
  useEffect(() => {
    onValidationChangeRef.current = onValidationChange
  })
  useEffect(() => {
    onValidationChangeRef.current?.(blocsCount)
  }, [blocsCount])

  // Sensors de drag-and-drop. PointerSensor amb una distància d'activació de
  // 8px perquè els clicks normals als botons del header del bloc no s'iniciïn
  // com a drag. KeyboardSensor habilita reordenació amb teclat (a11y).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  /**
   * Active drag IDs per a renderitzar el DragOverlay (un ghost flotant que
   * segueix el cursor). NULL quan no s'està arrossegant res.
   */
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)

  const handleBlockDragStart = (event: DragStartEvent) => {
    setActiveBlockId(String(event.active.id))
  }
  const handleBlockDragEnd = (event: DragEndEvent) => {
    setActiveBlockId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    dispatch({
      type: 'REORDER_BLOCKS',
      fromId: String(active.id),
      toId: String(over.id),
    })
  }

  const activeBlock = activeBlockId
    ? state.blocks.find((b) => b.id === activeBlockId)
    : null

  return (
    /* La toolbar "Expandir Tots" + "Afegir Bloc" viu al headerRight del
       Card al WorkForm (via <BlocksToolbar />) — així queda alineada amb
       el LocaleSwitcher al header de la secció.
       Sense card embolcall: cada bloc renderitza el seu propi panell
       blanc independent (la columna externa NO té bg-surface-card). */
    <div className="flex flex-col gap-4">
        {state.blocks.length === 0 && (
          <div className="flex flex-col gap-3 px-5 py-8 border border-dashed border-surface-border rounded-md bg-surface-base text-center">
            <p className="text-body-md text-text-main">Encara no hi ha cap bloc</p>
            <p className="text-body-sm text-text-secondary max-w-prose mx-auto leading-relaxed">
              Cada bloc és una secció del case study. Patrons habituals: <em>Project Overview</em>{' '}
              (què és el projecte i context), <em>Procés</em> (com vas treballar),{' '}
              <em>Resultats</em> (què va canviar). Pots arrossegar-los per reordenar i col·lapsar-los
              quan no els toques.
            </p>
            <button
              type="button"
              onClick={() => dispatch({ type: 'ADD_BLOCK' })}
              className="inline-flex items-center gap-2 px-4 py-2 mt-1 self-center border border-text-main rounded-full text-body-sm font-medium hover:bg-text-main hover:text-text-main-inverse transition-colors"
            >
              <Plus size={14} weight="bold" />
              Afegir el primer bloc
            </button>
          </div>
        )}
        <DndContext
          id="work-blocks-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleBlockDragStart}
          onDragEnd={handleBlockDragEnd}
        >
          <SortableContext items={state.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        {state.blocks.map((block, idx) => {
          const isOpen = openBlocks.has(block.id)
          const issues = blockWarnings[idx] || []
          return (
            <SortableItem key={block.id} id={block.id}>
              {({ listeners }) => (
            <div className="border border-surface-border rounded-md bg-surface-card overflow-hidden">
              {/* Header del bloc — Figma 11187:10557 (Block Head):
                  · px-[16px] py-[12px], gap-[12px] entre chevron/número/títol
                  · NO drag handle visible (drag delegat als listeners del row)
                  · NO warning badge: els warnings s'expressen dins el body
                  · 3 actions (up/down/delete) sense container border
                  · border-b només quan està expandit */}
              <div
                className={`flex items-center justify-between gap-3 px-4 py-3 ${isOpen ? 'border-b border-surface-border' : ''}`}
                {...(isOpen ? {} : listeners)}
              >
                <button
                  type="button"
                  onClick={() => toggleBlock(block.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left transition-colors"
                  aria-expanded={isOpen}
                  title={issues.length > 0 ? issues.join(' · ') : undefined}
                  {...(isOpen ? listeners : {})}
                >
                  {isOpen ? (
                    <CaretDown size={16} weight="regular" className="text-text-secondary shrink-0" />
                  ) : (
                    <CaretRight size={16} weight="regular" className="text-text-secondary shrink-0" />
                  )}
                  <span className="text-body-sm text-text-secondary tabular-nums shrink-0">
                    {block.textSection.number || String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-body-md text-text-main truncate">
                    {block.textSection.title || block.textSection.heading || '(Sense títol)'}
                  </span>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <IconButton
                    label="Pujar bloc"
                    disabled={idx === 0}
                    onClick={() => dispatch({ type: 'MOVE_BLOCK', index: idx, direction: -1 })}
                  >
                    <CaretUp size={14} weight="bold" />
                  </IconButton>
                  <IconButton
                    label="Baixar bloc"
                    disabled={idx === state.blocks.length - 1}
                    onClick={() => dispatch({ type: 'MOVE_BLOCK', index: idx, direction: 1 })}
                  >
                    <CaretDown size={14} weight="bold" />
                  </IconButton>
                  <IconButton
                    label="Eliminar bloc"
                    onClick={async () => {
                      const ok = await confirmModal({
                        title: 'Eliminar bloc',
                        message:
                          "El bloc es treu del case study. L'acció no es pot desfer fins que desis.",
                        confirmLabel: 'Eliminar',
                        danger: true,
                      })
                      if (ok) dispatch({ type: 'REMOVE_BLOCK', index: idx })
                    }}
                  >
                    <Trash size={14} weight="regular" className="text-error" />
                  </IconButton>
                </div>
              </div>

              {/* Contingut del bloc — Figma 11187:10566 (Body):
                  px-[24px] py-[32px], gap-[48px] entre articles, dividers
                  horitzontals entre cada article (Inputs / Llista / Media). */}
              {isOpen && (
                <div className="flex flex-col gap-12 px-6 py-8">
                  {issues.length > 0 && (
                    <ul className="flex flex-col gap-1 px-3 py-2 rounded-md bg-warning-surface text-body-sm text-warning">
                      {issues.map((msg, i) => (
                        <li key={i} className="inline-flex items-start gap-2">
                          <span aria-hidden>⚠</span>
                          <span>{msg}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* ─── Article 1: Inputs principals ───
                      Tots els camps tenen `max-w-[500px]` perquè no
                      transmetin que esperen contingut llarg (Figma:
                      Número, Títol curt, Heading i Descripció comparteixen
                      `max-w-[500px]`). Les llistes "Què vam fer" i
                      "Característiques" segueixen un altre patró
                      (underline inputs en files completes). */}
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col sm:flex-row gap-5">
                      <Input
                        label="Número"
                        required
                        placeholder="01"
                        className="w-full sm:w-[100px] sm:shrink-0"
                        inputClassName="text-center"
                        value={block.textSection.number}
                        onChange={(v) => dispatch({ type: 'SET_BLOCK_FIELD', index: idx, field: 'number', value: v })}
                      />
                      <Input
                        label="Títol curt (columna esquerra)"
                        required
                        labelNoWrap
                        className="w-full sm:w-[420px] sm:shrink-0"
                        placeholder="Project Overview"
                        value={block.textSection.title}
                        onChange={(v) => dispatch({ type: 'SET_BLOCK_FIELD', index: idx, field: 'title', value: v })}
                      />
                    </div>

                    <Input
                      label="Heading (titular del bloc)"
                      required
                      className="max-w-[500px]"
                      placeholder="Connectar dos mons en una mateixa experiència"
                      value={block.textSection.heading}
                      onChange={(v) => dispatch({ type: 'SET_BLOCK_FIELD', index: idx, field: 'heading', value: v })}
                    />

                    <RichTextEditor
                      label="Descripció"
                      rows={4}
                      className="max-w-[500px]"
                      value={block.textSection.description}
                      onChange={(v) => dispatch({ type: 'SET_BLOCK_FIELD', index: idx, field: 'description', value: v })}
                    />
                  </div>

                  {/* Divider entre Article 1 i Article 2 — Figma 11187:11305 */}
                  <div className="h-px bg-surface-border" aria-hidden />

                  {/* ─── Article 2: Llista ─── */}
                  <ListEditor
                    block={block}
                    onChangeType={(t) => dispatch({ type: 'SET_BLOCK_LIST_TYPE', index: idx, value: t })}
                    onChangeItems={(items) => dispatch({ type: 'SET_BLOCK_LIST_ITEMS', index: idx, value: items })}
                    onChangeDetails={(details) => dispatch({ type: 'SET_BLOCK_LIST_DETAILS', index: idx, value: details })}
                  />

                  {/* Divider entre Article 2 i Article 3 — Figma 11187:11446 */}
                  <div className="h-px bg-surface-border" aria-hidden />

                  {/* ─── Article 3: Media ─── */}
                  <MediaEditor
                    media={block.media}
                    onAdd={() => dispatch({ type: 'ADD_BLOCK_MEDIA', index: idx })}
                    onRemove={(mi) => dispatch({ type: 'REMOVE_BLOCK_MEDIA', index: idx, mediaIndex: mi })}
                    onChange={(mi, field, value) =>
                      dispatch({
                        type: 'SET_BLOCK_MEDIA_FIELD',
                        index: idx,
                        mediaIndex: mi,
                        field,
                        value,
                      })
                    }
                    onReorder={(fromId, toId) =>
                      dispatch({
                        type: 'REORDER_BLOCK_MEDIA',
                        index: idx,
                        fromId,
                        toId,
                      })
                    }
                  />
                </div>
              )}
            </div>
              )}
            </SortableItem>
          )
        })}
          </SortableContext>
          <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
            {activeBlock ? <BlockGhost block={activeBlock} /> : null}
          </DragOverlay>
        </DndContext>

      {/* NOTE: La Conclusió i el Final media s'han mogut a la Tancament
          card del WorkForm (FinalMediaSection). Comparteixen estat amb
          aquesta editor via ContentEditorContext. */}

      {/* Modal de confirmació per a Eliminar bloc (i futures accions). */}
      {confirmDialog}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  FinalMediaSection — renderitzat dins la Tancament card del         */
/*  WorkForm. Llegeix `state.finalMedia` i dispatcha actions via       */
/*  ContentEditorContext.                                              */
/* ------------------------------------------------------------------ */

export function FinalMediaSection({
  onValidationChange,
}: {
  onValidationChange?: (count: number) => void
} = {}) {
  const { state, dispatch } = useContentEditor()
  const [activeFinalMediaId, setActiveFinalMediaId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const finalMediaWarnings = useMemo(() => {
    return state.finalMedia.map((m) => (m.url && !m.alt?.trim() ? "Aquesta imatge no té alt text." : ''))
  }, [state.finalMedia])

  // Bubble warning count al pare via ref (evitem loop si el callback no és estable)
  const warningsCount = finalMediaWarnings.filter(Boolean).length
  const onValidationChangeRef = useRef(onValidationChange)
  useEffect(() => {
    onValidationChangeRef.current = onValidationChange
  })
  useEffect(() => {
    onValidationChangeRef.current?.(warningsCount)
  }, [warningsCount])

  const activeFinalMedia = activeFinalMediaId
    ? state.finalMedia.find((m) => m.id === activeFinalMediaId)
    : null

  const handleDragStart = (e: DragStartEvent) => {
    setActiveFinalMediaId(String(e.active.id))
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveFinalMediaId(null)
    const { active, over } = e
    if (!over || active.id === over.id) return
    dispatch({
      type: 'REORDER_FINAL_MEDIA',
      fromId: String(active.id),
      toId: String(over.id),
    })
  }

  return (
    <Section
      id="section-finalmedia"
      title="Final media"
      action={
        <button
          type="button"
          onClick={() => dispatch({ type: 'ADD_FINAL_MEDIA' })}
          className="inline-flex items-center gap-2 px-4 py-2 border border-text-main rounded-full text-body-sm font-medium hover:bg-text-main hover:text-text-main-inverse transition-colors"
        >
          <Plus size={14} weight="bold" />
          Afegir imatge final
        </button>
      }
    >
      {state.finalMedia.length === 0 && (
        <div className="flex flex-col gap-2 px-5 py-6 border border-dashed border-surface-border rounded-md bg-surface-base text-center">
          <p className="text-body-md text-text-main">Cap imatge final</p>
          <p className="text-body-sm text-text-secondary max-w-prose mx-auto leading-relaxed">
            Aquestes imatges es renderitzen al peu del case study, just abans del banner
            <em> Next project</em>. Útil per a tancaments visuals, mockups en context, o
            fotografies del projecte ja a producció.
          </p>
        </div>
      )}
      <DndContext
        id="work-final-media-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={state.finalMedia.map((m) => m.id)}
          strategy={verticalListSortingStrategy}
        >
          {state.finalMedia.map((m, i) => (
            <SortableItem key={m.id} id={m.id}>
              {({ listeners }) => (
                <div className="flex flex-col gap-4 p-4 border border-surface-border rounded-md bg-surface-card">
                  {/* Top bar: drag handle + index + delete (subtils) */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <DragHandle listeners={listeners} label="Reordenar imatge final" />
                      <span className="font-mono text-body-sm tabular-nums">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <IconButton label="Eliminar imatge final" onClick={() => dispatch({ type: 'REMOVE_FINAL_MEDIA', index: i })}>
                      <Trash size={14} weight="regular" className="text-error" />
                    </IconButton>
                  </div>

                  {/* Imatge (ImageUploadField ja inclou preview + filename + accions) */}
                  <ImageUploadField
                    label="Imatge"
                    folder="works/final"
                    value={m.url}
                    onChange={(v) => dispatch({ type: 'SET_FINAL_MEDIA_FIELD', index: i, field: 'url', value: v })}
                    aspectRatio="16 / 10"
                  />

                  {/* Alt text com a camp separat (no embedded a ImageUploadField) */}
                  <Input
                    label="Alt text"
                    placeholder="Descriu què es veu a la imatge (per a11y i SEO)"
                    value={m.alt || ''}
                    onChange={(v) => dispatch({ type: 'SET_FINAL_MEDIA_FIELD', index: i, field: 'alt', value: v })}
                  />
                  {finalMediaWarnings[i] && (
                    <p className="inline-flex items-start gap-2 text-body-sm text-warning -mt-2">
                      <Warning size={14} weight="fill" className="mt-0.5 shrink-0" />
                      <span>{finalMediaWarnings[i]}</span>
                    </p>
                  )}
                </div>
              )}
            </SortableItem>
          ))}
        </SortableContext>
        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeFinalMedia ? <FinalMediaGhost media={activeFinalMedia} /> : null}
        </DragOverlay>
      </DndContext>
    </Section>
  )
}

// -----------------------------------------------------------------------
// Subcomponents
// -----------------------------------------------------------------------

/**
 * Wrapper sortable amb render-prop. Pinta el contenidor del node
 * (`setNodeRef` + transform + opacity dragging) i passa els `listeners`
 * al children perquè els enganxin al drag handle específic del seu
 * disseny — així el drag només s'activa quan l'usuari agafa la nansa,
 * no quan toca qualsevol part del bloc.
 */
function SortableItem({
  id,
  children,
}: {
  id: string
  children: (args: { listeners: DraggableSyntheticListeners; isDragging: boolean }) => React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
        position: 'relative',
      }}
      {...attributes}
    >
      {children({ listeners, isDragging })}
    </div>
  )
}

/**
 * Vista compacta d'un bloc per al DragOverlay (ghost flotant que segueix
 * el cursor mentre arrossegues). Versió simplificada del block header per
 * mantenir el preview lleuger i visible al damunt de tot.
 */
function BlockGhost({ block }: { block: WorkBlock }) {
  return (
    <div className="border border-text-main rounded-md bg-surface-card shadow-2xl">
      <div className="flex items-center gap-2 px-4 py-3">
        <DotsSixVertical size={16} weight="bold" className="text-text-secondary" />
        <span className="font-mono text-body-sm text-text-secondary">
          {block.textSection.number || '··'}
        </span>
        <span className="text-body-md text-text-main truncate">
          {block.textSection.title || block.textSection.heading || '(Sense títol)'}
        </span>
      </div>
    </div>
  )
}

/**
 * Vista compacta d'una imatge final per al DragOverlay. Mostra una miniatura
 * (si hi ha URL) o un placeholder, més l'alt text.
 */
function FinalMediaGhost({ media }: { media: WorkMedia }) {
  return (
    <div className="flex items-center gap-3 p-3 border border-text-main rounded-md bg-surface-card shadow-2xl">
      <DotsSixVertical size={16} weight="bold" className="text-text-secondary shrink-0" />
      <div
        className="w-12 h-12 rounded shrink-0 bg-cover bg-center bg-surface-base border border-surface-border"
        style={media.url ? { backgroundImage: `url("${media.url}")` } : undefined}
        aria-hidden
      />
      <span className="text-body-sm text-text-main truncate">
        {media.alt || filenameFromUrl(media.url) || '(Sense alt)'}
      </span>
    </div>
  )
}

function filenameFromUrl(url: string): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    return decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() || url)
  } catch {
    return url.split('/').filter(Boolean).pop() || url
  }
}

/** Botó visible que actua de drag handle: cursor-grab + DotsSixVertical. */
function DragHandle({
  listeners,
  label,
}: {
  listeners: DraggableSyntheticListeners
  label: string
}) {
  return (
    <button
      type="button"
      {...listeners}
      aria-label={label}
      title={label}
      className="cursor-grab active:cursor-grabbing p-1.5 -ml-1 text-text-secondary hover:text-text-main rounded touch-none"
    >
      <DotsSixVertical size={16} weight="bold" />
    </button>
  )
}

function Section({
  id,
  title,
  action,
  children,
}: {
  id?: string
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section id={id} className="flex flex-col gap-5 scroll-mt-20">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-sans uppercase tracking-[0.15em] text-body-sm text-text-secondary">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function ListEditor({
  block,
  onChangeType,
  onChangeItems,
  onChangeDetails,
}: {
  block: WorkBlock
  onChangeType: (t: NonNullable<WorkTextSection['listType']>) => void
  onChangeItems: (items: string[]) => void
  onChangeDetails: (details: { label: string; value: string }[]) => void
}) {
  const listType = block.textSection.listType || 'none'
  const items = block.textSection.listItems || []
  const details = block.textSection.listDetails || []

  // Handler "Afegir" del header — adapta-ho al tipus de llista actiu.
  const handleAddHeader = () => {
    if (listType === 'what-we-did') onChangeItems([...items, ''])
    else if (listType === 'characteristics') onChangeDetails([...details, { label: '', value: '' }])
  }
  // Si la llista és 'none', el botó "Afegir" del header està desactivat.
  const canAddFromHeader = listType !== 'none'

  return (
    /* Figma 11187:11335 — Article "Llista" SENSE wrapper bg/border:
       · header gap-[24px] (justify-between) amb "LLISTA:" + pills a
         l'esquerra i "Afegir" ghost button a la dreta
       · gap-[16px] entre header i la llista d'items */
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-body-sm font-medium text-text-secondary">LLISTA:</span>
          <div className="flex items-center gap-2">
            {(['none', 'what-we-did', 'characteristics'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onChangeType(t)}
                className={`px-3 py-1 rounded-full text-body-xs transition-colors ${
                  listType === t
                    ? 'bg-text-main text-text-main-inverse'
                    : 'text-text-secondary hover:text-text-main border border-surface-border'
                }`}
              >
                {t === 'none' ? 'Cap' : t === 'what-we-did' ? 'Què vam fer' : 'Característiques'}
              </button>
            ))}
          </div>
        </div>

        {/* Ghost button "Afegir" — desactivat si listType=='none' (no hi ha
            res a què afegir). Mateix estil que el "Afegir Imatge" del Media. */}
        <button
          type="button"
          onClick={handleAddHeader}
          disabled={!canAddFromHeader}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-body-sm text-text-main hover:bg-surface-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <Plus size={14} weight="bold" />
          Afegir
        </button>
      </div>

      {listType === 'what-we-did' && (
        <ItemsList items={items} onChange={onChangeItems} />
      )}

      {listType === 'characteristics' && (
        <DetailsList details={details} onChange={onChangeDetails} />
      )}
    </div>
  )
}

/**
 * Hook compartit per ItemsList i DetailsList que retorna sensors + un
 * handler genèric de reorder. Cada llista té el seu propi DndContext
 * (id estable amb `useId()`) per evitar col·lisions amb el de blocs
 * (que envolta tota la secció).
 */
function useSortableArray<T>(arr: T[], onChange: (next: T[]) => void) {
  const dndId = useId()
  const ids = arr.map((_, i) => `${dndId}-${i}`)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    const next = [...arr]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved)
    onChange(next)
  }
  return { dndId, ids, sensors, handleDragEnd }
}

function ItemsList({ items, onChange }: { items: string[]; onChange: (next: string[]) => void }) {
  const { dndId, ids, sensors, handleDragEnd } = useSortableArray(items, onChange)

  return (
    /* Figma 11187:11347 — rows gap-[16px] amb structure idèntica a
       DetailsList però només amb un input value (no label/value split). */
    <div className="flex flex-col gap-4">
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {items.map((it, i) => (
            <SortableItem key={ids[i]} id={ids[i]}>
              {({ listeners }) => (
                <div className="group flex items-center gap-2 h-8">
                  <DragHandle listeners={listeners} label="Reordenar item" />
                  <UnderlineInput
                    value={it}
                    onChange={(v) => {
                      const next = [...items]
                      next[i] = v
                      onChange(next)
                    }}
                    placeholder="Wireframing interactiu per testeig."
                    className="flex-1 min-w-0"
                  />
                  <OutlineSquareButton label="Previsualitzar" onClick={() => { /* no-op visual */ }}>
                    <Eye size={14} weight="regular" />
                  </OutlineSquareButton>
                  <OutlineSquareButton
                    danger
                    label="Eliminar item"
                    onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                  >
                    <Trash size={14} weight="regular" className="text-error" />
                  </OutlineSquareButton>
                </div>
              )}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="inline-flex items-center gap-1.5 self-start h-8 px-2 rounded-full text-body-sm text-text-main hover:bg-surface-base transition-colors"
      >
        <Plus size={14} weight="bold" /> Afegir
      </button>
    </div>
  )
}

function DetailsList({
  details,
  onChange,
}: {
  details: { label: string; value: string }[]
  onChange: (next: { label: string; value: string }[]) => void
}) {
  const { dndId, ids, sensors, handleDragEnd } = useSortableArray(details, onChange)

  return (
    /* Figma 11187:11347 — Característiques rows gap-[16px]:
       · DragHandle + Underline input label (w-[211px]) + Underline input
         value (flex-1) + OutlineSquareButton (eye) + OutlineSquareButton
         (red trash). Vegeu nodes 11187:11348-11351. */
    <div className="flex flex-col gap-4">
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {details.map((d, i) => (
            <SortableItem key={ids[i]} id={ids[i]}>
              {({ listeners }) => (
                <div className="group flex items-center gap-2 h-8">
                  <DragHandle listeners={listeners} label="Reordenar detall" />
                  <UnderlineInput
                    value={d.label}
                    onChange={(v) => {
                      const next = [...details]
                      next[i] = { ...next[i], label: v }
                      onChange(next)
                    }}
                    placeholder="Type"
                    className="w-[200px] shrink-0"
                  />
                  <UnderlineInput
                    value={d.value}
                    onChange={(v) => {
                      const next = [...details]
                      next[i] = { ...next[i], value: v }
                      onChange(next)
                    }}
                    placeholder="UI/UX Design"
                    className="flex-1 min-w-0"
                  />
                  <OutlineSquareButton label="Previsualitzar" onClick={() => { /* no-op visual */ }}>
                    <Eye size={14} weight="regular" />
                  </OutlineSquareButton>
                  <OutlineSquareButton
                    danger
                    label="Eliminar detall"
                    onClick={() => onChange(details.filter((_, idx) => idx !== i))}
                  >
                    <Trash size={14} weight="regular" className="text-error" />
                  </OutlineSquareButton>
                </div>
              )}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
      <button
        type="button"
        onClick={() => onChange([...details, { label: '', value: '' }])}
        className="inline-flex items-center gap-1.5 self-start h-8 px-2 rounded-full text-body-sm text-text-main hover:bg-surface-base transition-colors"
      >
        <Plus size={14} weight="bold" /> Afegir
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  UnderlineInput — input estil "underline" del Figma 11187:11348      */
/*  (border-b només). Usat als items de Llista i a l'alt text dels      */
/*  media rows.                                                         */
/* ------------------------------------------------------------------ */

function UnderlineInput({
  value,
  onChange,
  placeholder,
  className = '',
  ...rest
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <input
      {...rest}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`h-7 bg-transparent border-b border-surface-border py-1 text-body-md text-text-main placeholder:text-text-secondary/50 focus:outline-none focus:border-text-main transition-colors ${className}`}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  OutlineSquareButton — botó 32×32 amb border outline (Figma          */
/*  "Buttons / Outline / Square"). `danger` canvia el border a vermell  */
/*  per a accions destructives (trash). Usat als items de Llista i      */
/*  als rows del MediaEditor.                                           */
/* ------------------------------------------------------------------ */

function OutlineSquareButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md border bg-surface-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        danger
          ? 'border-error text-error hover:bg-error/5'
          : 'border-surface-border text-text-main hover:bg-surface-base'
      }`}
    >
      {children}
    </button>
  )
}

function MediaEditor({
  media,
  onAdd,
  onRemove,
  onChange,
  onReorder,
}: {
  media: WorkMedia[]
  onAdd: () => void
  onRemove: (mi: number) => void
  onChange: (mi: number, field: keyof WorkMedia, value: string) => void
  /** Reorder via drag — opcional per compatibilitat. */
  onReorder?: (fromId: string, toId: string) => void
}) {
  // View toggle (list / grid) — Figma 11187:11857. Per defecte 'list'.
  // Persistim al localStorage perquè el toggle quedi recordat entre
  // sessions; cau a 'list' si no hi ha valor o si el browser no exposa
  // localStorage (SSR).
  const [view, setView] = useState<'list' | 'grid'>(() => {
    if (typeof window === 'undefined') return 'list'
    try {
      const v = window.localStorage.getItem('work-editor:mediaView')
      return v === 'grid' ? 'grid' : 'list'
    } catch {
      return 'list'
    }
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('work-editor:mediaView', view)
    } catch {
      /* storage off — silenciós */
    }
  }, [view])

  // Sensors i handlers de DnD per als media items. Reutilitzem el patró
  // de SortableItem amb un DndContext propi (id estable amb useId).
  const dndId = useId()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    onReorder?.(String(active.id), String(over.id))
  }

  return (
    /* Figma 11187:11607 — Article "Media" SENSE wrapper bg/border:
       · header gap-[24px] (justify-between): label "MEDIA · N FITXERS"
         a l'esquerra; a la dreta, view-toggle (list/grid) + divider
         vertical + "Afegir Imatge" ghost button. */
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="text-body-sm font-medium text-text-secondary">
          MEDIA · {media.length} {media.length === 1 ? 'FITXER' : 'FITXERS'}
        </span>

        <div className="flex items-center gap-4">
          {/* View toggle group — 2 botons quadrats ghost amb estat actiu */}
          <div className="flex items-center gap-2" role="tablist" aria-label="Vista de media">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'list'}
              aria-label="Vista llista"
              title="Vista llista"
              onClick={() => setView('list')}
              className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                view === 'list'
                  ? 'bg-surface-base text-text-main'
                  : 'text-text-secondary hover:text-text-main hover:bg-surface-base/60'
              }`}
            >
              <Rows size={14} weight="regular" />
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'grid'}
              aria-label="Vista quadrícula"
              title="Vista quadrícula"
              onClick={() => setView('grid')}
              className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                view === 'grid'
                  ? 'bg-surface-base text-text-main'
                  : 'text-text-secondary hover:text-text-main hover:bg-surface-base/60'
              }`}
            >
              <GridFour size={14} weight="regular" />
            </button>
          </div>

          {/* Divider vertical entre view toggle i "Afegir Imatge" */}
          <div className="w-px h-6 bg-surface-border self-stretch" aria-hidden />

          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-body-sm text-text-main hover:bg-surface-base transition-colors"
          >
            <Plus size={14} weight="bold" />
            Afegir Imatge
          </button>
        </div>
      </div>

      {media.length === 0 && (
        <div className="px-4 py-6 border border-dashed border-surface-border rounded-md bg-surface-base/40 text-center">
          <p className="text-body-sm text-text-secondary">
            Cap imatge encara. Les imatges es disposen al WorkMediaGrid segons quantes
            n&apos;hi hagi (1, 2, 3 o 4).
          </p>
        </div>
      )}

      {media.length > 0 && (
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={media.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            {view === 'list' ? (
              <div className="flex flex-col gap-3">
                {media.map((m, i) => (
                  <SortableItem key={m.id} id={m.id}>
                    {({ listeners }) => (
                      <MediaRowList
                        listeners={listeners}
                        media={m}
                        onChange={(field, value) => onChange(i, field, value)}
                        onRemove={() => onRemove(i)}
                      />
                    )}
                  </SortableItem>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {media.map((m, i) => (
                  <SortableItem key={m.id} id={m.id}>
                    {({ listeners }) => (
                      <MediaCardGrid
                        listeners={listeners}
                        media={m}
                        onChange={(field, value) => onChange(i, field, value)}
                        onRemove={() => onRemove(i)}
                      />
                    )}
                  </SortableItem>
                ))}
              </div>
            )}
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  MediaRowList — vista llista d'un media item: drag handle + image    */
/*  thumbnail (80px) + File Name + Alt Text + 4 botons outline.         */
/*  Figma 11187:11738 / 11176:903.                                      */
/* ------------------------------------------------------------------ */

function MediaRowList({
  listeners,
  media,
  onChange,
  onRemove,
}: {
  listeners: DraggableSyntheticListeners
  media: WorkMedia
  onChange: (field: keyof WorkMedia, value: string) => void
  onRemove: () => void
}) {
  const hasUrl = Boolean(media.url)
  const filename = filenameFromUrl(media.url) || ''
  // Refs per ImageUploadField intern (per fer click programàtic des dels
  // botons d'edit / replace). Reutilitzem el component sense renderitzar-lo
  // visualment quan ja hi ha url — només per a la lògica d'upload via modal.
  const [managerOpen, setManagerOpen] = useState(false)

  return (
    <div className="flex items-center gap-2.5">
      <DragHandle listeners={listeners} label="Reordenar imatge" />

      <div className="flex-1 min-w-0 flex items-center gap-6 p-3 border border-surface-border rounded-md bg-surface-card">
        {/* Thumbnail 80×80 amb fons surface-base — Figma 11176:904.
            En estat buit, mostrem un placeholder clicable que obre el
            picker via ImageUploadField. */}
        <div className="shrink-0">
          {hasUrl ? (
            <button
              type="button"
              onClick={() => setManagerOpen(true)}
              aria-label="Gestionar imatge"
              title="Gestionar imatge"
              className="w-20 h-20 rounded-md overflow-hidden border border-surface-border bg-surface-base block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={media.url}
                alt={media.alt || ''}
                className="w-full h-full object-cover"
              />
            </button>
          ) : (
            <div className="w-20 h-20 rounded-md border border-dashed border-surface-border bg-surface-base flex items-center justify-center text-text-secondary">
              <ArrowsCounterClockwise size={18} weight="regular" />
            </div>
          )}
        </div>

        {/* File Name — label + filename (sense input editable: el filename
            ve dictat per l'upload). Crida el modal de gestió al clicar. */}
        <button
          type="button"
          onClick={() => setManagerOpen(true)}
          className="flex flex-col items-start min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
        >
          <span className="text-[14px] leading-4 tracking-[0.3px] text-text-secondary">File Name</span>
          <span className="text-body-md text-text-main truncate w-full">
            {filename || <span className="text-text-secondary/70 italic">Sense fitxer</span>}
          </span>
        </button>

        {/* Divider vertical */}
        <div className="w-px h-[60px] bg-surface-border self-center shrink-0" aria-hidden />

        {/* Alt Text — input editable inline */}
        <label className="flex flex-col items-start min-w-0 flex-1 gap-0.5">
          <span className="text-[14px] leading-4 tracking-[0.3px] text-text-secondary">Alt Text</span>
          <input
            value={media.alt || ''}
            onChange={(e) => onChange('alt', e.target.value)}
            placeholder="Descriu què es veu a la imatge"
            className="w-full bg-transparent border-0 p-0 text-body-md text-text-main placeholder:text-text-secondary/50 focus:outline-none truncate"
          />
        </label>

        {/* Divider vertical */}
        <div className="w-px h-[60px] bg-surface-border self-center shrink-0" aria-hidden />

        {/* 4 botons outline (edit, replace, preview, delete-red) */}
        <div className="flex items-center gap-2 shrink-0">
          <OutlineSquareButton label="Editar imatge" onClick={() => setManagerOpen(true)}>
            <PencilSimple size={14} weight="regular" />
          </OutlineSquareButton>
          <OutlineSquareButton label="Reemplaçar imatge" onClick={() => setManagerOpen(true)}>
            <ArrowsCounterClockwise size={14} weight="regular" />
          </OutlineSquareButton>
          <OutlineSquareButton
            label="Obrir imatge en nova pestanya"
            disabled={!hasUrl}
            onClick={() => {
              if (media.url) window.open(media.url, '_blank', 'noopener,noreferrer')
            }}
          >
            <ArrowSquareOut size={14} weight="regular" />
          </OutlineSquareButton>
          <OutlineSquareButton danger label="Eliminar imatge" onClick={onRemove}>
            <Trash size={14} weight="regular" className="text-error" />
          </OutlineSquareButton>
        </div>
      </div>

      {/* Modal gestió — renderitzem ImageUploadField ocult per delegar la
          gestió de fitxer (replace, upload nou, manage modal) al component
          existent. Quan no hi ha URL i el manager s'obre, mostrem una
          drop area perquè l'usuari pugui pujar la primera imatge. */}
      {managerOpen && (
        <MediaManagerDialog
          media={media}
          onChange={onChange}
          onClose={() => setManagerOpen(false)}
          onRemove={onRemove}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  MediaCardGrid — vista quadrícula d'un media item: card amb         */
/*  thumbnail aspect 16:10 + alt text + accions ràpides.               */
/* ------------------------------------------------------------------ */

function MediaCardGrid({
  listeners,
  media,
  onChange,
  onRemove,
}: {
  listeners: DraggableSyntheticListeners
  media: WorkMedia
  onChange: (field: keyof WorkMedia, value: string) => void
  onRemove: () => void
}) {
  const hasUrl = Boolean(media.url)
  const [managerOpen, setManagerOpen] = useState(false)
  return (
    <div className="flex flex-col gap-3 p-3 border border-surface-border rounded-md bg-surface-card">
      <div className="flex items-center justify-between">
        <DragHandle listeners={listeners} label="Reordenar imatge" />
        <div className="flex items-center gap-1.5">
          <OutlineSquareButton label="Editar imatge" onClick={() => setManagerOpen(true)}>
            <PencilSimple size={12} weight="regular" />
          </OutlineSquareButton>
          <OutlineSquareButton
            label="Obrir imatge"
            disabled={!hasUrl}
            onClick={() => {
              if (media.url) window.open(media.url, '_blank', 'noopener,noreferrer')
            }}
          >
            <ArrowSquareOut size={12} weight="regular" />
          </OutlineSquareButton>
          <OutlineSquareButton danger label="Eliminar imatge" onClick={onRemove}>
            <Trash size={12} weight="regular" className="text-error" />
          </OutlineSquareButton>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setManagerOpen(true)}
        className="block w-full rounded-md overflow-hidden border border-surface-border bg-surface-base"
        style={{ aspectRatio: '16 / 10' }}
      >
        {hasUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt={media.alt || ''} className="w-full h-full object-cover" />
        ) : (
          <span className="flex items-center justify-center w-full h-full text-text-secondary text-body-sm">
            Sense imatge
          </span>
        )}
      </button>
      <input
        value={media.alt || ''}
        onChange={(e) => onChange('alt', e.target.value)}
        placeholder="Alt text"
        className="w-full bg-transparent border-b border-surface-border py-1 text-body-sm text-text-main placeholder:text-text-secondary/50 focus:outline-none focus:border-text-main transition-colors"
      />
      {managerOpen && (
        <MediaManagerDialog
          media={media}
          onChange={onChange}
          onClose={() => setManagerOpen(false)}
          onRemove={onRemove}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  MediaManagerDialog — petit modal que embolcalla ImageUploadField    */
/*  per gestionar la pujada/reemplaç d'un media item dins un bloc. El   */
/*  component existent ja inclou drop zone + compressió + supabase      */
/*  upload, així que aquí només delegem.                                */
/* ------------------------------------------------------------------ */

function MediaManagerDialog({
  media,
  onChange,
  onClose,
  onRemove,
}: {
  media: WorkMedia
  onChange: (field: keyof WorkMedia, value: string) => void
  onClose: () => void
  onRemove: () => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gestionar imatge"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div aria-hidden className="absolute inset-0 bg-text-main/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-surface-card border border-surface-border rounded-md shadow-xl flex flex-col">
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-surface-border">
          <h3 className="text-body-lg font-medium text-text-main">Gestionar imatge</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-text-secondary hover:text-text-main hover:bg-surface-base transition-colors"
            aria-label="Tancar"
          >
            <X size={16} weight="regular" />
          </button>
        </header>
        <div className="flex flex-col gap-4 p-5">
          <ImageUploadField
            label="Imatge"
            folder="works/blocks"
            value={media.url}
            onChange={(v) => onChange('url', v)}
            alt={media.alt || ''}
            onAltChange={(v) => onChange('alt', v)}
          />
          {media.url && (
            <button
              type="button"
              onClick={() => {
                onRemove()
                onClose()
              }}
              className="self-start inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-error/40 text-body-sm text-error hover:bg-error/5 transition-colors"
            >
              <Trash size={14} weight="regular" />
              Eliminar d&apos;aquest bloc
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Inputs del WorkContentEditor (Hero + blocs) amb el mateix box-style que
 * els `Field`/`PlainTextarea` del WorkForm (Característiques, SEO, etc.).
 *
 * Estil: bg-surface-base + border-surface-border + rounded-md + focus ring
 * text-main/20. Així tots els camps del form admin tenen aspecte uniforme.
 */
function Input({
  label,
  value,
  onChange,
  className = '',
  inputClassName = '',
  required,
  labelNoWrap,
  ...rest
}: {
  label: string
  value: string
  onChange: (v: string) => void
  className?: string
  /** Classes addicionals per a l'`<input>` (ex: `text-center` per a Número). */
  inputClassName?: string
  /** Marca visual d'obligatori — afegeix un `*` vermell al label. */
  required?: boolean
  /** Força el label a renderitzar-se en una sola línia (`whitespace-nowrap`). */
  labelNoWrap?: boolean
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className={`inline-flex items-center gap-1 text-body-sm font-medium text-text-secondary ${labelNoWrap ? 'whitespace-nowrap' : ''}`}>
        {label}
        {required && <span className="text-error" aria-hidden>*</span>}
      </span>
      {/* Spread `rest` PRIMER perquè els atributs nadius (placeholder, etc.)
          no sobreescriguin mai `value` ni `onChange`. Tot i que el tipus els
          exclou via Omit, és més robust ordenar-ho així — el cas que ens
          va passar amb el Hero (els camps semblaven buits) es deu a aquest
          ordre: si `rest` portés un value=undefined per un caller incorrecte,
          la versió anterior el sobreescriuria. */}
      <input
        {...rest}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        aria-required={required || undefined}
        className={`w-full max-w-[500px] bg-transparent border border-surface-border rounded-md px-3.5 py-2.5 text-text-main font-sans text-body-md placeholder:text-text-secondary/50 transition-colors hover:border-text-secondary/60 focus:outline-none focus:border-text-main focus:ring-2 focus:ring-text-main/20 ${inputClassName}`}
      />
    </label>
  )
}

function Textarea({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string
  value: string
  onChange: (v: string) => void
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-body-sm font-medium text-text-secondary">{label}</span>
      <textarea
        {...rest}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-[500px] bg-transparent border border-surface-border rounded-md px-3.5 py-3 text-text-main font-sans text-body-md placeholder:text-text-secondary/50 transition-colors hover:border-text-secondary/60 focus:outline-none focus:border-text-main focus:ring-2 focus:ring-text-main/20 resize-y leading-relaxed"
      />
    </label>
  )
}

function OverlaySlider({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (v: number) => void
  /** Quan no hi ha imatge, el slider perd sentit. El mostrem grisós com a
      affordance — l'usuari veu que el control existeix però que no
      té efecte fins que pugi una imatge. */
  disabled?: boolean
}) {
  return (
    /* Estructura Figma 11176:4399:
       · gap-[16px] (gap-4) entre header / track / hint
       · header: label uppercase a l'esquerra, valor regular a la dreta
         (no font-mono — el Figma usa Inter Regular 13px)
       · track HTML <input type="range"> amb accent-text-main */
    <div className={`flex flex-col gap-4 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-body-sm font-medium text-text-secondary">
          Overlay fosc
        </span>
        <span className="text-body-sm text-text-main tabular-nums">
          {value}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={80}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        aria-label="Overlay fosc sobre la imatge de fons"
        aria-disabled={disabled}
        className="w-full accent-[var(--text-main)] cursor-pointer disabled:cursor-not-allowed"
      />
      <p className="text-body-sm text-text-secondary/80 leading-snug">
        {disabled
          ? 'Puja una imatge de fons per activar l\'overlay. S\'enfosqueix la imatge per millorar la legibilitat del títol.'
          : 'Enfosqueix la imatge per millorar la legibilitat del títol. 0% sense overlay, 80% molt fosc.'}
      </p>
    </div>
  )
}

// NOTE: ColorField mogut a `./ColorField.tsx` perquè el comparteixin
// WorkContentEditor (mode controlat) i WorkForm (mode uncontrolled).

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="p-1.5 rounded text-text-secondary hover:text-text-main hover:bg-surface-base transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}
