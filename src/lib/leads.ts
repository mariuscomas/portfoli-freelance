/**
 * Bústia de leads — estats i etiquetes.
 *
 * El contacte té un cicle curt: arriba, el contestes, el guardes. Res de
 * pipeline comercial (això ja ho fan les quotes); aquí només cal saber què
 * queda per despatxar.
 *
 * Els valors van en anglès perquè el CHECK de `contact_submissions` ja existia
 * així ('new', 'read', 'replied', 'archived') i `clients.status` segueix la
 * mateixa convenció. Les etiquetes en català viuen aquí, no a la base de
 * dades. De la llista original no fem servir 'read': obrir un missatge no és
 * un estat que valgui la pena mantenir a mà.
 *
 * `is_spam` tampoc és un estat: un missatge marcat com a spam conserva el seu
 * i només desapareix de la vista per defecte.
 */

export const CONTACT_STATUSES = ["new", "replied", "archived"] as const
export type ContactStatus = (typeof CONTACT_STATUSES)[number]

export const CONTACT_STATUS_LABEL: Record<ContactStatus, string> = {
  new: "Nou",
  replied: "Respost",
  archived: "Arxivat",
}

/** Filtres de la llista: els estats més la vista de spam. */
export const CONTACT_FILTERS = ["tots", ...CONTACT_STATUSES, "spam"] as const
export type ContactFilter = (typeof CONTACT_FILTERS)[number]

export const CONTACT_FILTER_LABEL: Record<ContactFilter, string> = {
  tots: "Tots",
  new: "Nous",
  replied: "Responts",
  archived: "Arxivats",
  spam: "Spam",
}

export function isContactStatus(value: string): value is ContactStatus {
  return (CONTACT_STATUSES as readonly string[]).includes(value)
}

/**
 * El modal de contacte hi afegeix un sufix per saber d'on ve el missatge.
 * A la llista sobra: ja tenim la columna d'origen.
 */
export function cleanMessage(message: string): string {
  return message.replace(/\n*—\s*\[via [^\]]+\]\s*$/i, "").trim()
}
