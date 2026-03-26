import type { Metadata } from "next";
import SharedPageHero from "@/components/common/SharedPageHero";

export const metadata: Metadata = {
  title: "Serveis | Màrius - Portfoli Freelance",
  description: "Descobreix els serveis de disseny que ofereixo.",
};

export default function ServeisPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col w-full overflow-x-hidden bg-surface-base">
      <SharedPageHero 
        title="Serveis"
        description="Ajudo a equips a llançar productes definint el seu ecosistema complet: experiència d'usuari (UX), interfície visual (UI) i arquitectures de disseny completament documentades per a un cicle de desenvolupament ràpid."
        bottomContent={
          <>
            <div className="flex items-center gap-3 opacity-60">
              <span className="text-[14px] font-medium tracking-wider uppercase">(Scroll)</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-6 py-2.5 rounded-full border border-text-main/20 hover:border-text-main hover:bg-text-main hover:text-surface-base transition-colors font-medium">
                Productes
              </button>
              <button className="px-6 py-2.5 rounded-full border border-text-main/20 hover:border-text-main hover:bg-text-main hover:text-surface-base transition-colors font-medium">
                Col·laboració
              </button>
            </div>
          </>
        }
      />
    </main>
  );
}
