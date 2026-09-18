/**
 * Avisos per email del cicle de la proposta (Resend, via fetch).
 *
 * OPT-IN: sense RESEND_API_KEY no fa res i no peta. Cap d'aquestes funcions pot
 * tombar l'operació que les crida — un email que falla no ha de desfer una
 * acceptació ja registrada a la base de dades. Ara bé, totes retornen un
 * MailResult: qui les crida ha de poder dir si el correu ha sortit o no.
 *
 * Env: RESEND_API_KEY · NOTIFY_EMAIL (per defecte mariuscr23@gmail.com) ·
 *      RESEND_FROM (remitent verificat) · NEXT_PUBLIC_SITE_URL
 */

import { sendMail, type MailResult } from "./mail";
import { RESPONSE_SLA } from "@/lib/pricing";
import { SITE_EMAIL } from "@/lib/site";

function config() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return {
    key,
    // Destinatari INTERN dels avisos. No és cara pública: per això el
    // `reply_to` de les cartes que rep el client és `SITE_EMAIL` i no aquest.
    to: process.env.NOTIFY_EMAIL || "mariuscr23@gmail.com",
    from: process.env.RESEND_FROM || "Màrius Freelance <onboarding@resend.dev>",
    site: process.env.NEXT_PUBLIC_SITE_URL || "https://mariusfreelance.com",
  };
}

/** Acusament de rebuda al client, en enviar una configuració. */
export async function notifyQuoteReceived(input: {
  to: string;
  name: string | null;
  product: string;
  /** Desglossament del Resum. La pantalla de confirmació promet una còpia: és aquesta. */
  breakdown?: string | null;
  /** Referència curta (la mateixa que es mostra a la confirmació). */
  ref?: string | null;
}): Promise<MailResult> {
  const c = config();
  if (!c) return { ok: false, skipped: true };
  const hi = input.name ? `Hola, ${input.name}` : "Hola";
  const subject = input.ref
    ? `Hem rebut la teva configuració (ref. ${input.ref})`
    : "Hem rebut la teva configuració";
  return sendMail(
    {
      from: c.from,
      to: input.to,
      reply_to: SITE_EMAIL,
      subject,
      text: [
        `${hi},`,
        "",
        "Hem rebut el que has configurat i ja hi estem mirant.",
        ...(input.breakdown
          ? ["", "Aquesta és la teva configuració:", "", input.breakdown, "", "El total és orientatiu: el tanquem junts a la proposta."]
          : []),
        "",
        `Et responem en un màxim de ${RESPONSE_SLA} amb una proposta tancada o, si veig que hi ha una manera millor d'encarar-ho, amb una alternativa.`,
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
}): Promise<MailResult> {
  const c = config();
  if (!c) return { ok: false, skipped: true };
  const hi = input.name ? `Hola, ${input.name}` : "Hola";
  const url = `${c.site}/proposta/${input.token}`;
  return sendMail(
    {
      from: c.from,
      to: input.to,
      reply_to: SITE_EMAIL,
      subject: `La teva proposta · ${input.totalLabel}`,
      text: [
        `${hi},`,
        "",
        `Aquí tens la proposta, amb el desglòs complet: ${url}`,
        "",
        `El preu està tancat i és vàlid fins al ${input.expiresLabel}.`,
        "",
        "Pots acceptar-la des de la mateixa pàgina. Si hi ha res que no et quadra, ens ho dius i en parlem.",
        "",
        "Màrius",
      ].join("\n"),
    },
    c.key,
  );
}

/** Avís a Màrius quan un client accepta. */
export async function notifyProposalAccepted(input: { token: string; signer: string }): Promise<MailResult> {
  const c = config();
  if (!c) return { ok: false, skipped: true };
  return sendMail(
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
