import type { CSSProperties } from "react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import TransitionLink from "@/components/common/TransitionLink";
import RevealGroup from "@/components/common/RevealGroup";
import { LinkUnderline } from "@/components/ui/LinkUnderline";

/**
 * Card de la tríada Web · Landing · Auditoria.
 *
 * Figma: mestre "Card · Product" 12293:90215 (Breakpoint × State). Un sol
 * component per a la home (ServicesTeaser) i el hub (ProductsView) des del
 * 24set26: abans eren dues còpies i la del hub s'havia quedat enrere.
 *
 * Ordre: nom → descripció → DES DE + preu → CTA.
 *   mòbil  → apilat; el CTA és només la fletxa (Ghost Square del Figma) i el
 *            text queda per al lector de pantalla
 *   md     → fila: nom i descripció a l'esquerra, preu i link a la dreta
 *   xl     → tres columnes, preu i link a la mateixa línia. Tres columnes
 *            només des de xl: a 1024 no hi cabien nom, preu i link (22set26)
 * Tota la card és clicable: el ::after del link cobreix l'article (relative).
 * Hover = surface-card; focus = anell a la card, no al link.
 *
 * Els filets no són de la card: els posa el contenidor amb divide-*.
 *
 * `reveal` activa el guió d'entrada de la home (21-22set26): l'article és un
 * RevealGroup i el contingut entra en tres passos (nom G1 amb màscara de
 * línia, descripció +80 ms, preu+link +160 ms) damunt de `--card-delay`. La
 * caixa i els filets queden quiets. Sense `reveal`, la card és estàtica i
 * l'entrada la posa la pàgina.
 */

/** Retard d'un element dins de la card, damunt del retard de fila. */
const cardDelay = (ms: number) =>
  ({ "--reveal-delay": `calc(var(--card-delay, 0ms) + ${ms}ms)` }) as CSSProperties;

const formatPrice = (n: number) =>
  `${n.toLocaleString("ca-ES", { maximumFractionDigits: 0 })} €`;

type Props = {
  name: string;
  description: string;
  priceLabel: string;
  price: number;
  href: string;
  cta: string;
  /** Guió d'entrada de la home. */
  reveal?: boolean;
  /** El preu canvia en viu (chips d'abast del hub): l'anuncia aria-live. */
  livePrice?: boolean;
  /** Classes extra de l'article (retards de fila, tapes de filet). */
  className?: string;
};

export default function ProductCard({
  name,
  description,
  priceLabel,
  price,
  href,
  cta,
  reveal = false,
  livePrice = false,
  className = "",
}: Props) {
  const classes = `group/card relative flex flex-1 px-page py-section-xs transition-colors duration-300 hover:bg-surface-card has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-inset has-[a:focus-visible]:ring-focus-ring xl:px-12 xl:py-section-m xl:first:pl-page xl:last:pr-page ${className}`;
  const up = reveal ? "reveal-up " : "";

  const body = (
    <div className="flex flex-1 flex-col gap-6 md:flex-row md:items-center xl:flex-col xl:items-stretch xl:gap-8">
      <div className="flex flex-col gap-3 md:flex-1">
        <h3 className="text-display-s-medium 2xl:text-display-m-medium text-text-main">
          {reveal ? (
            <span className="reveal-line" style={cardDelay(0)}>
              <span className="reveal-line-inner">{name}</span>
            </span>
          ) : (
            name
          )}
        </h3>
        <p
          style={reveal ? cardDelay(80) : undefined}
          className={`${up}text-body-xs-light xl:text-body-s-light text-text-secondary`}
        >
          {description}
        </p>
      </div>

      <div
        style={reveal ? cardDelay(160) : undefined}
        className={`${up}flex items-center justify-between gap-6 md:flex-1 md:flex-col md:items-end xl:mt-auto xl:flex-none xl:flex-row xl:items-center`}
      >
        <p className="flex flex-col gap-1 md:items-end xl:items-start">
          <span className="text-caption text-text-secondary">{priceLabel}</span>
          <span
            className="whitespace-nowrap text-display-2xs xl:text-display-xs text-text-main"
            aria-live={livePrice ? "polite" : undefined}
          >
            {formatPrice(price)}
          </span>
        </p>
        <TransitionLink
          href={href}
          className="whitespace-nowrap after:absolute after:inset-0 focus-visible:outline-none"
        >
          <span className="max-md:sr-only">
            <LinkUnderline
              as="span"
              size="md"
              icon={<ArrowRight size={20} className="shrink-0 motion-safe:transition-transform motion-safe:group-hover/card:translate-x-1" aria-hidden />}
            >
              {cta}<span className="sr-only"> de {name}</span>
            </LinkUnderline>
          </span>
          <span aria-hidden className="flex size-12 items-center justify-center md:hidden">
            <ArrowRight size={32} className="motion-safe:transition-transform motion-safe:group-hover/card:translate-x-1" />
          </span>
        </TransitionLink>
      </div>
    </div>
  );

  return reveal ? (
    <RevealGroup as="article" className={classes}>
      {body}
    </RevealGroup>
  ) : (
    <article className={classes}>{body}</article>
  );
}
