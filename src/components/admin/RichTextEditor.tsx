"use client"

import { useId, useEffect } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
  TextB,
  TextItalic,
  TextUnderline,
  Link as LinkIcon,
  ListBullets,
  ListNumbers,
  TextStrikethrough,
} from '@phosphor-icons/react'

/**
 * <RichTextEditor />
 *
 * WYSIWYG editor lleuger basat en TipTap. Toolbar amb les operacions
 * més comunes (Bold/Italic/Underline/Strike/Link/Llistes). Produeix
 * HTML semi-net (`<p>`, `<strong>`, `<em>`, `<u>`, `<a>`, `<ul>/<ol>/<li>`).
 *
 * Modes:
 *  - **Uncontrolled** (per <form>): passa `name` + opcionalment
 *    `defaultValue`. Renderitza un <input type="hidden"> amb l'HTML
 *    actual perquè FormData el reculli.
 *  - **Controlled**: passa `value` + `onChange`. Cap input hidden.
 *
 * L'estètica visual mimicritza el `Field`/`Textarea` del WorkForm:
 * mateix background, border, padding, focus ring. Així el form es
 * llegeix uniforme.
 */

interface Props {
  /** Etiqueta visible a sobre del camp. */
  label: string
  /** Hint sota el camp. */
  hint?: string
  /** Marca el camp com obligatori (només UI). */
  required?: boolean
  /** Placeholder quan està buit. */
  placeholder?: string
  /** Mínim files visibles (alçada inicial; pot créixer). Default 4. */
  rows?: number

  /* Mode uncontrolled */
  /** Nom de l'input hidden. */
  name?: string
  /** Valor inicial HTML. */
  defaultValue?: string | null

  /* Mode controlled */
  /** Valor HTML actual. */
  value?: string | null
  /** Callback amb el nou HTML. */
  onChange?: (html: string) => void

  /** Classes addicionals al wrapper extern (ex: `max-w-[500px]`). */
  className?: string
}

/**
 * Estima si una cadena és text pla (sense tags HTML). Útil per envoltar
 * dades legacy en <p>...</p> al carregar al editor, ja que TipTap les
 * descartaria sense estructura de paràgraf.
 */
function ensureParagraphWrap(content: string): string {
  const trimmed = content.trim()
  if (!trimmed) return ''
  // Si ja conté tags d'estructura, deixem-lo intacte
  if (/<(p|div|h[1-6]|ul|ol|li|br)\b/i.test(trimmed)) return trimmed
  return `<p>${trimmed}</p>`
}

