import { buildMetadata } from "@/lib/seo";
import { SITE_EMAIL } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Política de privacitat",
  description:
    "Quines dades recull aquest web, per a què es fan servir, qui hi té accés i com exercir els teus drets.",
  path: "/privacitat",
});

/**
 * /privacitat
 *
 * Document estàtic. El copy surt del frame «Consentiment i privacitat» de
 * Figma; si es canvia aquí, s'ha d'actualitzar allà.
 */
const SECTIONS: Array<{ title: string; body: string[] }> = [
  {
    title: "01 · Qui tracta les teves dades",
    body: [
      `Màrius Comas Rosa, dissenyador de producte digital, treballant com a autònom des de l'Empordà. Per a qualsevol cosa relacionada amb aquesta política: ${SITE_EMAIL}`,
    ],
  },
  {
    title: "02 · Què es recull i per a què",
    body: [
      "Formulari de contacte: nom, correu i el missatge que escrius, per poder respondre.",
      "Configurador: la configuració triada, el brief i les dades de contacte, per preparar una proposta.",
      "Newsletter: el correu, per enviar avisos puntuals. Pots donar-te de baixa quan vulguis.",
      "Analítica: pàgines visitades i accions dins del configurador, només si acceptes les cookies.",
    ],
  },
  {
    title: "03 · Per què es pot fer",
    body: [
      "Quan escrius o demanes un pressupost, el tractament es basa en la relació precontractual que s'inicia. La newsletter i l'analítica es basen en el teu consentiment, que pots retirar quan vulguis.",
    ],
  },
  {
    title: "04 · Qui hi té accés",
    body: [
      "Supabase, per a la base de dades.",
      "Vercel, per a l'allotjament del web.",
      "Resend, per a l'enviament dels correus.",
      "Google Analytics, per a l'analítica, i només si l'has acceptada.",
      "Cap d'aquests proveïdors fa servir les teves dades pel seu compte.",
    ],
  },
  {
    title: "05 · Quant de temps es guarden",
    body: [
      "Els missatges i els pressupostos, mentre la conversa tingui sentit comercial o hi hagi una obligació legal de conservar-los. La subscripció a la newsletter, fins que et donis de baixa.",
    ],
  },
  {
    title: "06 · Els teus drets",
    body: [
      `Pots demanar accés a les teves dades, rectificar-les, suprimir-les, oposar-te al tractament, limitar-lo o emportar-te-les. N'hi ha prou amb un correu a ${SITE_EMAIL}. Si creus que alguna cosa no s'ha fet bé, pots reclamar a l'Agència Espanyola de Protecció de Dades.`,
    ],
  },
  {
    title: "07 · Cookies",
    body: [
      "Només hi ha les cookies tècniques que fan funcionar el web i, si les acceptes, les de Google Analytics. Mentre no les acceptis, Google no rep res. Pots canviar la decisió des del peu del web.",
    ],
  },
];

export default function PrivacitatPage() {
  return (
    <main className="w-full px-6 md:px-12 lg:px-24 py-24 md:py-32">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-14">
        <header className="flex flex-col gap-4">
          <span className="text-label text-text-secondary">Legal · Privacitat</span>
          <h1 className="text-body-l-semibold md:text-display-2xs lg:text-display-m text-text-main">Política de privacitat</h1>
          <p className="text-body-xs-light md:text-body-s-light text-text-secondary">
            Actualitzada el 16 de setembre de 2026
          </p>
        </header>

        {SECTIONS.map((section) => (
          <section key={section.title} className="flex flex-col gap-3">
            <h2 className="text-body-l lg:text-body-xl font-medium text-text-main">{section.title}</h2>
            {section.body.map((line) => (
              <p key={line} className="text-body-s md:text-body-m lg:text-body-l text-text-secondary leading-relaxed">
                {line}
              </p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
