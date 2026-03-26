"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDownIcon, DribbbleLogoIcon, LinkedinLogoIcon, BehanceLogoIcon } from "@phosphor-icons/react";
import ThemeToggle from "@/components/common/ThemeToggle";

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

const slideUp = {
  hidden: { y: "120%" },
  show: {
    y: "0%",
    transition: {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1] as any, // Premium curve
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
      ease: [0.16, 1, 0.3, 1] as any,
    },
  },
};

export default function Hero() {
  const { scrollY } = useScroll();
  // Accelerate the footer upwards on scroll to escape the inflating video
  const footerY = useTransform(scrollY, [0, 500], [0, -200]);

  return (
    <section className="h-[100dvh] md:h-[100dvh] min-h-[500px] flex flex-col w-full relative z-20 overflow-hidden">

      {/* =========================================
          MOBILE LAYOUT (< md)
          ========================================= */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full h-full flex md:hidden flex-col justify-between pt-24 px-4 pb-0"
      >
        <div className="flex flex-col gap-0 w-full text-left">

          <div className="overflow-visible pt-[0.2em] -mt-[0.2em] [clip-path:inset(-10px_0_0_0)]">
            <motion.h1
              variants={slideUp}
              className="font-heading font-semibold text-[clamp(3rem,14vw,8rem)] leading-[0.8] tracking-tighter text-text-main m-0 p-0 uppercase"
            >
              ESTRATÈGIA<span className="text-text-main">.</span>
            </motion.h1>
          </div>

          <div className="overflow-visible pt-[0.2em] -mt-[0.2em] [clip-path:inset(-10px_0_0_0)]">
            <motion.h1
              variants={slideUp}
              className="font-heading font-semibold text-[clamp(3rem,14vw,8rem)] leading-[0.8] tracking-tighter text-text-main m-0 p-0 uppercase"
            >
              PRODUCTE
            </motion.h1>
          </div>

          <div className="overflow-visible pt-[0.2em] -mt-[0.2em] [clip-path:inset(-10px_0_0_0)]">
            <motion.h1
              variants={slideUp}
              className="font-heading font-semibold text-[clamp(3rem,14vw,8rem)] leading-[0.8] tracking-tighter text-text-main m-0 p-0 uppercase"
            >
              IMPACTE
            </motion.h1>
          </div>

          <motion.div variants={fadeUp} className="mt-8 pr-4">
            <p className="font-sans text-[15px] leading-relaxed text-text-secondary">
              Ajudo empreses tecnològiques a transformar idees complexes en productes digitals escalables i centrats en l'usuari.
            </p>
          </motion.div>

        </div>

        <div className="flex flex-col items-start gap-8 mt-auto pt-8">

          <motion.a
            href="#"
            style={{ y: footerY }}
            variants={fadeUp}
            className="font-sans text-lg text-text-main font-medium pb-[2px] border-b-[1.5px] border-text-main hover:text-text-secondary transition-colors"
          >
            Descobreix com et puc ajudar
          </motion.a>


          <motion.div variants={fadeUp} style={{ y: footerY }} className="flex gap-6 items-center">
            <a href="#" className="text-text-main hover:text-text-secondary transition-all" aria-label="Dribbble">
              <DribbbleLogoIcon size={28} weight="regular" />
            </a>
            <a href="#" className="text-text-main hover:text-text-secondary transition-all" aria-label="LinkedIn">
              <LinkedinLogoIcon size={28} weight="regular" />
            </a>
            <a href="#" className="text-text-main hover:text-text-secondary transition-all" aria-label="Behance">
              <BehanceLogoIcon size={28} weight="regular" />
            </a>
          </motion.div>
        </div>
      </motion.div>

      {/* =========================================
          DESKTOP LAYOUT (>= md)
          ========================================= */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="hidden md:flex w-full h-full flex-col"
      >
        {/* Center Container */}
        <div className="flex-1 flex flex-col justify-center min-h-0 px-[3vw] lg:px-[4vw]">
          {/* Main Headings */}
          <div className="flex flex-col gap-1 w-full text-left">

            {/* Row 1: ESTRATÈGIA (Aligned with IMPACTE) */}
            <div className="w-full flex items-end overflow-visible pt-[0.2em] -mt-[0.2em] [clip-path:inset(-20px_0_0_0)]">
              <div className="w-[70px] lg:w-[130px] shrink-0" /> {/* Spacer matched to Arrow */}
              <motion.h1
                variants={slideUp}
                className="font-heading font-semibold text-[clamp(4rem,10.5vw,18rem)] leading-[0.85] tracking-tighter text-text-main m-0 p-0 uppercase"
              >
                ESTRATÈGIA
              </motion.h1>
            </div>

            {/* Row 2: Paragraph + PRODUCTE */}
            <div className="w-full flex flex-col lg:flex-row lg:items-center">
              <motion.div
                variants={fadeUp}
                className="w-full lg:w-[35%] max-w-[400px] mb-2 lg:mb-0 text-left pr-4"
              >
                <p className="font-sans text-sm lg:text-[min(1.2vw,16px)] xl:text-[min(1.1vw,18px)] text-text-secondary leading-relaxed lg:mt-2">
                  Ajudo empreses tecnològiques a transformar<br /> idees complexes en productes digitals<br /> escalables i centrats en l'usuari.
                </p>
              </motion.div>

              <div className="flex-1 flex overflow-visible pt-[0.2em] -mt-[0.2em] lg:pb-1 [clip-path:inset(-20px_0_0_0)]">
                <motion.h1
                  variants={slideUp}
                  className="font-heading font-semibold text-[clamp(4rem,10.5vw,18rem)] leading-[0.85] tracking-tighter text-text-main m-0 p-0 uppercase"
                >
                  PRODUCTE
                </motion.h1>
              </div>
            </div>

            {/* Row 3: IMPACTE with Arrow */}
            <div className="w-full flex items-center overflow-visible pt-[0.2em] -mt-[0.2em] [clip-path:inset(-20px_0_0_0)]">
              <div className="w-[70px] lg:w-[130px] shrink-0 flex items-center justify-start">
                <ArrowDownIcon
                  weight="regular"
                  className="text-text-main w-[50px] h-[50px] lg:w-[min(7vw,90px)] lg:h-[min(7vw,90px)] -mb-1 lg:-mb-5"
                />
              </div>
              <motion.h1
                variants={slideUp}
                className="font-heading font-semibold text-[clamp(4rem,10.5vw,18rem)] leading-[0.85] tracking-tighter text-text-main m-0 p-0 uppercase"
              >
                IMPACTE
              </motion.h1>
            </div>

          </div>
        </div>

        {/* Local Footer (Same Height as Header Spacer for perfect vertical center) */}
        <div className="w-full shrink-0 h-[120px] flex justify-between items-center px-[3vw] lg:px-[4vw]">
          <motion.a
            href="#"
            style={{ y: footerY }}
            variants={fadeUp}
            className="font-sans text-base text-text-secondary font-medium pb-[2px] border-b border-text-secondary/30 hover:text-text-main hover:border-text-main transition-colors"
          >
            <ThemeToggle />
            Descobreix com et puc ajudar?
          </motion.a>



          <motion.div
            variants={fadeUp}
            style={{ y: footerY }}
            className="flex gap-6 items-center"
          >
            <a href="#" className="text-text-main hover:text-text-secondary transition-all hover:scale-110" aria-label="Dribbble">
              <DribbbleLogoIcon size={24} weight="regular" className="md:w-[24px] md:h-[24px]" />
            </a>
            <a href="#" className="text-text-main hover:text-text-secondary transition-all hover:scale-110" aria-label="LinkedIn">
              <LinkedinLogoIcon size={24} weight="regular" className="md:w-[24px] md:h-[24px]" />
            </a>
            <a href="#" className="text-text-main hover:text-text-secondary transition-all hover:scale-110" aria-label="Behance">
              <BehanceLogoIcon size={24} weight="regular" className="md:w-[24px] md:h-[24px]" />
            </a>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
