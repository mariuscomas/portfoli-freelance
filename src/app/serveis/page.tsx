import SharedPageHero from "@/components/common/SharedPageHero";
import { ServicesHeroBottom, ServicesHeroCta } from "@/components/services/ServicesViews";
import ProductsView from "@/components/services/ProductsView";
import { createClient } from "@/utils/supabase/server";
import { SERVICE_COLUMNS, productsFrom } from "@/lib/services";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Serveis",
  description:
    "Web, landing i auditoria UI/UX amb preus transparents i abast tancat. Explica'm el projecte i et torno una proposta. Un sol interlocutor, de principi a fi.",
  path: "/serveis",
});

/**
 * Serveis — oferta de client final (web · landing · auditoria) amb configurador.
 * La col·laboració amb agències viu a la seva pròpia ruta (/colaboracio); la
 * fila inferior del hero hi fa l'enllaç creuat.
 *
 * Contingut de la tríada: taula `services` de Supabase (editable a
 * /admin/serveis). Preus: src/lib/pricing.ts. Si la taula ve buida o la
 * consulta falla, caiem al catàleg de codi perquè el hub comercial no es
 * quedi mai sense productes.
 */
export default async function ServicesPage() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("services")
    .select(SERVICE_COLUMNS)
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  const products = productsFrom(rows);

  // overflow-x-clip (no hidden) — hidden crearia un scroll container Y niat que atrapa el gest de scroll
  return (
    <main className="flex min-h-[100dvh] flex-col w-full overflow-x-clip bg-surface-base">
      <SharedPageHero
        title="Serveis"
        description="Webs, landings i auditories amb abast i preu tancats. Explica'm el projecte i et torno una proposta. Un sol interlocutor, de principi a fi."
        afterDescription={
          <ServicesHeroCta
            href="#productes"
            label="Descobreix el que podem fer"
            shortLabel="Descobreix-ho"
          />
        }
        showControls
        bottomContent={
          <ServicesHeroBottom crossHref="/colaboracio" crossLabel="Dedicació continuada" />
        }
      />

      <ProductsView products={products} />
    </main>
  );
}
