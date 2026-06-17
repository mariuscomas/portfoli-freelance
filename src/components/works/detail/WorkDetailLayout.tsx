"use client";

import { useEffect, useState } from "react";
import { WorkDetailData } from "@/types/works";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import WorkDetailSection from "./WorkDetailSection";
import WorkMediaGrid from "./WorkMediaGrid";
import NextProjectScroll from "./NextProjectScroll";
import SharedPageHero from "@/components/common/SharedPageHero";
import Link from "next/link";
import { useSetHeaderContrast } from "@/context/HeaderContrastContext";

interface Props {
  data: WorkDetailData;
}

export default function WorkDetailLayout({ data }: Props) {
  const [view, setView] = useState<"visual" | "lectura">("visual");
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
          <div className="flex flex-col md:flex-row items-center justify-between w-full mt-auto relative z-20 top-2 lg:top-4">

            {/* Esquerra: Scroll Indicator */}
            <div className={`hidden md:flex items-center w-full md:w-1/3 justify-start opacity-70 ${contrast.text}`}>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-6 border ${contrast.border} rounded-sm opacity-50 relative`}>
                  <div className={`w-full h-[1px] ${contrast.bg} absolute top-1/2 left-0 opacity-50`} />
                </div>
                <span className="text-[14px] font-sans tracking-wider uppercase">(SCROLL) ↓</span>
              </div>
            </div>

            {/* Centre: Toggle Button */}
            <div className="flex items-center justify-center w-full md:w-1/3 my-4 md:my-0">
              <div className="flex items-center p-1.5 rounded-full bg-surface-base shadow-lg border border-text-main/5">
                {(["visual", "lectura"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setView(mode)}
                    className={`relative z-10 px-8 py-2.5 rounded-full text-[15px] font-medium transition-colors duration-300 capitalize ${view === mode ? "text-surface-base" : "text-text-main hover:text-text-secondary"
                      }`}
                  >
                    {view === mode && (
                      <motion.div
                        layoutId="worksDetailHeroToggle"
                        className="absolute inset-0 bg-text-main rounded-full -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Dreta: Link Tots els projectes */}
            <div className={`flex items-center justify-center md:justify-end w-full md:w-1/3 ${contrast.text}`}>
              <Link
                href="/works"
                className={`font-sans font-medium text-[15px] tracking-wide hover:opacity-70 transition-opacity underline underline-offset-[6px] ${contrast.decoration} ${contrast.decorationHover} h-full`}
              >
                Veure tots els projectes
              </Link>
            </div>

          </div>
        }
      />

      {/*
        relative z-10 + bg-surface-base: el contenidor de seccions ha de
        lliscar per sobre del hero sticky (reveal Motto). Sense aquest
        fons opac, veuriem el hero a través del contingut.
      */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full relative z-10 bg-surface-base"
        >
          {view === "visual" ? (
            // pt-32 / md:pt-48 garanteix que la primera secció no es solapi amb el
            // Header fixed (≈80-90px amb padding) ni que els elements sticky de
            // WorkDetailSection apareguin per sota de MÀRIUS. al primer scroll.
            <div className="flex flex-col w-full pt-32 md:pt-48">
              {data.blocks.map((block) => (
                <div key={block.id} className="w-full flex flex-col">
                  <WorkDetailSection text={block.textSection} viewMode="visual" />
                  {block.media && block.media.length > 0 && (
                    <WorkMediaGrid media={block.media} viewMode="visual" />
                  )}
                </div>
              ))}
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

      {/* Conclusion Section — `conclusion` és HTML (RichTextEditor).
          Valors alineats amb el node Figma 10682-5666:
          - font-size: 48 px desktop (clamp 24→48 fluid amb 2.5vw)
          - line-height: 1.33 (64px @ 48px font)
          - font-weight: 400 (Regular, no medium)
          - letter-spacing: 0
          - Width: max 1536px (article width del Figma)
          - Section pb: 284 px (var --section/padding/y-xl)
          Sense prose perquè Tailwind no compon prose-p: amb classes
          custom de @layer components. */}
      {data.conclusion && (
        <section className="px-6 md:px-12 lg:px-24 pb-32 md:pb-48 lg:pb-64 xl:pb-[284px] flex justify-center bg-surface-base">
          <div className="w-full max-w-[1536px] flex flex-col items-center text-center">
            <div
              className="text-[clamp(1.5rem,2.5vw,3rem)] leading-[1.33] tracking-normal text-text-main font-normal
                [&_p]:my-0
                [&_strong]:text-text-main [&_strong]:font-bold
                [&_em]:italic
                [&_a]:text-text-main [&_a]:underline hover:[&_a]:opacity-70"
              dangerouslySetInnerHTML={{ __html: data.conclusion }}
            />
          </div>
        </section>
      )}

      {/* Final Image */}
      {data.finalMedia && data.finalMedia.length > 0 && (
        <div className="pb-16 md:pb-32">
          <WorkMediaGrid media={data.finalMedia} viewMode="lectura" />
        </div>
      )}

      {/* Next Project Nav */}
      <NextProjectScroll nextProject={data.nextProject} />
    </div>
  );
}
