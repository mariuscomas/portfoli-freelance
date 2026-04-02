import { WorkMedia } from "@/types/works";
import Image from "next/image";

interface Props {
  media: WorkMedia[];
  viewMode: "visual" | "lectura";
}

export default function WorkMediaGrid({ media, viewMode }: Props) {
  if (!media || media.length === 0) return null;

  // Layout handling logic based on media count
  const getGridClasses = () => {
    if (viewMode === "lectura") return "grid-cols-1";
    if (media.length === 1) return "grid-cols-1";
    if (media.length === 2) return "grid-cols-1 md:grid-cols-2";
    if (media.length === 3) return "grid-cols-1 md:grid-cols-2"; // Or another custom layout like 2 small 1 large
    return "grid-cols-1 md:grid-cols-2"; // 4 items (2x2)
  };

  return (
    <section className={`w-full ${viewMode === "visual" ? "pb-16 md:pb-32" : ""}`}>
      <div className={`${viewMode === "visual" ? `grid gap-4 md:gap-8` : "grid gap-12"} ${getGridClasses()}`}>
        {media.map((item, index) => {
          // If we have 3 items, make the last one span 2 columns in the layout
          const isThirdItemInOddGrid = media.length === 3 && index === 2;

          return (
            <div
              key={item.id}
              className={`relative overflow-hidden bg-surface-card ${viewMode === "visual"
                ? `aspect-[4/3] ${isThirdItemInOddGrid ? "md:col-span-2 md:aspect-[21/9]" : ""}`
                : "w-full"
                }`}
            >
              {item.type === 'video' ? (
                <video
                  src={item.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className={`w-full ${viewMode === "visual" ? "object-cover h-full absolute inset-0" : "h-auto block"}`}
                />
              ) : viewMode === "visual" ? (
                <Image
                  src={item.url}
                  alt={item.alt || "Project media"}
                  fill
                  quality={100}
                  sizes={
                    isThirdItemInOddGrid
                      ? "100vw"
                      : "(max-width: 768px) 100vw, 50vw"
                  }
                  className="object-cover"
                />
              ) : (
                <Image
                  src={item.url}
                  alt={item.alt || "Project media"}
                  width={0}
                  height={0}
                  quality={100}
                  sizes="(max-width: 768px) 100vw, 50vw"
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
