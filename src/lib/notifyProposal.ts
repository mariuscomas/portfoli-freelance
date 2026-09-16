/**
 * Avisos per email del cicle de la proposta (Resend, via fetch).
 *
 * OPT-IN: sense RESEND_API_KEY no fa res i no peta. Cap d'aquestes funcions pot
 * tombar l'operació que les crida — un email que falla no ha de desfer una
 * acceptació ja registrada a la base de dades.
 *
 * Env: RESEND_API_KEY · NOTIFY_EMAIL (per defecte mariuscr23@gmail.com) ·
 *      RESEND_FROM (remitent verificat) · NEXT_PUBLIC_SITE_URL
 */

const API = "https://api.resend.com/emails";

function config() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return {
    key,
    to: process.env.NOTIFY_EMAIL || "mariuscr23@gmail.com",
    from: process.env.RESEND_FROM || "Màrius Freelance <onboarding@resend.dev>",
    site: process.env.NEXT_PUBLIC_SITE_URL || "https://mariusfreelance.com",
  };
}

async function send(payload: Record<string, unknown>, key: string) {
  try {
    await fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // silenci volgut: l'avís és secundari respecte de l'operació que el crida
  }
}

/** Acusament de rebuda al client, en enviar una configuració. */
export async function notifyQuoteReceived(input: {
  to: string;
  name: string | null;
  product: string;
}) {
  const c = config();
  if (!c) return;
  const hi = input.name ? `Hola, ${input.name}` : "Hola";
  await send(
    {
      from: c.from,
      to: input.to,
      reply_to: c.to,
      subject: "He rebut la teva configuració",
      text: [
        `${hi},`,
        "",
        "He rebut el que has configurat i ja hi estic mirant.",
        "",
        "Et responc en un màxim de 48 hores laborables amb una proposta tancada o, si veig que hi ha una manera millor d'encarar-ho, amb una alternativa.",
        "",
        "Si mentrestant vols afegir res, respon aquest correu.",
        "",
        "Màrius",
      ].join("\n"),
    },
    c.key,
  );
}

/** Enviament de la proposta al client, amb l'enllaç a la pàgina. */
export async function notifyProposalSent(input: {
  to: string;
  name: string | null;
  token: string;
  totalLabel: string;
  expiresLabel: string;
}) {
  const c = config();
  if (!c) return;
  const hi = input.name ? `Hola, ${input.name}` : "Hola";
  const url = `${c.site}/proposta/${input.token}`;
  await send(
    {
      from: c.from,
      to: input.to,
      reply_to: c.to,
      subject: `La teva proposta · ${input.totalLabel}`,
      text: [
        `${hi},`,
        "",
        `Aquí tens la proposta, amb el desglòs complet: ${url}`,
        "",
        `El preu està tancat i és vàlid fins al ${input.expiresLabel}.`,
        "",
        "Pots acceptar-la des de la mateixa pàgina. Si hi ha res que no et quadra, digue-m'ho i en parlem.",
        "",
        "Màrius",
      ].join("\n"),
    },
    c.key,
  );
}

/** Avís a Màrius quan un client accepta. */
export async function notifyProposalAccepted(input: { token: string; signer: string }) {
  const c = config();
  if (!c) return;
  await send(
    {
      from: c.from,
      to: c.to,
      subject: `Proposta ACCEPTADA · ${input.signer}`,
      text: [
        `${input.signer} ha acceptat la proposta.`,
        "",
        `${c.site}/proposta/${input.token}`,
        "",
        "Toca confirmar dates i enviar la factura del 50%.",
      ].join("\n"),
    },
    c.key,
  );
}
