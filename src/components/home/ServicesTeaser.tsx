import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import TransitionLink from "@/components/common/TransitionLink";
import { LinkUnderline } from "@/components/ui/LinkUnderline";
import { SITE_EMAIL } from "@/lib/site";
import { PRODUCT_CALL_URL, type Product, type ProductId } from "@/lib/pricing";

/**
 * Secció · Serveis de la home.
 *
 * Figma: "Section · Serveis"
 *   Desktop 1728 → 12089:34976 · Tablet 834 → 12091:35587 · Mobile 402 → 12094:38320
 *
 * És el bloc que resol el C2 de l'auditoria: fins ara la portada no deia ni
 * què es ven ni què costa. Les dades són les MATEIXES que /serveis — contingut
 * de la taula `services`, preu de `pricing.ts`, unides per `product_id` — així
 * que la home no pot dir un preu diferent del hub.
 *
 * COMPONENT DE SERVIDOR a posta: no hi ha estat ni modals, només enllaços.
 * A la portada això compta, que el Lighthouse mòbil està a 69.
 *
 * ⚠️ DIVERGÈNCIA AMB EL FIGMA, justificada: la card diu «Configura'l» i aquí
 * el CTA diu «Mira el detall», perquè el que fa és NAVEGAR a l'spoke. No és
 * el flag qui ho decideix: amb `NEXT_PUBLIC_CONFIGURATOR=1` en local, un
 * «Configura'l» que porta a una altra pàgina seria una etiqueta que menteix.
 * El dia que la portada obri el configurador, aquest CTA passa a client i
 * recupera el text del Figma.
 */

const SPOKE: Record<ProductId, string> = {
  web: "/serveis/web",
  landing: "/serveis/landing",
  auditoria: "/serveis/auditoria",
};

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
      className="w-full border-t border-border-default"
    >
      <header className="flex items-baseline gap-12 px-section-x-xl pt-section-y-lg pb-section-y-sm">
        <h2 id="serveis-titol" className="text-display-h3 flex-1 text-text-main">
          Serveis
        </h2>
        <CardLink href="/serveis">Explora els serveis</CardLink>
      </header>

      <div className="flex flex-col border-t border-border-default divide-y divide-border-default lg:flex-row lg:divide-x lg:divide-y-0">
        {products.map((product) => (
          <article
            key={product.id}
            className="flex flex-1 flex-col gap-8 px-section-x-xl py-section-y-md lg:p-section-x-xl"
          >
            <div className="flex flex-1 flex-col gap-3">
              <h3 className="text-heading-h3 text-text-main">{product.name}</h3>
              <p className="text-body-sm text-text-secondary">{product.description}</p>
            </div>

            <div className="flex items-center justify-between gap-6">
              {/* El preu mana sobre el nom: decisió del 15set26, mestre "Card — Web". */}
              <p className="flex flex-col gap-1">
                <span className="text-caption text-text-secondary">{product.priceLabel}</span>
                <span className="text-display-h5 text-text-main">{formatPrice(product.price)}</span>
              </p>
              {/* Sempre "Mira el detall": aquest enllaç NAVEGA a l'spoke en
                  tots dos estats del flag, i una etiqueta ha de dir el que
                  passa. El "Configura'l" del Figma arribarà el dia que la card
                  obri el configurador des de la portada, que demana passar
                  aquest CTA a client. */}
              <CardLink href={SPOKE[product.id]}>Mira el detall</CardLink>
            </div>
          </article>
        ))}
      </div>

      {/* Porta de sortida per al que no encaixa a la tríada. La vora superior
          és `border-strong`: separa un bloc de naturalesa diferent, no una card
          més de la mateixa fila. */}
      <div className="flex flex-col gap-12 border-t border-border-strong px-section-x-xl py-section-y-md lg:flex-row lg:gap-24">
        <div className="flex flex-col gap-8 lg:w-[576px] lg:shrink-0">
          <p className="text-eyebrow text-text-secondary">APPS, BRANDING I MÉS</p>
          <div className="flex flex-col gap-4">
            <h3 className="text-heading-h3 text-text-main">Una altra cosa al cap?</h3>
            <p className="text-body-sm max-w-[384px] text-text-secondary">
              El que no encaixa en aquests punts de partida el pressupostem junts
              després d&apos;una trucada.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:justify-end lg:pb-12">
          <LinkUnderline
            as="a"
            href={PRODUCT_CALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            icon={<ArrowRight size={20} className="shrink-0" aria-hidden />}
          >
            Reserva una trucada de 20 minuts
            <span className="sr-only"> (s&apos;obre en una pestanya nova)</span>
          </LinkUnderline>
          {/* Singular a posta: «escriu-me» va amb el correu personal. */}
          <LinkUnderline
            as="a"
            href={`mailto:${SITE_EMAIL}`}
            icon={<ArrowRight size={20} className="shrink-0" aria-hidden />}
          >
            Escriu-me
          </LinkUnderline>
        </div>
      </div>
    </section>
  );
}
