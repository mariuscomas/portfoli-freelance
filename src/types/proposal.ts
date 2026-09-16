/**
 * Forma del payload que retorna `get_proposal(token)` a Supabase.
 *
 * El preu SEMPRE surt del snapshot desat a `quotes.pricing`: si es repricia el
 * catàleg, una proposta ja enviada no canvia de número. Les etiquetes de text
 * (abast, noms de fase) sí que es deriven de `pricing.ts`, perquè són llenguatge
 * i no imports.
 */

export interface QuoteLineSnapshot {
  id: string;
  label: string;
  amount: number;
}

/** Snapshot de web/landing (calcConfiguration) o auditoria (calcAudit). */
export interface PricingSnapshot {
  baseTotal?: number;
  phases?: QuoteLineSnapshot[];
  extras?: QuoteLineSnapshot[];
  extrasTotal?: number;
  total?: number;
  /** Auditoria */
  sizeIncrement?: number;
  focuses?: string[];
}

export interface SelectionSnapshot {
  disciplines?: string[];
  pages?: number;
  languages?: number;
  motion?: boolean;
  cms?: boolean;
  redaccio?: boolean;
  focuses?: string[];
  size?: string;
  extras?: string[];
}

export interface ProposalPayload {
  reference: string;
  product: "web" | "landing" | "auditoria" | "collaboracio";
  name: string | null;
  summary: string | null;
  selection: SelectionSnapshot | null;
  pricing: PricingSnapshot | null;
  total_eur: number | null;
  rate_label: string | null;
  pricing_version: string | null;
  status: string;
  sent_at: string;
  expires_at: string | null;
  is_expired: boolean;
  is_closed: boolean;
}
