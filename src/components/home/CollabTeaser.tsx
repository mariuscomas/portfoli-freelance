import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { LinkUnderline } from "@/components/ui/LinkUnderline";
import { COLLAB_CALENDAR_URL } from "@/lib/pricing";
import RevealGroup from "@/components/common/RevealGroup";

/**
 * Secció · Col·laboració de la home.
 *
 * Figma: "Section · Col·laboració"
 *   Desktop 1728 → 12115:45503 · Tablet 834 → 12119:45749 · Mobile 402 → 12120:46080
 *
 * La porta per a agències i estudis. Va DESPRÉS de Serveis i del tall
 * (CollabBreak), que és on la home canvia d'interlocutor. La drecera per a
 * qui ho sap des del principi és el Link «Ets una agència?» del hero (21set26,
 * substitueix el Split).
 *
 * Descripció: «Treballo dins del teu flux…» i no «M'integro…», que ja ho diu
 * la frase 2 del tall just abans.
 *
 * Entrada (guió 21set26): com Serveis. Títol G1; etiqueta, descripció i CTA
 * G2 cada 80 ms; modalitats G2 cada 100 ms des de 250 ms. Dos grups perquè a
 * mòbil la llista queda a sota i s'ha de disparar quan hi arriba.
 *
 * SENSE XIFRES. Les modalitats es nomenen, però la tarifa no surt a la
 * portada: la negociació d'hores no es fa en una card, i les xifres de la
 * col·laboració viuen a /colaboracio.
 *
 * La vora superior és `border-strong` (com al Figma): separa un bloc dirigit
 * a un altre públic, no una secció més del mateix recorregut.
 */

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as React.CSSProperties;

const MODALITATS = [
  {
    title: "Dies solts",
    detail: "Per a pics de feina o una revisió concreta. Mínim de mig dia.",
  },
  {
    title: "Setmana completa",
    detail: "Un sprint sencer amb el teu equip i l'agenda reservada.",
  },
  {
    title: "Compromís de 3 mesos o més",
    detail: "Dedicació estable i tarifa reduïda, amb preavís acordat.",
  },
];

export default function CollabTeaser() {
  return (
    <section
      aria-labelledby="collab-titol"
      className="flex w-full flex-col border-t border-border-strong lg:flex-row"
    >
      <RevealGroup className="flex flex-1 flex-col justify-center gap-8 px-page py-section-s lg:py-section-m">
        <p className="reveal-up text-caption-eyebrow text-text-secondary" style={delay(80)}>DEDICACIÓ CONTINUADA</p>

        <div className="flex flex-col gap-4">
          <h2 id="collab-titol" className="text-display-xs md:text-display-s lg:text-display-l text-text-main">
            <span className="reveal-line"><span className="reveal-line-inner">Col&middot;laboració</span></span>
          </h2>
          <p style={delay(160)} className="reveal-up text-body-xs-light md:text-body-s-light text-text-secondary">
            Reforç sènior de producte i UI per al teu estudi, quan el necessites.
            Treballo dins del teu flux (Figma, Slack, sprints) des del primer
            dia.
          </p>
        </div>

        <div className="reveal-up" style={delay(240)}>
        <LinkUnderline
          as="a"
          href={COLLAB_CALENDAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          icon={<ArrowRight size={20} className="shrink-0" aria-hidden />}
        >
          Reserva una trucada
          <span className="sr-only"> (s&apos;obre en una pestanya nova)</span>
        </LinkUnderline>
        </div>
      </RevealGroup>

      <RevealGroup as="ul" className="flex flex-1 flex-col justify-center gap-8 divide-y dash-divide-h-border-default px-page py-section-s lg:py-section-m">
        {MODALITATS.map((m, i) => (
          <li
            key={m.title}
            style={delay(250 + i * 100)}
            className={i === 0 ? "reveal-up flex flex-col gap-1" : "reveal-up flex flex-col gap-1 pt-8"}
          >
            <p className="text-body-l lg:text-body-xl text-text-main">{m.title}</p>
            <p className="text-body-xs-light md:text-body-s-light text-text-secondary">{m.detail}</p>
          </li>
        ))}
      </RevealGroup>
    </section>
  );
}
