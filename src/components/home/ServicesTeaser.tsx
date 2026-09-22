import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import TransitionLink from "@/components/common/TransitionLink";
import RevealGroup from "@/components/common/RevealGroup";
import { LinkUnderline } from "@/components/ui/LinkUnderline";
import FrameRuler from "@/components/ui/FrameRuler";
import { SITE_EMAIL } from "@/lib/site";
import { PRODUCT_CALL_URL, type Product, type ProductId } from "@/lib/pricing";

/**
 * Secció · Serveis de la home.
 *
 * Figma: "Section · Serveis"
 *   Desktop 1728 → 12136:13830 · Tablet 834 → 12091:35587 · Mobile 402 → 12094:38320
 *
 * És el bloc que resol el C2 de l'auditoria: fins ara la portada no deia ni
 * què es ven ni què costa. Les dades són les MATEIXES que /serveis — contingut
 * de la taula `services`, preu de `pricing.ts`, unides per `product_id` — així
 * que la home no pot dir un preu diferent del hub.
 *
 * COMPONENT DE SERVIDOR a posta: no hi ha estat ni modals, només enllaços.
 * A la portada això compta, que el Lighthouse mòbil està a 69.
 *
 * Card: mestre Figma "Card · Product" 12293:90215 (Breakpoint × State).
 * Tota la card és clicable i navega a l'spoke; el CTA diu «Mira el detall»
 * a Figma i a codi (22set26).
 */

const SPOKE: Record<ProductId, string> = {
  web: "/serveis/web",
  landing: "/serveis/landing",
  auditoria: "/serveis/auditoria",
};

/** Retard d'entrada per a un fill d'un RevealGroup (guió 21set26). */
const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as React.CSSProperties;

const formatPrice = (n: number) =>
  `${n.toLocaleString("ca-ES", { maximumFractionDigits: 0 })} €`;

function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <TransitionLink href={href} className="group w-fit">
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
        {children}
      </LinkUnderline>
    </TransitionLink>
  );
}