export default function RichTextEditor({
  label,
  hint,
  required,
  placeholder,
  rows = 4,
  name,
  defaultValue,
  value,
  onChange,
  className = '',
}: Props) {
  const id = useId()
  const isControlled = onChange !== undefined
  const initialContent = ensureParagraphWrap(
    (isControlled ? (value ?? '') : (defaultValue ?? '')) || '',
  )

  const editor = useEditor({
    // SSR: no renderitzem immediatament per evitar mismatch d'hidratació.
    // `immediatelyRender: false` ho retarda al client.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Mantenim els bàsics; deshabilitem features que no ens calen
        // per simplificar el HTML resultant.
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Comença a escriure…',
        emptyEditorClass:
          'before:content-[attr(data-placeholder)] before:text-text-secondary/50 before:float-left before:pointer-events-none before:h-0',
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        // Estil del contenidor d'edició — coincideix amb els altres
        // inputs del WorkForm (bg-surface-base, border, padding, focus).
        class:
          'prose prose-sm max-w-none focus:outline-none ' +
          'min-h-[var(--rte-min-height)] ' +
          // Estil propi (no purament prose):
          'prose-p:my-2 prose-p:leading-relaxed ' +
          'prose-strong:text-text-main prose-strong:font-semibold ' +
          'prose-em:text-text-main ' +
          'prose-a:text-text-main prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-accent ' +
          'prose-ul:my-2 prose-ol:my-2 prose-li:my-0',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      // Tractem editor buit com a string buit per evitar guardar `<p></p>`
      const isEmpty = editor.isEmpty
      const value = isEmpty ? '' : html
      if (isControlled) onChange?.(value)
    },
  })

  // Sincronització externa per mode controlat: si el `value` extern canvia
  // (p. ex. quan es carrega un work des del servidor), actualitzem el
  // contingut del editor sense crear loops.
  useEffect(() => {
    if (!editor || !isControlled) return
    const incoming = ensureParagraphWrap(value ?? '')
    const current = editor.getHTML()
    if (incoming !== current && (incoming || current !== '<p></p>')) {
      editor.commands.setContent(incoming || '', { emitUpdate: false })
    }
  }, [editor, value, isControlled])

  // ── Hidden input per a mode uncontrolled (FormData) ──
  // L'estat es manté al editor, però per al submit del form necessitem
  // un input nadiu. Llegim el HTML directament del editor (getHTML).
  const hiddenValue = editor && !editor.isEmpty ? editor.getHTML() : ''

  // Alçada mínima inicial basada en `rows` (línia aprox 1.5em a 16px = 24px)
  const minHeightStyle = { ['--rte-min-height' as string]: `${rows * 1.75}rem` }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label
        htmlFor={id}
        className="inline-flex items-center gap-1 text-body-sm font-medium text-text-secondary"
      >
        {label}
        {required && <span className="text-error">*</span>}
      </label>

      {/* Toolbar + editor en un sol "card" amb estil de input */}
      <div
        className="flex flex-col bg-transparent border border-surface-border rounded-md overflow-hidden focus-within:border-text-main focus-within:ring-2 focus-within:ring-text-main/20 hover:border-text-secondary/60 transition-colors"
        style={minHeightStyle as React.CSSProperties}
      >
        <Toolbar editor={editor} />
        <div className="px-3.5 py-2.5 cursor-text" onClick={() => editor?.commands.focus()}>
          <EditorContent id={id} editor={editor} />
        </div>
      </div>

      {/* Hidden input per submit del <form>. Només en mode uncontrolled. */}
      {!isControlled && name && (
        <input type="hidden" name={name} value={hiddenValue} />
      )}

      {hint && (
        <p className="text-body-sm text-text-secondary/80 leading-snug max-w-prose">
          {hint}
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Toolbar                                                            */
/* ------------------------------------------------------------------ */

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    // Render placeholder buit mentre el editor encara no està inicialitzat
    // (SSR + primera fase de hidratació)
    return (
      <div className="h-9 border-b border-surface-border bg-surface-card/40 shrink-0" />
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-surface-border bg-surface-card/60">
      <ToolbarButton
        label="Negreta"
        shortcut="⌘B"
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
      >
        <TextB size={16} weight="bold" />
      </ToolbarButton>
      <ToolbarButton
        label="Cursiva"
        shortcut="⌘I"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
      >
        <TextItalic size={16} weight="bold" />
      </ToolbarButton>
      <ToolbarButton
        label="Subratllat"
        shortcut="⌘U"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
      >
        <TextUnderline size={16} weight="bold" />
      </ToolbarButton>
      <ToolbarButton
        label="Ratllat"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
      >
        <TextStrikethrough size={16} weight="bold" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Enllaç"
        shortcut="⌘K"
        onClick={() => {
          const previous = editor.getAttributes('link').href as string | undefined
          const url = window.prompt('URL de l\'enllaç:', previous || 'https://')
          if (url === null) return
          if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
          }
          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
        }}
        active={editor.isActive('link')}
      >
        <LinkIcon size={16} weight="regular" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Llista"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
      >
        <ListBullets size={16} weight="regular" />
      </ToolbarButton>
      <ToolbarButton
        label="Llista ordenada"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
      >
        <ListNumbers size={16} weight="regular" />
      </ToolbarButton>
    </div>
  )
}

function ToolbarButton({
  children,
  label,
  shortcut,
  onClick,
  active,
}: {
  children: React.ReactNode
  label: string
  shortcut?: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex items-center justify-center w-7 h-7 rounded transition-colors ${
        active
          ? 'bg-text-main text-text-main-inverse'
          : 'text-text-secondary hover:text-text-main hover:bg-surface-base'
      }`}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <span className="w-px h-4 bg-surface-border mx-1" aria-hidden="true" />
}
