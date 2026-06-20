"use client"

import { Suspense, useEffect, useId, useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, CheckCircle, Warning } from "@phosphor-icons/react"
import TransitionLink from "@/components/common/TransitionLink"
import { submitContact } from "@/app/contacte/actions"

/**
 * <ContactForm />
 *
 * Form de contacte públic. Crida la Server Action `submitContact` que
 * desa a la taula `contact_submissions` a Supabase.
 *
 * Estats:
 *   - idle: form visible, llest per omplir
 *   - submitting: deshabilitat amb spinner
 *   - sent: confirmació
 *   - error: missatge visible, form encara editable
 *
 * Anti-spam: camp honeypot "website" amagat — els bots l'omplen,
 * els humans no. Si arriba ple, simulem èxit sense desar.
 *
 * A11y (WCAG 2.1 AA): anell de focus fosc coherent amb el DS (focus/ring →
 * ring-primary-main), indicador d'obligatori accessible (sr-only), error
 * amb role=alert associat al submit via aria-describedby, targets ≥44px i
 * suport de prefers-reduced-motion.
 */

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "sent" }
  | { kind: "error"; message: string }

/**
 * Llegim el query param `?service=xxx` per pre-omplir el missatge
 * quan l'usuari ve d'un servei concret del modal.
 */
function useServiceFromUrl(): string | null {
  const params = useSearchParams()
  return params.get("service")
}

function ContactFormInner() {
  const [state, setState] = useState<FormState>({ kind: "idle" })
  const [isPending, startTransition] = useTransition()
  const serviceSlug = useServiceFromUrl()
  const [prefillMessage, setPrefillMessage] = useState("")
  const reduce = useReducedMotion()
  const errorId = useId()

  // Pre-omplim el missatge si venim d'un servei. Només una vegada.
  useEffect(() => {
    if (serviceSlug) {
      const readable = serviceSlug.replace(/-/g, " ")
      setPrefillMessage(
        `Hola Màrius,\n\nM'interessa el teu servei de "${readable}". M'agradaria explicar-te el meu projecte i veure com podem treballar junts.\n\n`
      )
    }
  }, [serviceSlug])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const message = String(form.get("message") || "")
    // Si venim d'un servei, ho afegim al final del missatge perquè quedi
    // registrat a la BD (sense que es vegi a l'UI del form).
    const augmentedMessage = serviceSlug
      ? `${message}\n\n— [via /serveis/${serviceSlug}]`
      : message
    const input = {
      email: String(form.get("email") || ""),
      name: String(form.get("name") || ""),
      message: augmentedMessage,
      website: String(form.get("website") || ""), // honeypot
    }

    setState({ kind: "submitting" })

    startTransition(async () => {
      const res = await submitContact(input)
      if (res.status === "ok") setState({ kind: "sent" })
      else setState({ kind: "error", message: res.message })
    })
  }

  if (state.kind === "sent") {
    return (
      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-6 max-w-2xl"
        role="status"
        aria-live="polite"
      >
        <CheckCircle size={48} weight="thin" className="text-accent" aria-hidden="true" />
        <h3 className="text-heading-h2 text-text-main">Missatge enviat.</h3>
        <p className="text-body-lg text-text-secondary leading-relaxed">
          T&apos;he rebut el missatge. Responc en menys de 24 hores feiners.
          Mentrestant pots fer una ullada als{" "}
          <TransitionLink
            href="/works"
            className="underline underline-offset-4 hover:text-accent transition-colors rounded-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
          >
            treballs recents
          </TransitionLink>
          .
        </p>
        <button
          type="button"
          onClick={() => setState({ kind: "idle" })}
          className="inline-flex items-center min-h-11 font-sans text-body-md text-text-secondary hover:text-accent transition-colors duration-300 underline underline-offset-4 w-fit rounded-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
        >
          Enviar un altre missatge
        </button>
      </motion.div>
    )
  }

  const isSubmitting = state.kind === "submitting" || isPending

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-2xl" noValidate>
      {/* Honeypot: visualment ocult i fora del tab order */}
      <label
        aria-hidden="true"
        className="absolute -left-[9999px] w-px h-px overflow-hidden"
        tabIndex={-1}
      >
        No omplis aquest camp
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <Field
        label="Nom"
        name="name"
        type="text"
        autoComplete="name"
        placeholder="Marius Comas"
        disabled={isSubmitting}
      />

      <Field
        label="Email"
        required
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="tu@correu.com"
        disabled={isSubmitting}
      />

      <Textarea
        label="Missatge"
        required
        name="message"
        rows={prefillMessage ? 8 : 5}
        minLength={5}
        maxLength={5000}
        placeholder="Explica'm la teva idea, projecte o repte..."
        disabled={isSubmitting}
        defaultValue={prefillMessage}
        key={prefillMessage /* re-render quan canvia el prefill */}
      />

      {state.kind === "error" && (
        <p id={errorId} role="alert" className="flex items-start gap-3 text-body-md text-error">
          <Warning size={20} weight="regular" className="shrink-0 mt-0.5" aria-hidden="true" />
          <span>{state.message}</span>
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        aria-describedby={state.kind === "error" ? errorId : undefined}
        className="group inline-flex items-center gap-3 self-start min-h-11 px-6 py-3 bg-text-main text-text-main-inverse rounded-full font-sans font-medium text-body-md hover:bg-accent hover:text-text-main transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-main focus-visible:ring-offset-surface-base"
      >
        {isSubmitting ? "Enviant..." : "Enviar missatge"}
        {!isSubmitting && (
          <ArrowRight size={18} weight="regular" className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        )}
      </button>

      <p className="text-body-xs text-text-secondary leading-relaxed max-w-prose">
        En enviar acceptes que rebi i guardi el teu missatge per respondre&apos;t.
        No el comparteixo amb tercers.
      </p>
    </form>
  )
}

/* Primitives — coherents amb la resta del site */

function Field({
  label,
  required,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-body-sm text-text-secondary uppercase tracking-wider">
        {label}
        {required && (
          <>
            {" "}
            <span aria-hidden="true">*</span>
            <span className="sr-only"> (obligatori)</span>
          </>
        )}
      </span>
      <input
        {...props}
        required={required}
        aria-required={required || undefined}
        className="w-full bg-transparent border-b border-text-secondary/40 py-3 text-text-main font-sans text-body-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base focus:border-text-main transition-colors placeholder:text-text-secondary/40 disabled:opacity-50"
      />
    </label>
  )
}

function Textarea({
  label,
  required,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-body-sm text-text-secondary uppercase tracking-wider">
        {label}
        {required && (
          <>
            {" "}
            <span aria-hidden="true">*</span>
            <span className="sr-only"> (obligatori)</span>
          </>
        )}
      </span>
      <textarea
        {...props}
        required={required}
        aria-required={required || undefined}
        className="w-full bg-transparent border border-surface-border rounded-md p-4 text-text-main font-sans text-body-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base focus:border-text-main transition-colors placeholder:text-text-secondary/40 resize-y disabled:opacity-50"
      />
    </label>
  )
}

/**
 * Wrapper públic — embolicat en <Suspense> perquè useSearchParams ho
 * requereix a App Router (per a SSR streaming). Sense això, Next falla
 * el build amb "useSearchParams() should be wrapped in a suspense boundary".
 */
export default function ContactForm() {
  return (
    <Suspense fallback={null}>
      <ContactFormInner />
    </Suspense>
  )
}