export default function ServicesTeaser({ products }: { products: Product[] }) {
  return (
    <section
      id="serveis"
      aria-labelledby="serveis-titol"
      // La cortina sobre el tall (CollabBreak) és l'embolcall de page.tsx
      // (Serveis, z-10 i fons opac). Mai z negatiu al tall.
      // border-b: la vora inferior és el final visible de la cortina.
      // Sense border-t: la divisió amb el hero ja la fa el filet inferior de
      // la Navbar Bottom (Figma, mestre 12179:11958). Amb tots dos es veia
      // doble (22set26).
      className="w-full border-b border-border-default"
    >
      {/* Figma wireframe «Header» (21set26): etiqueta + títol + descripció.
          Desktop 12211:59362 · Tablet 12211:59610 · Mobile 12211:59844.
          El Split es va treure i aquesta capçalera és el primer que es llegeix
          després del hero: diu el model (preu tancat) i com funciona. */}
      {/* Entrada (guió 21set26): títol G1 i després etiqueta, descripció i
          link G2 en relleu de 80 ms. */}
      <RevealGroup as="header" className="flex flex-col gap-6 px-page pt-section-s pb-section-xs md:flex-row md:items-baseline md:gap-12 md:pt-section-m lg:items-start lg:gap-8 lg:pb-section-m">
        <div className="flex flex-1 flex-col gap-8">
          <p className="reveal-up text-caption-eyebrow text-text-secondary" style={delay(80)}>PROJECTES AMB PREU TANCAT</p>
          <div className="flex flex-col gap-4">
            <h2 id="serveis-titol" className="text-display-m md:text-display-xl lg:text-display-2xl text-text-main">
              <span className="reveal-line"><span className="reveal-line-inner">Serveis</span></span>
            </h2>
            <p style={delay(160)} className="reveal-up max-w-[580px] text-body-xs-light md:text-body-s-light text-text-secondary">
              M’encarrego del teu projecte de principi a fi. Tria un punt de
              partida i et torno una proposta amb abast i preu.
            </p>
          </div>
        </div>
        <div className="reveal-up" style={delay(240)}>
          <CardLink href="/serveis">Explora</CardLink>
        </div>
      </RevealGroup>

      {/* Tríada (guió 21set26): primer els filets verticals es dibuixen de
          dalt a baix (G3, només xl) i després les cards entren d'esquerra a
          dreta cada 100 ms (G2). */}
      <RevealGroup className="flex flex-col border-t dash-h-border-default divide-y dash-divide-h-border-default xl:flex-row xl:divide-x xl:divide-y-0 xl:dash-divide-v-border-default">
        {products.map((product, i) => (
          // Card sencera clicable (22set26): el ::after del link cobreix
          // l'article (relative). Hover = surface-card; focus = anell a la
          // card, no al link. Figma: Card · Product 12293:90215 (State).
          // Tres columnes només des de xl: a 1024 no hi cabien nom, preu i
          // link (22set26); lg fa servir la fila de Tablet (variant Laptop = xl).
          <article
            key={product.id}
            style={delay(250 + i * 100)}
            className="reveal-up reveal-rule-v group/card relative flex flex-1 flex-col gap-6 px-page py-section-xs transition-colors duration-300 hover:bg-surface-card has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-inset has-[a:focus-visible]:ring-focus-ring md:flex-row md:items-center xl:flex-col xl:items-stretch xl:gap-8 xl:px-12 xl:py-section-m xl:first:pl-page xl:last:pr-page"
          >
            <div className="flex flex-col gap-3 md:flex-1">
              {/* El nom mana a la home (22set26): aquí fa de menú; comparar
                  preus és feina del hub, on mana el preu (15set26). */}
              <h3 className="text-display-s-medium 2xl:text-display-m-medium text-text-main">{product.name}</h3>
              <p className="text-body-xs-light xl:text-body-s-light text-text-secondary">{product.description}</p>
            </div>

            <div className="flex items-center justify-between gap-6 md:flex-1 md:flex-col md:items-end xl:flex-none xl:flex-row xl:items-center">
              <p className="flex flex-col gap-1 md:items-end xl:items-start">
                <span className="text-caption text-text-secondary">{product.priceLabel}</span>
                <span className="whitespace-nowrap text-display-2xs xl:text-display-xs text-text-main">{formatPrice(product.price)}</span>
              </p>
              <TransitionLink
                href={SPOKE[product.id]}
                className="whitespace-nowrap after:absolute after:inset-0 focus-visible:outline-none"
              >
                {/* md+: Link MD del DS. Mòbil: només la fletxa (Ghost Square
                    del Figma) i el text queda per al lector de pantalla. */}
                <span className="max-md:sr-only">
                  <LinkUnderline
                    as="span"
                    size="md"
                    icon={<ArrowRight size={20} className="shrink-0 motion-safe:transition-transform motion-safe:group-hover/card:translate-x-1" aria-hidden />}
                  >
                    Mira el detall<span className="sr-only"> de {product.name}</span>
                  </LinkUnderline>
                </span>
                <span aria-hidden className="flex size-12 items-center justify-center md:hidden">
                  <ArrowRight size={32} className="motion-safe:transition-transform motion-safe:group-hover/card:translate-x-1" />
                </span>
              </TransitionLink>
            </div>
          </article>
        ))}
      </RevealGroup>

      {/* Fila «a mida»: porta de sortida per al que no encaixa a la tríada.
          Figma: mestre "Card · Una altra cosa al cap" 12304:91680
          (Desktop 12304:91677 · Tablet 12304:91678 · Mobile 12304:91679).
          - Vora superior SÒLIDA border-default: excepció a la regla de filets
            (dashed dins de secció), decidida el 22set26 per marcar-la com un
            bloc a part de la tríada.
          - Marc de regla (FrameRuler, mestre Frame / Ruler 12305:14461): diu
            «a mida» sense color. Substitueix la prova amb superfície Pistatxo,
            que feia pesar la sortida secundària més que els productes.
          - Titular un graó per sota del nom de producte a cada breakpoint.
          - Enllaços en columna; el primari un graó per sobre del secundari. */}
      <RevealGroup className="relative flex flex-col gap-12 border-t border-border-default px-page py-section-xs md:flex-row md:items-start md:py-section-s lg:gap-0 lg:p-0">
        <FrameRuler />
        <div className="reveal-up flex flex-col gap-8 md:flex-1 lg:w-2/3 lg:flex-none lg:p-page">
          <p className="text-caption-eyebrow text-text-secondary">APPS · BRANDING I MOLT MÉS</p>
          <div className="flex flex-col gap-4">
            <h3 className="text-display-2xs md:text-display-xs lg:text-display-s text-text-main">Una altra cosa al cap?</h3>
            <p className="max-w-[384px] text-body-xs-light md:text-body-s-light text-text-secondary">
              El que no encaixa en aquests punts de partida el pressupostem junts
              després d&apos;una trucada.
            </p>
          </div>
        </div>

        {/* max-md:-mb-2.5: l'àrea tàctil del darrer enllaç (min-h-11) deixa
            ~10 px buits sota el subratllat; sense compensar, l'aire de baix
            era més gran que el de dalt (Figma: mateix aire a dalt i a baix). */}
        <div style={delay(80)} className="reveal-up flex flex-col items-start gap-6 max-md:-mb-2.5 lg:w-1/3 lg:px-page lg:py-page">
          <LinkUnderline
            as="a"
            href={PRODUCT_CALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            size="md"
            className="lg:text-button-link-lg"
            icon={<ArrowRight size={20} className="shrink-0" aria-hidden />}
          >
            Reserva una trucada de 20 minuts
            <span className="sr-only"> (s&apos;obre en una pestanya nova)</span>
          </LinkUnderline>
          {/* Singular a posta: «escriu-me» va amb el correu personal. */}
          <LinkUnderline
            as="a"
            href={`mailto:${SITE_EMAIL}`}
            size="sm"
            className="lg:text-button-link-md"
            icon={<ArrowRight size={20} className="shrink-0" aria-hidden />}
          >
            Escriu-me
          </LinkUnderline>
        </div>
      </RevealGroup>
    </section>
  );
}
