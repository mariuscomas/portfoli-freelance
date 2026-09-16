/**
 * Enviament d'emails via l'API de Resend, compartit pels avisos de quotes i de
 * propostes.
 *
 * Dues regles que vénen d'un bug real: un email mai no pot tombar l'operació
 * que el dispara, però tampoc pot fallar en silenci. Abans fèiem `await fetch`
 * sense mirar la resposta, així que un 403 per domini no verificat passava
 * desapercebut i l'admin veia la proposta com a enviada.
 */

export interface MailResult {
  /** L'API ha acceptat el correu. */
  ok: boolean
  /** No hi havia RESEND_API_KEY: no s'ha intentat enviar res. */
  skipped?: boolean
  /** Codi HTTP de Resend quan ha respost amb error. */
  status?: number
  /** Missatge d'error de Resend o de xarxa, per ensenyar-lo a qui toqui. */
  error?: string
}

const API = "https://api.resend.com/emails"

export async function sendMail(
  payload: Record<string, unknown>,
  key: string,
): Promise<MailResult> {
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (res.ok) return { ok: true }

    const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string }
    const message = body.message || body.error || `Resend ha respost ${res.status}`
    console.error("[resend]", res.status, message)
    return { ok: false, status: res.status, error: message }
  } catch (err) {
    const message = err instanceof Error ? err.message : "error de xarxa"
    console.error("[resend]", message)
    return { ok: false, error: message }
  }
}
