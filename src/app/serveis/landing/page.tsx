import LandingSpokeView from "@/components/services/LandingSpokeView";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SERVICE_COLUMNS, productFrom } from "@/lib/services";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Landing",
  description:
    "Una landing que converteix, dissenyada i desenvolupada de principi a fi. Una sola pàgina pensada per convertir, amb preu tancat i sense sorpreses.",
  path: "/serveis/landing",
});

/**
 * /serveis/landing — pàgina de detall (spoke) del producte Landing. El hub
 * /serveis enllaça aquí. El copy (nom, descripció i "què inclou") surt de la taula
 * `services`; les xifres i el configurador, de src/lib/pricing.ts.
 */
export default async function LandingSpokePage() {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("services")
    .select(SERVICE_COLUMNS)
    .eq("product_id", "landing")
    .eq("is_published", true);

  // Despublicat a l'admin vol dir que la pàgina desapareix. Un error de
  // consulta, en canvi, NO ha de tombar la ruta: allà caiem al catàleg de codi.
  if (!error && (rows ?? []).length === 0) notFound();

  const product = productFrom(rows, "landing");

  // overflow-x-clip (no hidden) — hidden crearia un scroll container Y niat que atrapa el gest de scroll
  return (
    <main className="flex min-h-[100dvh] flex-col w-full overflow-x-clip bg-surface-base">
      <LandingSpokeView product={product} />
    </main>
  );
}
