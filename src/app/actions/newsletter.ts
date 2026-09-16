"use server"

import { headers } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import type { NewsletterSubscriberInsert } from "@/types/database"
import { allowSubmission, RATE_LIMIT_MESSAGE } from "@/lib/rateLimit"
import { isBot, validateNewsletter } from "@/lib/validation"

/**
 * Server Action del form de newsletter del Footer.
 * Mateix patró que submitContact (/contacte): valida, honeypot i desa
 * a `newsletter_subscribers`. La RLS permet INSERT a anon amb email vàlid.
 */

export type NewsletterResult =
  | { status: "ok" }
  | { status: "error"; message: string }

interface SubscribeInput {
  email: string
  /** Honeypot: si el bot l'omple, simulem èxit sense desar. */
  website?: string
}

export async function subscribeNewsletter(
  input: SubscribeInput
): Promise<NewsletterResult> {
  const email = (input.email || "").trim().toLowerCase()
  const honeypot = (input.website || "").trim()

  if (isBot(honeypot)) {
    return { status: "ok" }
  }

  const invalid = validateNewsletter(email)
  if (invalid) {
    return { status: "error", message: invalid }
  }

  if (!(await allowSubmission("newsletter"))) {
    return { status: "error", message: RATE_LIMIT_MESSAGE }
  }

  const supabase = await createClient()

  const h = await headers()
  const userAgent = h.get("user-agent") || null

  const insert: NewsletterSubscriberInsert = {
    email,
    source: "footer",
    user_agent: userAgent,
  }

  const { error } = await supabase.from("newsletter_subscribers").insert(insert)

  if (error) {
    // 23505 = unique_violation: ja estava subscrit. Ho tractem com a èxit
    // per no revelar quins emails hi ha a la llista.
    if (error.code === "23505") {
      return { status: "ok" }
    }
    return {
      status: "error",
      message: "No s'ha pogut completar la subscripció. Torna-ho a provar en uns minuts.",
    }
  }

  return { status: "ok" }
}
