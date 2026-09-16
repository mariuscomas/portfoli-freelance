/**
 * Avís per correu quan entra un lead pel modal de contacte.
 *
 * Va amb `reply_to` del remitent: l'avís és útil si pots contestar-lo des del
 * mateix correu, sense passar per l'admin. Com la resta d'avisos, no pot
 * tombar el submit — si Resend falla, el missatge ja és desat i l'error queda
 * al log (i el veuràs a /admin/leads igualment).
 */

import { sendMail, type MailResult } from "./mail"

interface ContactNotification {
  email: string
  name: string | null
  message: string
  source: string | null
}

export async function notifyNewContact(c: ContactNotification): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, skipped: true }

  const to = process.env.NOTIFY_EMAIL || "mariuscr23@gmail.com"
  const from = process.env.RESEND_FROM || "Màrius Freelance <onboarding@resend.dev>"
  const who = c.name ? `${c.name} (${c.email})` : c.email

  return sendMail(
    {
      from,
      to,
      reply_to: c.email,
      subject: `Nou missatge · ${c.name || c.email}`,
      text: [
        `De: ${who}`,
        c.source ? `Origen: ${c.source}` : null,
        "",
        c.message,
        "",
        "Respon aquest correu per contestar-li directament.",
        "— Veure a /admin/leads",
      ]
        .filter((l) => l !== null)
        .join("\n"),
    },
    key,
  )
}
