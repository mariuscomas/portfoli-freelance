import { WorkMedia, WorkMediaLayout } from "@/types/works";
import Image from "next/image";

interface Props {
  media: WorkMedia[];
  viewMode: "visual" | "lectura";
  /**
   * Disposició triada al bloc (editor). 'auto' manté la graella deduïda del
   * recompte; 'row' la força; 'column' apila a amplada completa. Vegeu
   * `WorkMediaLayout` a types/works.ts.
   */
  layout?: WorkMediaLayout;
  /**
   * Treu el coixí inferior. S'activa al darrer bloc de media quan la secció
   * següent ja aporta el seu propi coixí superior (la conclusió), per no sumar
   * els dos i trencar la simetria del Figma.
   */
  flushBottom?: boolean;
}

/**
 * Graella de media del work detail.
 *
 * ⚑ RATIO DE LA GRAELLA — al Figma (frame "Works Detail Visual", Section 04 ·
 * Media) tota casella que va en graella de DUES COLUMNES és quadrada: 828×828
 * dins d'una Row de 1728 amb gap 24. El quadrat entra a md, que és on entra la
 * segona columna; a mòbil la imatge mana la seva alçada. Per això la cel·la no apilada és
 * `aspect-square`; les imatges es pugen ja quadrades, de manera que
 * `object-cover` no retalla res. Abans hi havia un `aspect-[4/3]` que menjava
 * el 25% de l'alçada de cada imatge.
 *
 * ⚑ MARGE I GAP — al Figma la Row de media va a padding lateral 24 i gap 24
 * (1728 → caixa de 1680), contra els 96 del text: el media és deliberadament
 * més ample que la columna de lectura. Per això `px-6` i `gap-6` de md amunt.
 *
 * A MÒBIL baixen a 8 (`px-2` / `gap-2`), com mana el frame "Works -
 * iPhone 16 Pro" (Section 02 · Media): a 402 px cada píxel de marge surt de
 * la imatge, i el ratio contra els 24 del text és el mateix que els 96/24 de
 * desktop. Decisió 15set26.
 *
 * ⚑ COIXÍ INFERIOR — 96/128/192 (`pb-24 md:pb-32 lg:pb-48`): 192 el mana el
 * frame desktop i 96 el frame mòbil. La rampa manté a mòbil la mateixa
 * proporció que a desktop entre el coixí del text (128) i el de la imatge
 * (96); amb 64 la imatge quedava el doble d'enganxada al text següent.
 * L'últim bloc abans de la conclusió no en posa (`flushBottom`): el coixí el
 * fa el `pt-[284px]` de la conclusió, que és el que mana el Figma per a
 * aquella costura.
 *
 * Tot el que va a amplada completa va a ratio natiu, sense caixa forçada: el
 * layout 'column' del bloc, la vista Lectura, el bloc d'una sola imatge i el
 * tercer item d'una graella de 3 (que ocupa les dues columnes). Abans aquell
 * tercer item duia un 21/9 fix, que era el mateix retall amb un altre número,
 * i el bloc d'una imatge es quadrava tot i anar sol a la fila.
 */
export default function WorkMediaGrid({
  media,
  viewMode,
  layout = "auto",
  flushBottom = false,
}: Props) {
  if (!media || media.length === 0) return null;

  /**
   * Apilat = una sola columna i imatge a ratio natiu, sense retall. La vista
   * Lectura sempre hi va; a Visual, només quan el bloc demana 'column'.
   */
  const stacked = viewMode === "lectura" || layout === "column";

  // Layout handling logic based on media count
  const getGridClasses = () => {
    if (stacked) return "grid-cols-1";
    if (layout === "row") return "grid-cols-1 md:grid-cols-2";
    if (media.length === 1) return "grid-cols-1";
    if (media.length === 2) return "grid-cols-1 md:grid-cols-2";
    if (media.length === 3) return "grid-cols-1 md:grid-cols-2"; // Or another custom layout like 2 small 1 large
    return "grid-cols-1 md:grid-cols-2"; // 4 items (2x2)
  };

  return (
    <section
      className={`w-full ${viewMode === "visual" ? "px-2 md:px-6" : ""} ${viewMode === "visual" && !flushBottom ? "pb-24 md:pb-32 lg:pb-48" : ""
        }`}
    >
      <div className={`${viewMode === "visual" ? `grid gap-2 md:gap-6` : "grid gap-12"} ${getGridClasses()}`}>
        {media.map((item, index) => {
          // If we have 3 items, make the last one span 2 columns in the layout
          const isThirdItemInOddGrid = !stacked && media.length === 3 && index === 2;
          /**
           * El quadrat val NOMÉS per a les caselles que realment van a dues
           * columnes: cal que el bloc tingui 2+ imatges o que el layout 'row'
           * ho forci. Un bloc d'una sola imatge ja ocupa l'amplada completa —
           * el quadrat li retallaria el pla ample.
           */
          const inTwoCols =
            !stacked &&
            !isThirdItemInOddGrid &&
            (layout === "row" || media.length >= 2);
          /**
           * Ratio natiu SEMPRE que no sigui casella de dues columnes: el bloc
           * apilat (vista Lectura o layout 'column'), el bloc d'una sola
           * imatge i el tercer item de la graella de 3, que ocupa les dues
           * columnes.
           */
          const nativeRatio = !inTwoCols;
          /**
           * ⚑ La casella de dues columnes és quadrada NOMÉS de md amunt
           * (`md:aspect-square`). Per sota, on la graella ja cau a una sola
           * columna, la imatge va a ratio natiu i sense retall — és el que
           * mana el frame "Works - iPhone 16 Pro" › Section 02 · Media
           * (10818:8601), on les caixes de 386 conserven la seva proporció.
           * Forçar el quadrat a mòbil retallava una tira apaïsada a 1:1.
           */
          const squareFromMd = !nativeRatio;

          return (
            <div
              key={item.id}
              className={`relative overflow-hidden bg-surface-card w-full ${nativeRatio
                ? isThirdItemInOddGrid
                  ? "md:col-span-2"
                  : ""
                : "md:aspect-square"
                }`}
            >
              {item.type === 'video' ? (
                <video
                  src={item.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className={`block w-full h-auto ${squareFromMd ? "md:absolute md:inset-0 md:h-full md:object-cover" : ""}`}
                />
              ) : (
                <Image
                  src={item.url}
                  alt={item.alt || "Project media"}
                  width={0}
                  height={0}
                  quality={90}
                  sizes={
                    nativeRatio && viewMode === "visual"
                      ? "100vw"
                      : "(max-width: 768px) 100vw, 50vw"
                  }
                  className={`block w-full h-auto ${squareFromMd ? "md:absolute md:inset-0 md:h-full md:object-cover" : ""}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
