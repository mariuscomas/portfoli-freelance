import type { Metadata } from "next";
import SharedPageHero from "@/components/common/SharedPageHero";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PADLL | Projecte",
};

export default function ProjectDetailsPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col w-full overflow-x-hidden bg-surface-base">
      <SharedPageHero 
        title="PADLL"
        description="Disseny d'un MVP amb perfil dual per connectar surfistes i facilitar reserves online optimitzant la interacció amb escoles."
        containerClassName="bg-[#5C7894]" // Exemple de fons corporatiu blau passat pel disseny
        textClassName="text-white"
        bottomContent={
          <>
            <div className="flex items-center gap-3 opacity-60">
              <span className="text-[14px] font-medium tracking-wider uppercase">(Scroll)</span>
            </div>
            <div className="flex items-center gap-6">
              <Link 
                href="/works"
                className="font-sans font-medium text-lg hover:opacity-70 transition-opacity flex gap-2 items-center"
              >
                Veure tots els projectes
              </Link>
            </div>
          </>
        }
      />
    </main>
  );
}
