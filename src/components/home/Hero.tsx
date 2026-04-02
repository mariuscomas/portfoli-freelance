"use client";

import { motion, useScroll, useTransform, Transition } from "framer-motion";
import { ArrowDown, DribbbleLogo, LinkedinLogo, BehanceLogo } from "@phosphor-icons/react";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useIdle } from "@/hooks/useIdle";

const container = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1] as Transition["ease"],
    },
  },
};

export default function Hero() {
  const { scrollY } = useScroll();
  const { isIdle, hasInteracted } = useIdle(5000);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

  // Parallax i fade-out per al footer
  const footerY = useTransform(scrollY, [0, 500], [0, 200]);
  const footerScrollOpacity = useTransform(scrollY, [0, 250], [1, 0]);

  // Opacity per al footer basat en scroll i inactivitat
  const isVisible = hasInteracted && !isIdle;

  return (
    <section className="h-[100dvh] flex flex-col w-full relative z-10 overflow-hidden bg-surface-base">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{ opacity, scale }}
        className="flex-1 flex flex-col justify-center items-start md:items-center px-4 md:px-8 lg:px-24 relative"
      >
        {/* Main Hero Title */}
        <div className="relative text-left flex flex-col items-start md:flex-row md:items-center md:justify-center gap-2 font-heading text-[clamp(1.8rem,4vw,2rem)] leading-[1.1] tracking-tight text-text-main">
          <motion.h1
            variants={fadeUp}
            className="m-0 p-0"
          >
            <span className="font-light">ESTRATÈGIA. </span>
          </motion.h1>
          <motion.h1
            variants={fadeUp}
            className="m-0 p-0"
          >
            <span className="font-light">PRODUCTE. </span>
          </motion.h1>
          <motion.h1
            variants={fadeUp}
            className="m-0 p-0"
          >
            <span className="font-extrabold tracking-tighter">IMPACTE.</span>
          </motion.h1>
          {/* Down Arrow */}
          <motion.div variants={fadeUp} className="mt-8 sm:absolute top-30">
            <ArrowDown
              size={48}
              weight="light"
              className="text-text-main animate-bounce"
            />
          </motion.div>
        </div>
      </motion.div>


      {/* Hero Footer: Fixed bottom, becomes covered by next section */}
      <motion.div
        style={{
          y: footerY,
          opacity: footerScrollOpacity
        }}
        className="absolute bottom-0 left-0 w-full h-[120px] flex justify-between items-center px-4 md:px-8 lg:px-24 z-0 pointer-events-none"
      >
        <motion.div
          animate={{
            opacity: isVisible ? 1 : 0,
            y: isVisible ? 0 : 20
          }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex justify-between items-center pointer-events-auto"
        >
          {/* Left: Language/Theme Toggle Area */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="flex items-center gap-4"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-text-main/10 hover:border-text-main/30 transition-colors cursor-pointer group">
              <div className="w-2.5 h-2.5 bg-text-main rounded-[2px]" />
              <span className="font-sans text-[15px] font-medium text-text-main">CA</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-text-muted group-hover:text-text-main transition-colors">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="ml-2">
              <ThemeToggle />
            </div>
          </motion.div>

          {/* Right: Social Links */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="flex items-center gap-6"
          >
            <a href="#" className="text-text-main hover:opacity-60 transition-opacity" aria-label="Dribbble">
              <DribbbleLogo size={24} weight="regular" />
            </a>
            <a href="#" className="text-text-main hover:opacity-60 transition-opacity" aria-label="LinkedIn">
              <LinkedinLogo size={24} weight="regular" />
            </a>
            <a href="#" className="text-text-main hover:opacity-60 transition-opacity" aria-label="Behance">
              <BehanceLogo size={24} weight="regular" />
            </a>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
