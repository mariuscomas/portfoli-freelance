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
 * dins d'una Row de 1728 amb gap 24. Per això la cel·la no apilada és
 * `aspect-square`; les imatges es pugen ja quadrades, de manera que
 * `object-cover` no retalla res. Abans hi havia un `aspect-[4/3]` que menjava
 * el 25% de l'alçada de cada imatge.
 *
 * Tot el que va a amplada completa va a ratio natiu, sense caixa forçada: el
 * layout 'column' del bloc, la vista Lectura i el tercer item d'una graella de
 * 3 (que ocupa les dues columnes). Abans aquell tercer item duia un 21/9 fix,
 * que era el mateix retall amb un altre número.
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
    <section className={`w-full ${viewMode === "visual" && !flushBottom ? "pb-16 md:pb-32" : ""}`}>
      <div className={`${viewMode === "visual" ? `grid gap-4 md:gap-8` : "grid gap-12"} ${getGridClasses()}`}>
        {media.map((item, index) => {
          // If we have 3 items, make the last one span 2 columns in the layout
          const isThirdItemInOddGrid = !stacked && media.length === 3 && index === 2;
          /**
           * Ratio natiu = la imatge marca l'alçada. Hi va tot el que ocupa
           * amplada completa: el bloc apilat i el tercer item de la graella
           * de 3. La resta és casella quadrada de dues columnes.
           */
          const nativeRatio = stacked || isThirdItemInOddGrid;

          return (
            <div
              key={item.id}
              className={`relative overflow-hidden bg-surface-card ${nativeRatio
                ? `w-full ${isThirdItemInOddGrid ? "md:col-span-2" : ""}`
                : "aspect-square"
                }`}
            >
              {item.type === 'video' ? (
                <video
                  src={item.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className={`w-full ${!nativeRatio ? "object-cover h-full absolute inset-0" : "h-auto block"}`}
                />
              ) : !nativeRatio ? (
                <Image
                  src={item.url}
                  alt={item.alt || "Project media"}
                  fill
                  quality={100}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <Image
                  src={item.url}
                  alt={item.alt || "Project media"}
                  width={0}
                  height={0}
                  quality={100}
                  sizes={viewMode === "visual" ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
                  style={{ width: "100%", height: "auto" }}
                  className="block"
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
