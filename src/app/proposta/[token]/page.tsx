import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ProposalView from "@/components/proposal/ProposalView";
import type { ProposalPayload } from "@/types/proposal";

/**
 * /proposta/[token]
 *
 * Pàgina privada per enllaç: no hi ha índex ni cerca, només el token. La
 * lectura passa per `get_proposal` (SECURITY DEFINER) perquè la taula `quotes`
 * segueix tancada a anon; la funció només serveix propostes ja enviades i marca
 * la primera obertura.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Proposta",
  robots: { index: false, follow: false },
};

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_proposal", { p_token: token });
  if (error || !data) notFound();

  return <ProposalView proposal={data as unknown as ProposalPayload} token={token} />;
}
