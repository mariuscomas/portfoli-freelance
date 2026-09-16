"use server";

import { createClient } from "@/utils/supabase/server";
import type { Json, QuoteInsert } from "@/types/database";
import { PRICING_VERSION } from "@/lib/pricing";
import { notifyNewQuote } from "@/lib/notifyQuote";
import { notifyQuoteReceived } from "@/lib/notifyProposal";

/**
 * Server Action dels configuradors (web/landing/auditoria/col·laboració).
 * Desa una fila a `quotes` amb SNAPSHOT del preu — el catàleg viu a pricing.ts.
 * La quote és un lead autosuficient (email/nom + resum + selecció + càlcul),
 * així que no depèn de crear un contact_submission (que amb la RLS anon no
 * permetria recuperar l'id per enllaçar).
 *
 * RLS: INSERT permès a anon; per això no cal autenticació.
 */

export type QuoteResult =
  | { status: "ok"; ref: string | null }
  | { status: "error"; message: string };

/** Referència curta i llegible a partir de l'uuid del quote (p. ex. "A3F2"). */
function refFromId(id: string | null | undefined): string | null {
  if (!id) return null;
  return id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || null;
}

export type QuoteProduct = "web" | "landing" | "auditoria" | "collaboracio";

interface SubmitQuoteInput {
  email: string;
  name?: string;
  /** Resum llegible (el mateix que abans anava al missatge del contacte). */
  message: string;
  /** Honeypot: si s'omple, descartem silenciosament. */
  website?: string;
  product: QuoteProduct;
  /** Tria crua de l'usuari (rol/focus/talla/extres/modalitat…). */
  selection: Json;
  /** Snapshot del càlcul de pricing.ts (base, extres, total, tarifa…). */
  pricing: Json;
  /** Total en euros (projectes). NULL a col·laboració. */
  totalEur?: number | null;
  /** Tarifa "des de" (col·laboració, "38 €/h"). NULL a projectes. */
  rateLabel?: string | null;
  /** Canal d'atribució declarat ("Com m'has conegut?"). NULL si no s'omple. */
  source?: string | null;
}

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PRODUCTS: QuoteProduct[] = ["web", "landing", "auditoria", "collaboracio"];

export async function submitQuote(input: SubmitQuoteInput): Promise<QuoteResult> {
  const email = (input.email || "").trim();
  const name = (input.name || "").trim();
  const message = (input.message || "").trim();
  const honeypot = (input.website || "").trim();
  const source = (input.source || "").trim();

  // Honeypot omplert → simulem èxit sense desar.
  if (honeypot.length > 0) return { status: "ok", ref: null };

  if (!EMAIL_REGEX.test(email)) {
    return { status: "error", message: "Si us plau, escriu un email vàlid." };
  }
  if (!PRODUCTS.includes(input.product)) {
    return { status: "error", message: "Producte no vàlid." };
  }
  if (name.length > 200) {
    return { status: "error", message: "El nom és massa llarg." };
  }
  if (message.length > 8000) {
    return { status: "error", message: "El resum és massa llarg." };
  }

  const supabase = await createClient();

  // Generem l'id nosaltres: la RLS anon permet INSERT però NO SELECT, així que
  // no podem llegir l'id de tornada. Generant-lo aquí tenim la referència sense
  // read-back i queda desat com a PK (l'admin hi pot arribar).
  const id = crypto.randomUUID();

  const insert: QuoteInsert = {
    id,
    email,
    name: name || null,
    product: input.product,
    selection: input.selection,
    pricing: input.pricing,
    total_eur: input.totalEur ?? null,
    rate_label: input.rateLabel ?? null,
    pricing_version: PRICING_VERSION,
    summary: message || null,
    source: source || null,
  };

  const { error } = await supabase.from("quotes").insert(insert);

  if (error) {
    return {
      status: "error",
      message: "No hem pogut enviar-ho. Torna-ho a provar en uns minuts.",
    };
  }

  // Acusament de rebuda al client: sense això, qui envia una configuració es
  // queda 48 h sense cap senyal que hagi arribat enlloc.
  await notifyQuoteReceived({ to: email, name: name || null, product: input.product });

  // Notificació per email (opt-in via RESEND_API_KEY). No bloqueja el resultat.
  await notifyNewQuote({
    product: input.product,
    email,
    name: name || null,
    summary: message || null,
    totalEur: input.totalEur ?? null,
    rateLabel: input.rateLabel ?? null,
  });

  return { status: "ok", ref: refFromId(id) };
}
