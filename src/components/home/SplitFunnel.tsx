import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import TransitionLink from "@/components/common/TransitionLink";
import { LinkUnderline } from "@/components/ui/LinkUnderline";

/**
 * Secció Split — Doble funnel.
 *
 * Figma: "Section Split — Doble funnel"
 *   Desktop 1728 → 12108:42044 · Tablet 834 → 12092:37073 · Mobile 402 → 12094:38321
 *
 * Va just sota el hero i parteix el públic en dos abans que ningú baixi més:
 * qui ve a comprar un projecte i qui ve a contractar hores. És el bloc que
 * resol el C2 de l'auditoria (la home no mencionava serveis) sense convertir
 * la portada en una pàgina de venda.
 *
 * VEU DE MARCA: la card d'empreses va en PLURAL («dissenyem i construïm»),
 * que és la veu de marca; la d'agències va en SINGULAR a posta, perquè allà
 * ser una sola persona és l'argument. És l'excepció ja acordada.
 *
 * A mòbil les dues cards s'apilen i la separació passa de vertical a
 * horitzontal: `divide-*` ho resol sense duplicar marcatge.
 */

interface FunnelCard {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}

const CARDS: FunnelCard[] = [
  {
    eyebrow: "PER A EMPRESES I MARQUES",
    title: "Tens un projecte?",
    body: "De l'estratègia al llançament: dissenyo i construeixo la teva web de principi a fi, amb preus tancats i sense sorpreses.",
    href: "/serveis",
    cta: "Explora els serveis",
  },
  {
    eyebrow: "PER A AGÈNCIES I ESTUDIS",
    title: "Ets una agència?",
    body: "M'integro al teu equip com a reforç sènior de producte i UI, per dies, sprints o mesos, amb disponibilitat clara.",
    href: "/colaboracio",
    cta: "Descobreix la col·laboració",
  },
];

export default function SplitFunnel() {
  return (
    <section
      aria-label="Per on vols començar"
      className="w-full border-t border-border-default"
    >
      <div className="flex flex-col divide-y divide-border-default lg:flex-row lg:divide-x lg:divide-y-0">
        {CARDS.map((card) => (
          <div
            key={card.href}
            className="flex flex-1 flex-col gap-8 px-page py-section-s lg:py-section-m lg:gap-12"
          >
            <div className="flex flex-col gap-8">
              <p className="text-caption-eyebrow text-text-secondary">{card.eyebrow}</p>
              <div className="flex flex-col gap-4">
                <h2 className="text-body-l-semibold md:text-display-2xs lg:text-display-m text-text-main">{card.title}</h2>
                <p className="text-body-s md:text-body-m lg:text-body-l max-w-[580px] text-text-secondary">
                  {card.body}
                </p>
              </div>
            </div>

            {/* Navega a una altra ruta, així que ArrowRight (no ArrowDown).
                L'element navegable és el TransitionLink (si no, es perd la
                transició de pàgina); el LinkUnderline hi va de presentacional,
                perquè un <a> dins d'un <a> no seria HTML vàlid. */}
            <TransitionLink href={card.href} className="group w-fit">
              <LinkUnderline
                as="span"
                icon={
                  <ArrowRight
                    size={20}
                    className="shrink-0 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                }
              >
                {card.cta}
              </LinkUnderline>
            </TransitionLink>
          </div>
        ))}
      </div>
    </section>
  );
}
