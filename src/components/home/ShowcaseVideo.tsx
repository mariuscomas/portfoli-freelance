"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function ShowcaseVideo() {
  const containerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme, setAmbientDark } = useTheme();

  // Scroll for the clipPath animation (start until center of the video)
  const { scrollYProgress } = useScroll({
    target: videoRef,
    offset: ["start end", "center center"],
  });

  // Scroll for the theme switching (based on video position)
  const { scrollYProgress: themeProgress } = useScroll({
    target: videoRef,
    offset: ["start end", "end start"],
  });

  /*
    Efecte "cinema / ambient":
    Quan el vídeo està a la zona central del viewport (40-85% del progrés),
    activem un mode dark temporal que tinta tota la web. Quan en surt, torna
    al mode triat per l'usuari.

    Excepció: si l'usuari ja està en Dark, no fem res. No té sentit "enfosquir
    el que ja és fosc" i sortir-ne podria semblar un parpalleig.

    A diferència de l'antiga implementació amb setTheme(), aquesta NO toca
    localStorage — la tria persistida de l'usuari es preserva sempre.
  */
  useMotionValueEvent(themeProgress, "change", (latest) => {
    if (resolvedTheme === "dark") return; // l'usuari ja és Dark, no fem res
    const isInDarkZone = latest > 0.4 && latest < 0.85;
    setAmbientDark(isInDarkZone);
  });

  // Si l'usuari canvia a Dark mentre el vídeo està actiu, deixar net l'ambient
  useEffect(() => {
    if (resolvedTheme === "dark") setAmbientDark(false);
  }, [resolvedTheme, setAmbientDark]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Reveal horizontally from the center (35% width) to 100% width edge-to-edge
  // On mobile, start at 100% (inset 0%)
  const initialInset = isMobile ? "0%" : "32.5%";
  const clipPath = useTransform(
    scrollYProgress,
    [0, 1],
    [`inset(0% ${initialInset} 0% ${initialInset} round 0px)`, "inset(0% 0% 0% 0% round 0px)"]
  );

  return (
    <section
      ref={containerRef}
      className="w-full relative pt-0 pb-16 md:pb-32 flex flex-col justify-center items-center bg-surface-base overflow-visible z-20"
    >
      {/* Video Container sliding upwards into Hero's unused 10dvh peek zone.
          Fallback `bg-surface-card-inverse` (en lloc de `bg-black` cru) perquè
          el "peek" del bloc abans de carregar el vídeo respecti tokens
          del design system i no es vegi com un asset incomplet. */}
      <motion.div
        ref={videoRef}
        style={{ clipPath }}
        className="w-full aspect-[21/9] md:aspect-[2.4/1] lg:aspect-[2.8/1] bg-surface-card-inverse relative overflow-hidden -mt-[60px] z-30"
      >
        <video
          src="/videos/master-web.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
      </motion.div>

      {/* Services List String */}
      <div className="w-full text-center mt-8 md:mt-16 px-4">
        <p className="font-sans text-[11px] md:text-sm lg:text-[15px] xl:text-base text-text-secondary uppercase tracking-[0.05em] md:tracking-[0.15em] max-w-[95vw] md:max-w-6xl xl:max-w-[100vw] mx-auto leading-relaxed md:leading-loose">
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

