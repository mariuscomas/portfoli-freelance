"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function ShowcaseVideo() {
  const containerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"],
  });

  // Grow horizontally from incredibly narrow (35% width, fitting between CTA/Icons) to 100% width edge-to-edge
  const scaleX = useTransform(scrollYProgress, [0, 1], [0.35, 1]);

  return (
    <section
      ref={containerRef}
      className="w-full relative pt-0 pb-16 md:pb-32 flex flex-col justify-center items-center bg-surface-base overflow-hidden -mt-[100px] md:-mt-[80px] z-10"
    >
      {/* Video Container sliding upwards into Hero's unused 10dvh peek zone */}
      <motion.div
        style={{ scaleX }}
        className="w-full aspect-[21/9] md:aspect-[2.4/1] lg:aspect-[2.8/1] bg-black relative overflow-hidden origin-center"
      >
        <video
          src="/videos/Video_Cinematográfico_de_Carrera_Alpina_Lluviosa.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover origin-center"
          style={{
            scale: 1.1, // Prevent edge clipping on scale recalculation
            transform: useTransform(scaleX, (s) => `scaleX(${1 / s})`) as any
          }}
        />
        <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
      </motion.div>

      {/* Services List String */}
      <div className="w-full text-center mt-8 md:mt-16 px-4">
        <p className="font-sans text-[11px] md:text-sm lg:text-[15px] xl:text-base text-text-secondary uppercase tracking-[0.05em] md:tracking-[0.15em] max-w-[95vw] md:max-w-6xl mx-auto leading-relaxed md:leading-loose">
          Product Design <span className="mx-2 md:mx-4 opacity-50">·</span>
          Branding & Identity Design <span className="mx-2 md:mx-4 opacity-50">·</span>
          Mobile App Design <span className="mx-2 md:mx-4 opacity-50">·</span>
          UI/UX Design Audit <span className="mx-2 md:mx-4 opacity-50">·</span>
          Website Design <span className="mx-2 md:mx-4 opacity-50">·</span>
          Landing Page Design
        </p>
      </div>
    </section>
  );
}
