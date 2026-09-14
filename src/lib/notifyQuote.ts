/**
 * Notificació per email d'una quote nova (via l'API de Resend, sense
 * dependència). És OPT-IN: si no hi ha `RESEND_API_KEY` a l'entorn, no fa
 * res (així el submit no depèn de l'email ni peta en local).
 *
 * Env vars:
 *   RESEND_API_KEY  — clau de Resend (obligatòria per activar-ho)
 *   NOTIFY_EMAIL    — destinatari (per defecte mariuscr23@gmail.com)
 *   RESEND_FROM     — remitent verificat (per defecte el sandbox de Resend)
 */

interface QuoteNotification {
  product: string;
  email: string;
  name?: string | null;
  summary?: string | null;
  totalEur?: number | null;
  rateLabel?: string | null;
}

export async function notifyNewQuote(q: QuoteNotification): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // no configurat → no-op silenciós

  const to = process.env.NOTIFY_EMAIL || "mariuscr23@gmail.com";
  const from = process.env.RESEND_FROM || "Màrius Freelance <onboarding@resend.dev>";
  const amount = q.totalEur != null ? `${q.totalEur} €` : q.rateLabel ?? "—";

  const text = [
    `Producte: ${q.product}`,
    `Import: ${amount}`,
    `Email: ${q.email}`,
    q.name ? `Nom: ${q.name}` : null,
    "",
    q.summary ?? "",
    "",
    "— Veure a /admin/quotes",
  ]
    .filter((l) => l !== null)
    .join("\n");

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: q.email,
        subject: `Nou pressupost · ${q.product} · ${amount}`,
        text,
      }),
    });
  } catch {
    // Un fallo d'email no ha de trencar l'enviament de la quote.
  }
}
