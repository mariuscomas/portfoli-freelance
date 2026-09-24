"use client";

import { useEffect, useRef, useState } from "react";
import { WorkDetailData } from "@/types/works";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import WorkDetailSection from "./WorkDetailSection";
import WorkMediaGrid from "./WorkMediaGrid";
import NextProjectScroll from "./NextProjectScroll";
import WorkViewBar from "./WorkViewBar";
import WorkShareRow from "./WorkShareRow";
import SharedPageHero from "@/components/common/SharedPageHero";
import { useSetHeaderContrast } from "@/context/HeaderContrastContext";

interface Props {
  data: WorkDetailData;
}

export default function WorkDetailLayout({ data }: Props) {
  const [view, setView] = useState<"visual" | "lectura">("visual");
  // El bloc de projecte següent amaga la barra fixa: té el seu propi gest.
  const endRef = useRef<HTMLDivElement>(null);
  // Contenidor de contingut (just després del hero). En canviar de mode ens
  // hi situem a dalt per començar a llegir amb el nou format.
  const contentRef = useRef<HTMLDivElement>(null);
  const setHeaderContrast = useSetHeaderContrast();
  const { scrollY } = useScroll();

  // Sincronitza el contrast del Header amb el hero d'aquest case study.
  // Mentre el viewport-top està sobre el hero sticky, el Header ha d'usar
  // el mateix color de text que el hero (light o dark fixed). Quan l'usuari
  // ha fet scroll prou perquè la secció següent ja cobreixi l'àrea del
  // Header, retornem a "auto" perquè el Header torni als tokens del tema.
  const heroIsLight = data.hero.textColor !== "dark"; // default = light text
  useEffect(() => {
    // Estat inicial al muntar la pàgina (abans del primer scroll event)
    const initialOverHero =
      typeof window === "undefined"
        ? true
        : window.scrollY < window.innerHeight * 0.85;
    setHeaderContrast(
      initialOverHero ? (heroIsLight ? "light" : "dark") : "auto"
    );
    // Quan deixem el case study, sempre retornem el Header a "auto"
    return () => setHeaderContrast("auto");
  }, [heroIsLight, setHeaderContrast]);

  /*
    Canvi de vista: el contingut es reordena sencer (visual ↔ lectura), així
    que mantenir la posició d'scroll deixava el lector a mitja pàgina d'un
    layout que ja no existia. Saltem a l'inici del contenidor de contingut
    —no al hero, que ja s'ha vist— de manera instantània, sota el crossfade
    de 0.4s de l'AnimatePresence, perquè no es vegi el recorregut.
  */
  const handleViewChange = (next: "visual" | "lectura") => {
    if (next === view) return;
    setView(next);
    if (typeof window === "undefined") return;
    const node = contentRef.current;
    if (!node) return;
    const top = node.getBoundingClientRect().top + window.scrollY;
    if (window.scrollY > top) window.scrollTo({ top, behavior: "auto" });
  };

  useMotionValueEvent(scrollY, "change", (latest) => {
    // Llindar: ~85% del viewport. A aquest punt la secció següent (z-10,
    // bg-surface-base) ja ha pujat per sobre del hero i toca el Header.
    const threshold =
      typeof window === "undefined" ? 800 : window.innerHeight * 0.85;
    if (latest < threshold) {
      setHeaderContrast(heroIsLight ? "light" : "dark");
    } else {
      setHeaderContrast("auto");
    }
  });

  // El color del text del hero el decideix l'editor (light/dark) en funció
  // del FONS (color/imatge), no del tema del visitant. Per això usem tokens
  // *fixed* (`text-text-fixed-light` / `text-text-fixed-dark`) que NO
  // s'inverteixen amb el tema light/dark del site — així el contrast es manté
  // estable: si l'admin va marcar "dark" perquè el fons és clar, el text
  // sempre serà fosc, també si el visitant està en dark mode.
  const hasHeroImage = data.hero.backgroundMode === "image" && Boolean(data.hero.backgroundImage);
  const isLightText = data.hero.textColor !== "dark";
  const contrast = isLightText
    ? {
      text: "text-text-fixed-light",
      border: "border-text-fixed-light",
      bg: "bg-text-fixed-light",
      decoration: "decoration-text-fixed-light/30",
      decorationHover: "hover:decoration-text-fixed-light",
      descriptionClassName: "text-text-fixed-light/80",
      secondaryClassName: "text-text-fixed-light-secondary",
      // strokeColor = MATEIX color del text solid (no el secundari), per
      // tenir solid + outline al mateix to — només varia la textura.
      strokeColor: "var(--color-text-fixed-light)",
    }
    : {
      text: "text-text-fixed-dark",
      border: "border-text-fixed-dark",
      bg: "bg-text-fixed-dark",
      decoration: "decoration-text-fixed-dark/30",
      decorationHover: "hover:decoration-text-fixed-dark",
      descriptionClassName: "text-text-fixed-dark/80",
      secondaryClassName: "text-text-fixed-dark-secondary",
      // strokeColor = MATEIX color del text solid (no el secundari)
      strokeColor: "var(--color-text-fixed-dark)",
    };

  return (
    <div className="w-full relative bg-surface-base min-h-screen">
      <SharedPageHero
        title={data.hero.title}
        description={data.hero.description}
        containerClassName="transition-colors duration-700"
        style={{ backgroundColor: data.hero.backgroundColor }}
        backgroundImage={hasHeroImage ? data.hero.backgroundImage : undefined}
        overlayOpacity={data.hero.overlayOpacity}
        textClassName={contrast.text}
        descriptionClassName={contrast.descriptionClassName}
        secondaryClassName={contrast.secondaryClassName}
        strokeColor={contrast.strokeColor}
        parallax
        bottomContent={
          /* El hero només convida a baixar. El selector de vista i el retorn
             viuen a WorkViewBar, que apareix en sortir del hero: tenir-los
             als dos llocs els duplicava i, a més, amb escales diferents
             (el hero anava a 15px i la barra va a la rampa buttons-menu).
             Patró de wearemotto.com/portfolio/protege. */
          <div className={`flex items-center w-full mt-auto relative z-20 opacity-70 ${contrast.text}`}>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-6 border ${contrast.border} rounded-sm opacity-50 relative`}>
                <div className={`w-full h-[1px] ${contrast.bg} absolute top-1/2 left-0 opacity-50`} />
              </div>
              <span className="text-[14px] font-sans tracking-wider uppercase">(SCROLL) ↓</span>
            </div>
          </div>
        }
      />

      {/*
        relative z-10 + bg-surface-base: el contenidor de seccions ha de
        lliscar per sobre del hero sticky (reveal Motto). Sense aquest fons
        opac veuríem el hero a través del contingut — i durant el canvi de
        vista el fade-out el deixava veure igualment, perquè el fons anava al
        mateix element que s'animava. Ara el fons i el z-10 viuen en aquest
        contenidor, que NO s'anima; el motion.div de dins només porta el fade.
        min-h-screen evita que el frame buit entre l'exit i l'entrada
        (AnimatePresence mode="wait") col·lapsi l'alçada i ensenyi el hero.
      */}
      <div ref={contentRef} className="relative z-10 bg-surface-base min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full"
          >
            {view === "visual" ? (
              // pt-32 / md:pt-48 garanteix que la primera secció no es solapi amb el
              // Header fixed (≈80-90px amb padding) ni que els elements sticky de
              // WorkDetailSection apareguin per sota de MÀRIUS. al primer scroll.
              <div className="flex flex-col w-full pt-32 md:pt-48">
                {data.blocks.map((block, i) => {
                  // L'últim bloc de media no posa coixí inferior propi: el coixí
                  // que separa la darrera imatge de la conclusió és el pt de la
                  // secció de conclusió (284 px al Figma), i si tots dos hi fossin
                  // se sumarien.
                  const isLast = i === data.blocks.length - 1;
                  const dropTrailingPad = isLast && Boolean(data.conclusion);
                  return (
                    <div key={block.id} className="w-full flex flex-col">
                      <WorkDetailSection text={block.textSection} viewMode="visual" />
                      {block.media && block.media.length > 0 && (
                        <WorkMediaGrid
                          media={block.media}
                          viewMode="visual"
                          layout={block.mediaLayout}
                          flushBottom={dropTrailingPad}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 px-6 md:px-12 pt-32 md:pt-48">
                {/* Left Column: All Media */}
                <div className="w-4/12 flex flex-col gap-8 w-full">
                  {data.blocks.map(
                    (block) =>
                      block.media &&
                      block.media.length > 0 && (
                        <WorkMediaGrid key={`media-${block.id}`} media={block.media} viewMode="lectura" />
                      )
                  )}
                </div>

                {/* Right Column: All Text */}
                <div className="w-8/12 flex flex-col gap-24 w-full h-max">
                  {data.blocks.map((block) => (
                    <WorkDetailSection key={`text-${block.id}`} text={block.textSection} viewMode="lectura" />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Conclusion Section — `conclusion` és HTML (RichTextEditor).
          Figma (node 10682-5666): Body/XL · 2XL · 3XL Regular (24 · 32 · 56),
          rampa fixa 21set26. L'estil porta família, pes, interlineat i
          tracking; substitueix el clamp(24→48) d'abans. Alineació: esquerra
          a mòbil (Figma 10818-8683), centrada des de md.
          - Width: max 1536px (article width del Figma)
          - Espaiat (Figma section/m · xl · 2xl = 96 · 192 · 288, marge
            page-margin/*). El pt fa el paper del pb de la secció de media
            anterior al Figma, que al codi no en té. 288 des de lg, amb el
            salt del text a 56.
          Sense prose perquè Tailwind no compon prose-p: amb classes
          custom de @layer components. */}
      {data.conclusion && (
        <section className="relative z-10 px-page py-section-m md:py-section-xl lg:py-section-2xl flex justify-center bg-surface-base">
          <div className="w-full max-w-[1536px] flex flex-col items-center text-left md:text-center">
            <div
              className="text-body-xl md:text-body-2xl lg:text-body-3xl text-text-main
                [&_p]:my-0
                [&_strong]:text-text-main [&_strong]:font-bold
                [&_em]:italic
                [&_a]:text-text-main [&_a]:underline hover:[&_a]:opacity-70"
              dangerouslySetInnerHTML={{ __html: data.conclusion }}
            />
          </div>
        </section>
      )}

      {/* Final Image — bg-surface-base + z-10 com la resta de blocs: sense fons
          opac, el hero sticky del darrere es veu a través d'aquest contenidor. */}
      {data.finalMedia && data.finalMedia.length > 0 && (
        <div className="relative z-10 bg-surface-base px-6 pb-16 md:pb-32">
          <WorkMediaGrid media={data.finalMedia} viewMode="lectura" />
        </div>
      )}

      {/* Compartir a mòbil i tablet. A desktop viu a la barra fixa (24set26). */}
      <WorkShareRow title={data.hero.title} slug={data.slug} />

      {/* Next Project Nav */}
      <div ref={endRef}>
        <NextProjectScroll nextProject={data.nextProject} />
      </div>

      {/* Barra fixa: selector de vista + retorn. Viu fora del hero perquè el
          hero és sticky i el seu contingut fa fade amb el parallax. */}
      <WorkViewBar
        view={view}
        onChange={handleViewChange}
        stopRef={endRef}
        shareTitle={data.hero.title}
        shareSlug={data.slug}
      />
    </div>
  );
}
