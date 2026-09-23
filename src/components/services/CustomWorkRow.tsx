import type { CSSProperties, ElementType } from "react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { LinkUnderline } from "@/components/ui/LinkUnderline";
import FrameRuler from "@/components/ui/FrameRuler";
import { SITE_EMAIL } from "@/lib/site";
import { PRODUCT_CALL_URL } from "@/lib/pricing";

/**
 * Fila «a mida»: porta de sortida per al que no encaixa a la tríada.
 *
 * Figma: mestre "Section · Una altra cosa al cap" 12304:91680
 * (Desktop 12304:91677 · Tablet 12304:91678 · Mobile 12304:91679).
 *
 * UN sol component per als DOS llocs que el pinten — la secció Serveis de la
 * home i el hub /serveis. Fins al 23set26 n'hi havia dues còpies de markup i
 * la del hub s'havia quedat enrere (eyebrow amb coma, enllaç escurçat, sense
 * marc de regla, titular en Medium). Un mestre a Figma, un component a codi.
 *
 * Del mestre venen:
 *  - Vora superior SÒLIDA border-default: excepció a la regla de filets
 *    (dashed dins de secció), decidida el 22set26 per marcar-la com un bloc
 *    a part de la tríada.
 *  - Marc de regla (FrameRuler, mestre Frame / Ruler 12305:14461): diu «a
 *    mida» sense color. Substitueix la prova amb superfície Pistatxo, que
 *    feia pesar la sortida secundària més que els productes.
 *  - Titular un graó per sota del nom de producte a cada breakpoint, en
 *    SemiBold (Display/Semibold/2XS · XS · S).
 *  - Enllaços en columna; el primari un graó per sobre del secundari.
 *
 * El MARGE LATERAL no el fixa el component: la home llegeix la rampa
 * `--page-margin` (px-page) i el hub encara va amb la seva constant
 * SECTION_PX, que a lg dona 64 on la rampa en diu 72. Mentre les dues no
 * s'unifiquin, cada pàgina passa el seu marge per `padX` i `padInner` i el
 * bloc s'alinea amb la secció on viu, no amb l'altra pàgina.
 */
type Props = {
  /** Marge lateral del contenidor per sota de lg. Ex: "px-page" o SECTION_PX. */
  padX: string;
  /** Padding dels dos fills a partir de lg, quan el contenidor el deixa anar. */
  padInner: string;
  /** Element o component contenidor (el wrapper d'entrada de cada pàgina). */
  as?: ElementType;
  className?: string;
  textClassName?: string;
  linksClassName?: string;
  linksStyle?: CSSProperties;
};

export default function CustomWorkRow({
  padX,
  padInner,
  as: Wrapper = "div",
  className = "",
  textClassName = "",
  linksClassName = "",
  linksStyle,
}: Props) {
  return (
    <Wrapper
      className={`relative flex flex-col gap-12 border-t border-border-default ${padX} py-section-xs md:flex-row md:items-start md:py-section-s lg:gap-0 lg:p-0 ${className}`.trim()}
    >
      <FrameRuler />

      <div className={`flex flex-col gap-8 md:flex-1 lg:w-2/3 lg:flex-none ${padInner} ${textClassName}`.trim()}>
        <p className="text-caption-eyebrow text-text-secondary">APPS · BRANDING I MOLT MÉS</p>
        <div className="flex flex-col gap-4">
          <h3 className="text-display-2xs md:text-display-xs lg:text-display-s text-text-main">
            Una altra cosa al cap?
          </h3>
          <p className="max-w-[384px] text-body-xs-light md:text-body-s-light text-text-secondary">
            El que no encaixa en aquests punts de partida el pressupostem junts
            després d&apos;una trucada.
          </p>
        </div>
      </div>

      {/* max-md:-mb-2.5: l'àrea tàctil del darrer enllaç (min-h-11) deixa
          ~10 px buits sota el subratllat; sense compensar, l'aire de baix
          era més gran que el de dalt (Figma: mateix aire a dalt i a baix). */}
      <div
        style={linksStyle}
        className={`flex flex-col items-start gap-6 max-md:-mb-2.5 lg:w-1/3 ${padInner} ${linksClassName}`.trim()}
      >
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
    </Wrapper>
  );
}
