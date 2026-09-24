import { headers } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { SITE_EMAIL } from "@/lib/site"

/**
 * Rate limit dels formularis públics, per IP i finestra de temps.
 *
 * Decisió deliberada: **fail-open**. Si la comprovació falla (la funció no hi
 * és, la base de dades no respon, no sabem la IP), deixem passar l'enviament.
 * Perdre un lead real és pitjor que deixar colar un intent de brossa, i el
 * honeypot segueix al seu lloc.
 */

export type RateLimitKind = "contacte" | "newsletter" | "quote"

async function clientIp(): Promise<string | null> {
  const h = await headers()
  // Vercel i la majoria de proxies posen la IP real la primera.
  const forwarded = h.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return h.get("x-real-ip")
}

/** Retorna true si l'enviament pot continuar. */
export async function allowSubmission(kind: RateLimitKind): Promise<boolean> {
  try {
    const ip = await clientIp()
    if (!ip) return true

    const supabase = await createClient()
    // Els llindars viuen a la funció de Postgres, no aquí: l'RPC és cridable
    // per anon i, si els rebés per paràmetre, qualsevol podria afluixar-los.
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_kind: kind,
      p_ip: ip,
    })

    if (error) {
      console.error("[rateLimit]", error.message)
      return true
    }
    return data !== false
  } catch (err) {
    console.error("[rateLimit]", err instanceof Error ? err.message : err)
    return true
  }
}

/** Missatge únic, perquè les tres actions diguin el mateix. */
export const RATE_LIMIT_MESSAGE =
  `Has enviat uns quants missatges seguits. Prova-ho d’aquí una estona o escriu a ${SITE_EMAIL}.`
