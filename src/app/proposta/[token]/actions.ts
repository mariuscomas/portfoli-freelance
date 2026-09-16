"use server";

import { createClient } from "@/utils/supabase/server";
import { notifyProposalAccepted } from "@/lib/notifyProposal";

export type AcceptResult =
  | { status: "ok" }
  | { status: "already" }
  | { status: "error"; message: string };

/**
 * Acceptació d'una proposta des de la pàgina pública.
 *
 * Tota la validació (existeix, s'ha enviat, no està tancada, no ha caducat)
 * viu a `accept_proposal` a la base de dades: el client no pot saltar-se-la
 * encara que es guardi l'enllaç o manipuli la pàgina.
 */
export async function acceptProposal(token: string, signer: string): Promise<AcceptResult> {
  const clean = (signer || "").trim().slice(0, 200);
  if (clean.length < 2) {
    return { status: "error", message: "Escriu el teu nom per deixar-ne constància." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_proposal", {
    p_token: token,
    p_signer: clean,
  });

  if (error) {
    return { status: "error", message: "No s'ha pogut registrar. Torna-ho a provar." };
  }

  const res = data as { ok: boolean; reason: string } | null;
  if (!res?.ok) {
    if (res?.reason === "expired") {
      return {
        status: "error",
        message: "Aquesta proposta ha caducat. Demana'n una d'actualitzada i te la torno a fer.",
      };
    }
    if (res?.reason === "closed") {
      return { status: "error", message: "Aquesta proposta ja està tancada." };
    }
    return { status: "error", message: "No hem trobat aquesta proposta." };
  }
  if (res.reason === "already_accepted") return { status: "already" };

  // L'avís no ha de poder tombar una acceptació ja registrada.
  await notifyProposalAccepted({ token, signer: clean });

  return { status: "ok" };
}
