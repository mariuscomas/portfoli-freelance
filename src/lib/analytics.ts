/**
 * Analítica (GA4) amb Consent Mode.
 *
 * Google no rep res fins que el visitant accepta: el consentiment arrenca
 * denegat i només passa a concedit quan es prem «Accepto l'analítica» al
 * banner. La decisió es guarda a localStorage i es torna a aplicar a cada
 * càrrega abans que gtag enviï cap event.
 *
 * El Measurement ID no és cap secret: viatja al client a totes les webs amb
 * GA. Per això és aquí i no a una variable d'entorn que caldria mantenir en
 * tres llocs.
 */

export const GA_MEASUREMENT_ID = "G-0EVWGTZ2FL"

export const CONSENT_STORAGE_KEY = "mf-consent"
/** El footer l'emet per reobrir el banner i deixar canviar la decisió. */
export const CONSENT_CHANGE_EVENT = "mf-consent-change"

export type ConsentValue = "granted" | "denied"

type GtagArgs =
  | ["js", Date]
  | ["config", string, Record<string, unknown>?]
  | ["event", string, Record<string, unknown>?]
  | ["consent", "default" | "update", Record<string, string>]

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: GtagArgs) => void
  }
}

export function readConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null
  try {
    const v = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    return v === "granted" || v === "denied" ? v : null
  } catch {
    // Safari en privat, o cookies bloquejades: fem com si no hi hagués decisió.
    return null
  }
}

export function setConsent(value: ConsentValue) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value)
  } catch {
    // Si no es pot desar, el banner tornarà a sortir. Preferible a petar.
  }
  window.gtag?.("consent", "update", {
    analytics_storage: value === "granted" ? "granted" : "denied",
  })
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: value }))
}

/**
 * Event de producte. Si no hi ha consentiment, gtag el descarta sol: no cal
 * comprovar-ho a cada crida ni embrutar els components amb condicionals.
 */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return
  window.gtag?.("event", name, params)
}

/** Noms dels events de l'embut, en un sol lloc per no escriure'ls a mà. */
export const EVENTS = {
  contactOpen: "contact_open",
  contactSubmit: "contact_submit",
  configuratorOpen: "configurator_open",
  configuratorStep: "configurator_step",
  configuratorSubmit: "configurator_submit",
  collabOpen: "collab_open",
  collabSubmit: "collab_submit",
  // GA4 recomanat: method · content_type · item_id
  share: "share",
} as const
