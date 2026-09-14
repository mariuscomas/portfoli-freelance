import SharedPageHero from "@/components/common/SharedPageHero";
import { ServicesHeroBottom } from "@/components/services/ServicesViews";
import ProductsView from "@/components/services/ProductsView";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Serveis",
  description:
    "Web, landing i auditoria UI/UX amb preus transparents. Configura el teu projecte en dos minuts i rep el pressupost al moment — un sol interlocutor, de principi a fi.",
  path: "/serveis",
});

/**
 * Serveis — oferta de client final (web · landing · auditoria) amb configurador.
 * La col·laboració amb agències viu a la seva pròpia ruta (/colaboracio); els
 * pills del hero salten entre les dues àrees. Font de preus: src/lib/pricing.ts.
 */
export default function ServicesPage() {
  // overflow-x-clip (no hidden) — hidden crearia un scroll container Y niat que atrapa el gest de scroll
  return (
    <main className="flex min-h-[100dvh] flex-col w-full overflow-x-clip bg-surface-base">
      <SharedPageHero
        title="Serveis"
        description="Webs, landings i auditories amb preu clar i abast tancat. Configura el teu projecte en dos minuts i rep el pressupost al moment — un sol interlocutor, de principi a fi."
        bottomContent={
          <ServicesHeroBottom
            active="serveis"
            scrollHref="#productes"
            scrollLabel="Descobreix el que podem fer"
          />
        }
      />

      <ProductsView />
    </main>
  );
}
