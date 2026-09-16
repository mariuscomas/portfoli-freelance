import SharedPageHero from "@/components/common/SharedPageHero";
import { ServicesHeroBottom, ServicesHeroCta } from "@/components/services/ServicesViews";
import CollabView from "@/components/services/CollabView";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Col·laboració",
  description:
    "Disseny UX/UI de producte per a agències i estudis. Un perfil sènior que entén el codi, integrat al teu equip en 48 hores, amb tarifes clares per durada.",
  path: "/colaboracio",
});

/**
 * Col·laboració — Línia A (agències i estudis). Ruta pròpia, separada de
 * /serveis (client final), perquè cada audiència es triï a si mateixa des del
 * navbar (doble funnel). Font de tarifes: src/lib/pricing.ts (calcCollab).
 */
export default function CollaboracioPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col w-full overflow-x-clip bg-surface-base">
      <SharedPageHero
        title="Col·laboració"
        description="Disseny UX/UI de producte per a agències i estudis. Un perfil sènior que entén el codi, s'integra al teu equip en 48 hores i treballa amb les teves eines — sense passar per una contractació."
        afterDescription={
          <ServicesHeroCta
            href="#colaboracio"
            label="Consulta tarifes i disponibilitat"
            shortLabel="Consulta tarifes"
          />
        }
        showControls
        bottomContent={
          <ServicesHeroBottom crossHref="/serveis" crossLabel="Projectes amb preu tancat" />
        }
      />

      <CollabView />
    </main>
  );
}
