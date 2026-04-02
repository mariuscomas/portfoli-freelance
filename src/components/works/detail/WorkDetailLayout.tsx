"use client";

import { useState } from "react";
import { WorkDetailData } from "@/types/works";
import { motion, AnimatePresence } from "framer-motion";
import WorkDetailSection from "./WorkDetailSection";
import WorkMediaGrid from "./WorkMediaGrid";
import NextProjectScroll from "./NextProjectScroll";
import SharedPageHero from "@/components/common/SharedPageHero";
import Link from "next/link";

interface Props {
  data: WorkDetailData;
}

export default function WorkDetailLayout({ data }: Props) {
  const [view, setView] = useState<"visual" | "lectura">("visual");

  const getContrastClasses = (hexColor?: string) => {
    if (!hexColor) return { text: "text-text-main-inverse", border: "border-text-main-inverse", bg: "bg-text-main-inverse" };
    let hex = hexColor.replace("#", "");
    if (hex.length === 3) {
      hex = hex.split("").map((char) => char + char).join("");
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    
    return yiq >= 128 
      ? { 
          text: "text-text-main", 
          border: "border-text-main", 
          bg: "bg-text-main",
          decoration: "decoration-text-main/30",
          decorationHover: "hover:decoration-text-main"
        }
      : { 
          text: "text-text-main-inverse", 
          border: "border-text-main-inverse", 
          bg: "bg-text-main-inverse",
          decoration: "decoration-text-main-inverse/30",
          decorationHover: "hover:decoration-text-main-inverse"
        };
  };

  const contrast = getContrastClasses(data.hero.backgroundColor);

  return (
    <div className="w-full relative bg-surface-base min-h-screen">
      <SharedPageHero
        title={data.hero.title}
        description={data.hero.description}
        containerClassName="transition-colors duration-700"
        style={{ backgroundColor: data.hero.backgroundColor }}
        textClassName={contrast.text}
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

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full pb-16 md:pb-32 lg:pb-48 xl:pb-96"
        >
          {view === "visual" ? (
            <div className="flex flex-col w-full pt-16 md:pt-32">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 px-6 md:px-12 pt-16 md:pt-12">
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

      {/* Conclusion Section */}
      {data.conclusion && (
        <section className="px-6 md:px-12 lg:px-24 pb-16 md:pb-32 lg:pb-48 xl:pb-96 flex justify-center bg-surface-base">
          <div className="w-[80%] flex flex-col items-center text-center">
            <p className="text-body-xl text-text-main leading-snug md:leading-snug lg:leading-snug font-medium">
              {data.conclusion}
            </p>
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
