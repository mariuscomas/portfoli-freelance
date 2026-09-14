import LandingSpokeView from "@/components/services/LandingSpokeView";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Landing",
  description:
    "Una landing que converteix, dissenyada i desenvolupada de principi a fi. Una sola pàgina pensada per convertir, amb preu tancat i sense sorpreses.",
  path: "/serveis/landing",
});

/**
 * /serveis/landing — pàgina de detall (spoke) del producte Landing. El hub
 * /serveis enllaça aquí; el configurador i les xifres surten de src/lib/pricing.ts.
 */
export default function LandingSpokePage() {
  // overflow-x-clip (no hidden) — hidden crearia un scroll container Y niat que atrapa el gest de scroll
  return (
    <main className="flex min-h-[100dvh] flex-col w-full overflow-x-clip bg-surface-base">
      <LandingSpokeView />
    </main>
  );
}
