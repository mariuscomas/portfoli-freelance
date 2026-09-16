/**
 * Validació compartida dels formularis públics.
 *
 * Fins al 16set26 cada server action portava la seva còpia del regex d'email i
 * dels límits de longitud. Tres còpies volen dir tres llocs on el criteri pot
 * divergir sense que ningú se n'adoni, i cap d'elles tenia test perquè les
 * actions importen next/headers i Supabase.
 *
 * Aquest mòdul és pur a posta: cap import, cap dependència de Next. Així el
 * runner de tests de Node (`npm test`) el pot carregar directament.
 *
 * Els missatges van en català perquè arriben tal qual a l'usuari.
 */

/** Deliberadament permissiu: filtra errors evidents, no valida l'existència. */
export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

/** El límit de 320 és el màxim d'una adreça segons l'RFC 5321. */
export const LIMITS = {
  emailMax: 320,
  nameMax: 200,
  messageMin: 5,
  messageMax: 5000,
  summaryMax: 8000,
} as const

export function isValidEmail(email: string): boolean {
  return email.length <= LIMITS.emailMax && EMAIL_REGEX.test(email)
}

/** Honeypot: camp invisible per a humans. Si porta res, ve d'un bot. */
export function isBot(honeypot: string | undefined | null): boolean {
  return (honeypot || "").trim().length > 0
}

export const MESSAGES = {
  email: "Si us plau, escriu un email vàlid.",
  messageShort: `El missatge ha de tenir almenys ${LIMITS.messageMin} caràcters.`,
  messageLong: `El missatge és massa llarg (màx ${LIMITS.messageMax} caràcters).`,
  nameLong: "El nom és massa llarg.",
  summaryLong: "El resum és massa llarg.",
  product: "Producte no vàlid.",
} as const

/**
 * Validació del formulari de contacte. Retorna el primer error trobat, o null
 * si tot està bé: els formularis mostren un missatge cada vegada, no una llista.
 */
export function validateContact(input: {
  email: string
  name?: string
  message: string
}): string | null {
  if (!isValidEmail(input.email)) return MESSAGES.email
  if (input.message.length < LIMITS.messageMin) return MESSAGES.messageShort
  if (input.message.length > LIMITS.messageMax) return MESSAGES.messageLong
  if ((input.name || "").length > LIMITS.nameMax) return MESSAGES.nameLong
  return null
}

/** Validació del formulari de newsletter: només hi ha l'adreça. */
export function validateNewsletter(email: string): string | null {
  return isValidEmail(email) ? null : MESSAGES.email
}

/**
 * Validació d'una configuració enviada des dels configuradors. El producte
 * arriba com a string des del client, així que es comprova contra la llista.
 */
export function validateQuote(input: {
  email: string
  name?: string
  message?: string
  product: string
  products: readonly string[]
}): string | null {
  if (!isValidEmail(input.email)) return MESSAGES.email
  if (!input.products.includes(input.product)) return MESSAGES.product
  if ((input.name || "").length > LIMITS.nameMax) return MESSAGES.nameLong
  if ((input.message || "").length > LIMITS.summaryMax) return MESSAGES.summaryLong
  return null
}
