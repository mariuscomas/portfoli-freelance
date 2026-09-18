import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { LinkUnderline } from "@/components/ui/LinkUnderline";
import { COLLAB_CALENDAR_URL } from "@/lib/pricing";

/**
 * Secció · Col·laboració de la home.
 *
 * Figma: "Section · Col·laboració"
 *   Desktop 1728 → 12115:45503 · Tablet 834 → 12119:45749 · Mobile 402 → 12120:46080
 *
 * La segona porta del doble funnel. Va DESPRÉS de Serveis i no abans: qui
 * arriba a la portada majoritàriament ve a comprar un projecte; les agències
 * ja saben què busquen i baixen.
 *
 * SINGULAR a posta a la descripció («m'integro»): és l'excepció acordada de
 * la veu de marca, perquè aquí ser una sola persona és justament l'argument.
 *
 * SENSE XIFRES. Les modalitats es nomenen, però la tarifa no surt a la
 * portada: la negociació d'hores no es fa en una card, i les xifres de la
 * col·laboració viuen a /colaboracio.
 *
 * La vora superior és `border-strong` (com al Figma): separa un bloc dirigit
 * a un altre públic, no una secció més del mateix recorregut.
 */

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
      <div className="flex flex-1 flex-col justify-center gap-8 px-section-x-xl py-section-y-md">
        <p className="text-eyebrow text-text-secondary">DEDICACIÓ CONTINUADA</p>

        <div className="flex flex-col gap-4">
          <h2 id="collab-titol" className="text-display-h3 text-text-main">
            Col&middot;laboració
          </h2>
          <p className="text-body-sm text-text-secondary">
            Reforç sènior de producte i UI per al teu estudi, quan el necessites.
            M&apos;integro al teu flux de treball (Figma, Slack, sprints) sense
            friccions. Disponibilitat limitada, actualitzada cada mes.
          </p>
        </div>

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

      <ul className="flex flex-1 flex-col justify-center gap-8 divide-y divide-border-subtle px-section-x-xl py-section-y-md">
        {MODALITATS.map((m, i) => (
          <li key={m.title} className={i === 0 ? "flex flex-col gap-1" : "flex flex-col gap-1 pt-8"}>
            <p className="text-body-lg text-text-main">{m.title}</p>
            <p className="text-body-sm text-text-secondary">{m.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
