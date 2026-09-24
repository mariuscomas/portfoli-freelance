import { notFound } from "next/navigation";
import AuditoriaSpokeView from "@/components/services/AuditoriaSpokeView";
import { createClient } from "@/utils/supabase/server";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Auditoria",
  description:
    "Una auditoria que et diu exactament què falla i què arreglar primer. Revisió experta de UI, UX i conversió, amb informe prioritzat i pla d’acció.",
  path: "/serveis/auditoria",
});

/**
 * /serveis/auditoria — pàgina de detall (spoke) del producte Auditoria. A
 * diferència de web/landing, el model és per focus + talla (sense recurrents):
 * totes les xifres surten dels AUDIT_* de src/lib/pricing.ts, i la llista de
 * "què inclou" del spoke és la detallada (AUDIT_BASE_INCLUDES), no la curta de
 * la card. De la taula `services` només llegim si el producte està publicat.
 */
export default async function AuditoriaSpokePage() {
  const supabase = await createClient();

  // Despublicat a l'admin vol dir que la pàgina desapareix. Un error de
  // consulta, en canvi, NO ha de tombar la ruta.
  const { data: rows, error } = await supabase
    .from("services")
    .select("product_id")
    .eq("product_id", "auditoria")
    .eq("is_published", true);

  if (!error && (rows ?? []).length === 0) notFound();

  // overflow-x-clip (no hidden) — hidden crearia un scroll container Y niat que atrapa el gest de scroll
  return (
    <main className="flex min-h-[100dvh] flex-col w-full overflow-x-clip bg-surface-base">
      <AuditoriaSpokeView />
    </main>
  );
}
