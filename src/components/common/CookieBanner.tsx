"use client"

import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CONSENT_CHANGE_EVENT,
  readConsent,
  setConsent,
  type ConsentValue,
} from "@/lib/analytics"

/**
 * Banner de consentiment d'analítica.
 *
 * Surt només si encara no hi ha decisió, i el footer el pot reobrir emetent
 * CONSENT_CHANGE_EVENT amb detall "reopen". Les dues opcions pesen igual:
 * rebutjar ha de ser tan fàcil com acceptar.
 *
 * Es munta al client i no es renderitza al servidor: així no hi ha cap
 * parpelleig de banner per a qui ja ha decidit.
 */
function subscribe(callback: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(CONSENT_CHANGE_EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

export default function CookieBanner() {
  // Si a /admin no hi ha analítica, demanar-hi consentiment no té sentit.
  const pathname = usePathname()

  // Al servidor diem que ja hi ha decisió: així el banner no apareix mai al
  // primer paint i no hi ha ni flash ni mismatch d'hidratació.
  const hasDecision = useSyncExternalStore(
    subscribe,
    useCallback(() => readConsent() !== null, []),
    () => true,
  )
  const [reopened, setReopened] = useState(false)

  useEffect(() => {
    const onChange = (e: Event) => {
      if ((e as CustomEvent).detail === "reopen") setReopened(true)
    }
    window.addEventListener(CONSENT_CHANGE_EVENT, onChange)
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange)
  }, [])

  // El guard va aquí i no amunt: cap return abans d'haver cridat tots els hooks.
  const visible = (reopened || !hasDecision) && !pathname?.startsWith("/admin")
  if (!visible) return null

  const decide = (value: ConsentValue) => {
    setConsent(value)
    setReopened(false)
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookies d'analítica"
      className="fixed inset-x-4 bottom-4 z-[120] md:inset-x-8 lg:inset-x-16"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-card border border-border-subtle bg-surface-card p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.08)] md:flex-row md:items-center md:gap-8 md:p-6">
        <div className="flex flex-col gap-1.5">
          <p className="text-body-md font-medium text-text-main">Cookies d&apos;analítica</p>
          <p className="text-body-sm text-text-secondary leading-relaxed">
            Serveixen per saber quines pàgines es llegeixen i on s&apos;abandona el
            configurador. Res de publicitat ni de perfils. El detall és a la{" "}
            <Link href="/privacitat" className="underline underline-offset-4 hover:text-text-main">
              política de privacitat
            </Link>
            .
          </p>
        </div>

        <div className="flex shrink-0 gap-3 md:ml-auto">
          <button
            type="button"
            onClick={() => decide("denied")}
            className="flex-1 rounded-card border border-border-default px-5 py-3 text-body-sm text-text-main transition-colors hover:border-text-main md:flex-none"
          >
            Només l&apos;essencial
          </button>
          <button
            type="button"
            onClick={() => decide("granted")}
            className="flex-1 rounded-card bg-text-main px-5 py-3 text-body-sm text-text-main-inverse transition-opacity hover:opacity-90 md:flex-none"
          >
            Accepto l&apos;analítica
          </button>
        </div>
      </div>
    </div>
  )
}
