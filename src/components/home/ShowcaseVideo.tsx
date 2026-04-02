"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function ShowcaseVideo() {
  const containerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const { setTheme, theme } = useTheme();

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

  useMotionValueEvent(themeProgress, "change", (latest) => {
    // Switch to dark when the video is approximately centering
    // 0.45 is when the center of the video is approaching the center of viewport
    // 0.85 is when the video is starting to leave the viewport upwards
    const isInDarkZone = latest > 0.4 && latest < 0.85;

    if (isInDarkZone && theme !== "dark") {
      setTheme("dark");
    } else if (!isInDarkZone && theme === "dark") {
      setTheme("light");
    }
  });

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
      {/* Video Container sliding upwards into Hero's unused 10dvh peek zone */}
      <motion.div
        ref={videoRef}
        style={{ clipPath }}
        className="w-full aspect-[21/9] md:aspect-[2.4/1] lg:aspect-[2.8/1] bg-black relative overflow-hidden -mt-[60px] z-30"
      >
        <video
          src="/videos/master-web.mp4"
          autoPlay
          muted
          loop
          playsInline
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

