import WebSpokeView from "@/components/services/WebSpokeView";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Web",
  description:
    "Una web a mida, dissenyada i desenvolupada de principi a fi. Un sol interlocutor per a tot el procés fins a producció, amb preu tancat i sense sorpreses.",
  path: "/serveis/web",
});

/**
 * /serveis/web — pàgina de detall (spoke) del producte Web. El hub /serveis
 * enllaça aquí; el configurador i les xifres surten de src/lib/pricing.ts.
 */
export default function WebSpokePage() {
  // overflow-x-clip (no hidden) — hidden crearia un scroll container Y niat que atrapa el gest de scroll
  return (
    <main className="flex min-h-[100dvh] flex-col w-full overflow-x-clip bg-surface-base">
      <WebSpokeView />
    </main>
  );
}
