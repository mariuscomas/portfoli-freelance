"use server"

import { headers } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import type { ContactSubmissionInsert } from "@/types/database"
import { notifyNewContact } from "@/lib/notifyLead"
import { isBot, validateContact } from "@/lib/validation"
import { allowSubmission, RATE_LIMIT_MESSAGE } from "@/lib/rateLimit"

/**
 * Server Action invocada des del form de /contacte.
 * Valida i desa a la taula `contact_submissions`. La RLS de Supabase
 * permet INSERT a anon, així que no cal autenticació.
 *
 * Retorna { ok, error? } perquè el client mostri feedback sense
 * llançar excepcions visibles a l'usuari.
 */

/**
 * Resultat de submitContact. No incloem "idle" perquè és un estat només
 * del client (abans d'enviar). La Server Action retorna sempre ok o error.
 */
export type ContactResult =
  | { status: "ok" }
  | { status: "error"; message: string }

interface SubmitInput {
  email: string
  name?: string
  message: string
  /** Honeypot: si el bot l'omple, descartem el missatge silenciosament. */
  website?: string
}

export async function submitContact(input: SubmitInput): Promise<ContactResult> {
  const email = (input.email || "").trim()
  const name = (input.name || "").trim()
  const message = (input.message || "").trim()
  const honeypot = (input.website || "").trim()

  // Honeypot ompert → simulem èxit per no donar info als bots, però no desem
  if (isBot(honeypot)) {
    return { status: "ok" }
  }

  // Validacions bàsiques (lib/validation.ts, compartides i testejades). La RLS
  // de Postgres també les fa, però aquí donem un missatge més útil a l'usuari.
  const invalid = validateContact({ email, name, message })
  if (invalid) {
    return { status: "error", message: invalid }
  }

  // Rate limit per IP. Va després de validar: un enviament mal format no
  // consumeix quota de qui simplement s'ha equivocat escrivint l'email.
  if (!(await allowSubmission("contacte"))) {
    return { status: "error", message: RATE_LIMIT_MESSAGE }
  }

  const supabase = await createClient()

  // Capturem el user agent per si volem distingir spam més endavant.
  const h = await headers()
  const userAgent = h.get("user-agent") || null

  const insert: ContactSubmissionInsert = {
    email,
    name: name || null,
    message,
    source: "/contacte",
    user_agent: userAgent,
  }

  const { error } = await supabase.from("contact_submissions").insert(insert)

  if (!error) {
    // L'avís va després de desar: si el correu falla, el lead no es perd.
    await notifyNewContact({ email, name: name || null, message, source: "/contacte" })
  }

  if (error) {
    // Postgres pot retornar errors de check constraint si el regex de email
    // o la longitud han fallat malgrat les nostres validacions.
    return {
      status: "error",
      message: "No hem pogut enviar el missatge. Torna-ho a provar en uns minuts.",
    }
  }

  return { status: "ok" }
}
