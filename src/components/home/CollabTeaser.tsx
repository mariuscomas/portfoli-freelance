import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import TransitionLink from "@/components/common/TransitionLink";
import { LinkUnderline } from "@/components/ui/LinkUnderline";
import { COLLAB_CALENDAR_URL, COLLAB_INTEGRATION } from "@/lib/pricing";
import RevealGroup from "@/components/common/RevealGroup";

/**
 * Secció · Col·laboració de la home.
 *
 * Figma: "Section · Col·laboració"
 *   Desktop 1728 → 12332:93531 · Laptop 1280 → 12332:93530
 *   Tablet 834 → 12332:93529 · Mobile 402 → 12332:93528
 *
 * La porta per a agències i estudis. Va DESPRÉS de Serveis i del tall
 * (CollabBreak), que és on la home canvia d'interlocutor. La drecera per a
 * qui ho sap des del principi és el Link «Ets una agència?» del hero (21set26,
 * substitueix el Split).
 *
 * Descripció: «Treballo dins del teu flux…» i no «M'integro…», que ja ho diu
 * la frase 2 del tall just abans.
 *
 * Contingut de la columna dreta (22set26): «Com m'integro» (COLLAB_INTEGRATION),
 * no les modalitats de tarifa. Substitueix la llista de modalitats que hi havia
 * aquí: nomenada sense preu, no deia res que el visitant no sabés ja, i el
 * dubte real d'una agència abans de trucar és quant costarà integrar algú de
 * fora. Les modalitats i les xifres viuen a /colaboracio, i s'hi arriba pel
 * link secundari. Mateixa font que la pàgina: si canvia allà, canvia aquí.
 *
 * SENSE XIFRES. La negociació d'hores no es fa en una card.
 *
 * Dos links (22set26): «Reserva una trucada» (calendari, primari) i «Tarifes i
 * modalitats» (a /colaboracio, un graó de mida per sota). Cap dels dos a la
 * fila superior: la secció té les dues columnes centrades verticalment i no hi
 * ha fila on penjar-los.
 *
 * Entrada (guió 21set26): com Serveis. Títol G1; etiqueta, descripció i links
 * G2 cada 80 ms; ítems G2 cada 100 ms des de 250 ms. Dos grups perquè a mòbil
 * la llista queda a sota i s'ha de disparar quan hi arriba.
 *
 * La vora superior és `border-strong` (com al Figma): separa un bloc dirigit
 * a un altre públic, no una secció més del mateix recorregut.
 *
 * Retícula (22set26): `px-page` a la SECCIÓ i gap intern entre columnes
 * (64 a laptop, 96 a desktop). Abans cada columna portava el seu `px-page`,
 * cosa que deixava 192 px de buit central. El Figma de la proposta portava 96
 * de marge a tots els breakpoints menys mòbil; es va corregir a la rampa
 * `page-margin` (24 · 48 · 72 · 96 · 144) perquè aquesta secció respirés com
 * la resta de la home.
 *
 * Filets dels ítems (22set26): el `divide-y` de Tailwind v4 pinta
 * `border-bottom` a `:not(:last-child)`, no `border-top`. El padding de
 * respiració va, doncs, al mateix ítem que porta el filet (`pb-6`), no al
 * següent: amb `pt-6` el filet quedava enganxat al text de dalt i lluny del
 * títol de sota. Figma: 24 · filet · 24.
 */

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as React.CSSProperties;

export default function CollabTeaser() {
  return (
    <section
      aria-labelledby="collab-titol"
      className="border-t border-border-strong px-page py-section-s lg:py-section-m"
    >
      <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-16 2xl:gap-24">
        <RevealGroup className="flex flex-1 flex-col gap-8">
          <p className="reveal-up text-caption-eyebrow text-text-secondary" style={delay(80)}>DEDICACIÓ CONTINUADA</p>

          <div className="flex flex-col gap-4">
            <h2
              id="collab-titol"
              className="text-display-m md:text-display-l xl:text-display-xl 2xl:text-display-2xl text-text-main"
            >
              <span className="reveal-line"><span className="reveal-line-inner">Col&middot;laboració</span></span>
            </h2>
            <p style={delay(160)} className="reveal-up text-body-l text-text-secondary">
              Reforç sènior de producte i UI per al teu estudi, quan el necessites.
              Treballo dins del teu flux (Figma, Slack, sprints) des del primer
              dia.
            </p>
          </div>

          <div className="reveal-up flex flex-col items-start gap-4" style={delay(240)}>
            <LinkUnderline
              as="a"
              href={COLLAB_CALENDAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              size="md"
              className="xl:text-button-link-lg 2xl:text-button-link-xl"
              icon={<ArrowRight size={20} className="shrink-0" aria-hidden />}
            >
              Reserva una trucada
              <span className="sr-only"> (s&apos;obre en una pestanya nova)</span>
            </LinkUnderline>

            <TransitionLink href="/colaboracio" className="group w-fit">
              <LinkUnderline
                as="span"
                size="sm"
                className="xl:text-button-link-md 2xl:text-button-link-lg"
                icon={
                  <ArrowRight
                    size={20}
                    className="shrink-0 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                }
              >
                Tarifes i modalitats
              </LinkUnderline>
            </TransitionLink>
          </div>
        </RevealGroup>

        <RevealGroup as="ul" className="flex flex-1 flex-col gap-6 divide-y dash-divide-h-border-default">
          {COLLAB_INTEGRATION.map((item, i) => (
            <li
              key={item.title}
              style={delay(250 + i * 100)}
              className={
                i === COLLAB_INTEGRATION.length - 1
                  ? "reveal-up flex flex-col gap-1"
                  : "reveal-up flex flex-col gap-1 pb-6"
              }
            >
              <p className="text-display-2xs-medium md:text-display-xs-medium text-text-main">{item.title}</p>
              <p className="text-body-s-light text-text-secondary">{item.text}</p>
            </li>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
