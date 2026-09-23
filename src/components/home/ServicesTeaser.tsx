import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import TransitionLink from "@/components/common/TransitionLink";
import RevealGroup from "@/components/common/RevealGroup";
import { LinkUnderline } from "@/components/ui/LinkUnderline";
import CustomWorkRow from "@/components/services/CustomWorkRow";
import { type Product, type ProductId } from "@/lib/pricing";

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

/**
 * Relleu de la tríada (guió 21set26, revisat 22set26).
 *
 * Dos eixos. Dins de la card, els seus elements entren en tres passos (nom G1,
 * descripció +80 ms, preu+link +160 ms): és aquí on compta la regla dels
 * 400 ms del guió, perquè cada card és un grup. Entre cards, a xl, hi ha el
 * relleu d'esquerra a dreta: tapes dels filets a 0 i 80 ms i cards a
 * 160/220/280 ms (60 ms i no 100, per no allargar la fila ara que cada card
 * té recorregut propi).
 *
 * Per sota de xl la tríada és una columna de ~800 px: amb un sol disparador,
 * les cards 2 i 3 s'animaven fora de pantalla. Cada card és el seu grup i
 * entra sense retard de fila quan li toca.
 */
const CARD_REVEAL = [
  "xl:[--reveal-delay-rule:0ms] xl:[--card-delay:160ms]",
  "xl:[--reveal-delay-rule:80ms] xl:[--card-delay:220ms]",
  "xl:[--card-delay:280ms]",
];

/**
 * Retard d'un element DINS d'una card: el seu pas intern damunt del retard de
 * fila de la card (`--card-delay`, només a xl). Var diferent de
 * `--reveal-delay` a posta: si la card escrivís la mateixa, el calc del fill
 * es referenciaria a si mateix.
 */
const cardDelay = (ms: number) =>
  ({ "--reveal-delay": `calc(var(--card-delay, 0ms) + ${ms}ms)` }) as React.CSSProperties;

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

      {/* Tríada (guió 21set26, entrada revisada 22set26): a xl primer es
          dibuixen els filets verticals de dalt a baix (G3) i després les cards
          entren d'esquerra a dreta cada 60 ms (G2), cadascuna amb els seus
          tres passos interns.
          Cada card és el seu propi RevealGroup: per sota de xl la columna fa
          ~800 px i amb un sol disparador les cards 2 i 3 s'animaven fora de
          pantalla. El contenidor no anima res, només reparteix i porta els
          filets. */}
      <div className="flex flex-col border-t dash-h-border-default divide-y dash-divide-h-border-default xl:flex-row xl:divide-x xl:divide-y-0 xl:dash-divide-v-border-default">
        {products.map((product, i) => (
          // Card sencera clicable (22set26): el ::after del link cobreix
          // l'article (relative). Hover = surface-card; focus = anell a la
          // card, no al link. Figma: Card · Product 12293:90215 (State).
          // Tres columnes només des de xl: a 1024 no hi cabien nom, preu i
          // link (22set26); lg fa servir la fila de Tablet (variant Laptop = xl).
          //
          // L'article NO porta `reveal-up`: si es movia i s'esvaïa ell, hi
          // anaven també les seves vores (divide-y a mòbil, divide-x a xl) i
          // la tapa del filet, que a més quedava invisible per l'opacitat 0.
          // El que entra és el contingut; la caixa i els filets queden quiets.
          // `reveal-rule-v` només a les cards que tapen un filet: el de la
          // dreta de l'última no existeix.
          <RevealGroup
            as="article"
            key={product.id}
            className={`${CARD_REVEAL[i] ?? ""} ${i < products.length - 1 ? "reveal-rule-v" : ""} group/card relative flex flex-1 px-page py-section-xs transition-colors duration-300 hover:bg-surface-card has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-inset has-[a:focus-visible]:ring-focus-ring xl:px-12 xl:py-section-m xl:first:pl-page xl:last:pr-page`}
          >
            {/* Tres passos dins de la card (22set26): el nom amb màscara de
                línia (G1, és un Display) i després descripció i preu+link amb
                fade-up cada 80 ms. Abans entrava tot el bloc de cop i la card
                arribava plana. */}
            <div className="flex flex-1 flex-col gap-6 md:flex-row md:items-center xl:flex-col xl:items-stretch xl:gap-8">
              <div className="flex flex-col gap-3 md:flex-1">
                {/* El nom mana a la home (22set26): aquí fa de menú; comparar
                    preus és feina del hub, on mana el preu (15set26). */}
                <h3 className="text-display-s-medium 2xl:text-display-m-medium text-text-main">
                  <span className="reveal-line" style={cardDelay(0)}>
                    <span className="reveal-line-inner">{product.name}</span>
                  </span>
                </h3>
                <p style={cardDelay(80)} className="reveal-up text-body-xs-light xl:text-body-s-light text-text-secondary">{product.description}</p>
              </div>

              <div style={cardDelay(160)} className="reveal-up flex items-center justify-between gap-6 md:flex-1 md:flex-col md:items-end xl:flex-none xl:flex-row xl:items-center">
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
            </div>
          </RevealGroup>
        ))}
      </div>

      {/* Fila «a mida»: el component la documenta (mestre 12304:91680).
          La home passa el marge de la rampa (px-page / p-page) i les classes
          d'entrada del guió d'scroll; el retard de 80 ms encadena els
          enllaços darrere del text. */}
      <CustomWorkRow
        as={RevealGroup}
        padX="px-page"
        padInner="lg:p-page"
        textClassName="reveal-up"
        linksClassName="reveal-up"
        linksStyle={delay(80)}
      />
    </section>
  );
}
