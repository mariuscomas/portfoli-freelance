"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useSpring, type Variants } from "framer-motion";

/**
 * TIMELINE VERTICAL (story scroll)
 * Disseny: Figma MariusFreelance node 11398:9689.
 *
 * - Línia central que es "dibuixa" amb el progrés de l'scroll (scaleY).
 * - Fites alternades esquerra/dreta (paritat d'índex) amb reveal en entrar
 *   al viewport (un sol cop): any lliscant des del costat exterior, títol i
 *   descripció en fade-up, node amb pop, fletxa dibuixada amb pathLength i
 *   imatge collage amb rotació + escala.
 * - Mòbil: línia al marge esquerre i contingut apilat a la dreta.
 *
 * Imatges: exportar del Figma a /public/images/timeline/ amb aquests noms
 * (PNG, 2x). Rotació i aspect-ratio ja aplicats aquí sota.
 */

type Milestone = {
  year: string;
  title: string;
  description: string;
  image: string;
  /** rotació final del collage (graus, com al Figma) */
  rotate: number;
  /** aspect ratio w/h del PNG exportat */
  aspect: string;
  /** amplada màxima del collage al desktop */
  imgClass: string;
  flip?: boolean;
};

const milestones: Milestone[] = [
  { year: "2009", title: "Els Fonaments Audiovisuals", description: "Grau Superior en Realització Audiovisual i Multimèdia (EMAV). Adquisició de bases sòlides en composició visual, ritme i narrativa multimèdia", image: "/images/timeline/milestone-2009.png", rotate: 0, aspect: "587 / 886", imgClass: "max-w-[24rem] lg:max-w-[30rem]" },
  { year: "2011", title: "El Salt al Disseny Digital", description: "Grau en Disseny Multimèdia (UOC). Transició del desenvolupament pur a l'especialització en Experiència d'Usuari (UX) i Disseny d'Interfícies (UI). Inici formal de la meva trajectòria com a dissenyador autònom.", image: "/images/timeline/milestone-2011.png", rotate: 0, aspect: "1 / 1", imgClass: "max-w-[26rem] lg:max-w-[34rem]" },
  { year: "2014", title: "La Base Tècnica", description: "Freelance Web Designer & Developer. Execució de projectes end-to-end combinant disseny i programació. Aquesta experiència escrivint codi m'assegura dissenyar productes 100% viables i sense friccions per als desenvolupadors.", image: "/images/timeline/milestone-2014.png", rotate: 19.82, aspect: "579 / 434", imgClass: "max-w-[26rem] lg:max-w-[32rem]" },
  { year: "2018", title: "Consolidació Independent", description: "Super Malter & Freelance Senior. Reconeixement com a perfil d'alt rendiment a la plataforma Malt, avalat per més de 60 projectes d'èxit, +7 anys d'experiència a la plataforma i la màxima qualificació per part dels clients (5/5).", image: "/images/timeline/milestone-2018.png", rotate: 11.68, aspect: "1 / 1", imgClass: "max-w-[24rem] lg:max-w-[32rem]" },
  { year: "2020", title: "Optimització i Conversió (Holaluz)", description: "Consultoria UI/UX i maquetació. Col·laboració estratègica amb l'energètica Holaluz centrada en el disseny i maquetació avançada de campanyes d'email. Execució de tests A/B per prendre decisions basades en dades, millorar la retenció de l'usuari i maximitzar les mètriques de conversió directes.", image: "/images/timeline/milestone-2020.png", rotate: 23.44, aspect: "1 / 1", imgClass: "max-w-[18rem] lg:max-w-[22rem]" },
  { year: "2021", title: "Escalat i MVPs", description: "UI/UX Product Designer a Quantion. Lideratge en la definició, investigació i prototipatge de productes digitals (MVPs) altament escalables per al sector assegurador i l'administració pública", image: "/images/timeline/milestone-2021.png", rotate: 0, aspect: "555 / 693", imgClass: "max-w-[22rem] lg:max-w-[28rem]" },
  { year: "2023", title: "Innovació HMI i Automoció", description: "Senior UI/UX Product Designer a North Studio (Projecte Cupra). Disseny de les interfícies avançades de l'usuari (HMI) per a la pròxima generació de vehicles, col·laborant amb enginyeria per alinear els objectius d'innovació amb la funcionalitat pura.", image: "/images/timeline/milestone-2023.png", rotate: 15, aspect: "1 / 1", imgClass: "max-w-[18rem] lg:max-w-[23rem]" },
  { year: "Present", title: "Visió Global, Execució Local", description: "Product Designer des de l'Empordà. Aplicant més d'una dècada d'aprenentatge per ajudar marques exigents a dissenyar els ecosistemes digitals del demà.", image: "/images/timeline/milestone-present.png", rotate: -15, aspect: "456 / 684", imgClass: "max-w-[20rem] lg:max-w-[26rem]", flip: true },
];

// --- VARIANTS ---
// L'orquestració va per fita: el contenidor de la fita dispara whileInView
// (once: false → també anima la SORTIDA quan surt del viewport, i torna a
// entrar en tornar-hi) i escampa l'stagger als fills. Entrades sempre en X
// o escala (mai overflow vertical nou).
// Cada variant `hidden` porta la seva pròpia transició: la sortida és més
// ràpida i discreta (ease-in) que l'entrada, perquè no distregui.
const EXIT = { duration: 0.35, ease: [0.4, 0, 1, 1] as const };

const milestoneVariants: Variants = {
  hidden: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
  visible: { transition: { staggerChildren: 0.12 } },
};

const yearVariants = (fromRight: boolean): Variants => ({
  hidden: { opacity: 0, x: fromRight ? 64 : -64, transition: EXIT },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
});

const textVariants: Variants = {
  hidden: { opacity: 0, y: 24, transition: EXIT },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const dotVariants: Variants = {
  hidden: { scale: 0, transition: EXIT },
  visible: { scale: 1, transition: { type: "spring", stiffness: 320, damping: 18 } },
};

const arrowVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0, transition: EXIT },
  visible: { pathLength: 1, opacity: 1, transition: { duration: 0.9, ease: "easeInOut" } },
};

const imageVariants = (rotate: number): Variants => ({
  hidden: { opacity: 0, scale: 0.82, rotate: rotate + 10, transition: EXIT },
  visible: {
    opacity: 1,
    scale: 1,
    rotate,
    transition: { type: "spring", stiffness: 90, damping: 16, mass: 1.1 },
  },
});

/** Fletxa dibuixada a mà (traç únic → animable amb pathLength). */
function HandArrow({ mirrored }: { mirrored?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 222 78"
      fill="none"
      className={`w-32 md:w-44 lg:w-56 h-auto text-text-main ${mirrored ? "-scale-x-100" : ""}`}
      aria-hidden
    >
      <motion.path
        variants={arrowVariants}
        d="M4 8 C 60 4, 140 10, 176 34 C 196 48, 208 60, 214 70 M 214 70 L 192 62 M 214 70 L 210 46"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

export default function Timeline() {
  const sectionRef = useRef<HTMLElement>(null);

  // Progrés de la línia central: comença a dibuixar-se quan la secció entra
  // i acaba just abans de sortir. Spring per suavitzar el gest de scroll.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 75%", "end 85%"],
  });
  const lineProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 30, restDelta: 0.001 });

  return (
    <section
      ref={sectionRef}
      className="relative w-full pt-20 md:pt-32 pb-24 md:pb-40 bg-surface-base border-t border-border-subtle overflow-x-clip"
    >
      {/* --- LÍNIA CENTRAL --- */}
      {/* Track estàtic */}
      <div className="absolute top-0 bottom-0 left-6 md:left-1/2 w-[3px] md:-translate-x-1/2 bg-text-main/10" aria-hidden />
      {/* Línia de progrés que es dibuixa amb l'scroll */}
      <motion.div
        style={{ scaleY: lineProgress }}
        className="absolute top-0 bottom-0 left-6 md:left-1/2 w-[3px] md:-translate-x-1/2 bg-text-main origin-top"
        aria-hidden
      />

      <div className="flex flex-col gap-28 md:gap-44 lg:gap-56">
        {milestones.map((item, index) => {
          const textLeft = index % 2 === 0; // paritat: text esquerra ↔ dreta

          return (
            <motion.article
              key={item.year}
              variants={milestoneVariants}
              initial="hidden"
              whileInView="visible"
              // Sortida ASIMÈTRICA: el marge superior enorme (100000px) fa que
              // una fita que surt per DALT (scroll avall) segueixi comptant com
              // "in view" → no desapareix mai mentre baixes. En canvi, quan surt
              // per BAIX (scroll amunt) sí que passa a hidden → si tornes a
              // baixar, l'entrada es torna a reproduir.
              viewport={{ once: false, margin: "100000px 0px -15% 0px" }}
              className="relative"
            >
              {/* NODE sobre la línia */}
              <motion.div
                variants={dotVariants}
                className="absolute left-6 md:left-1/2 top-10 md:top-24 -translate-x-1/2 z-10 size-8 md:size-14 rounded-full bg-surface-base border-2 border-text-main flex items-center justify-center"
              >
                <div className="size-2.5 md:size-4 rounded-full bg-text-main" />
              </motion.div>

              <div className="grid md:grid-cols-2 items-center gap-10 md:gap-0 pl-16 pr-6 md:px-0">
                {/* --- BLOC DE TEXT --- */}
                <div
                  className={`flex flex-col md:px-12 lg:px-24 ${
                    textLeft
                      ? "md:order-1 md:items-start md:text-left"
                      : "md:order-2 md:items-end md:text-right"
                  }`}
                >
                  {/* text-display-h1 ja porta font-heading/semibold del DS
                      (sentence case per defecte, com al Figma) */}
                  <motion.p
                    variants={yearVariants(!textLeft)}
                    className="text-display-h1 text-text-main"
                  >
                    {item.year}
                  </motion.p>

                  {/* Fletxa cap al node (només desktop). Div normal: les
                      variants es propaguen igualment fins al path SVG. */}
                  <div className={`hidden md:block my-4 ${textLeft ? "self-end" : "self-start"}`}>
                    <HandArrow mirrored={!textLeft} />
                  </div>

                  <motion.h3 variants={textVariants} className="text-heading-h3 text-text-main mt-6 md:mt-0">
                    {item.title}
                  </motion.h3>
                  <motion.p variants={textVariants} className="text-body-xl text-text-secondary mt-4 md:mt-6 max-w-[36rem]">
                    {item.description}
                  </motion.p>
                </div>

                {/* --- COLLAGE --- */}
                <div
                  className={`flex ${
                    textLeft ? "md:order-2 md:justify-center" : "md:order-1 md:justify-center"
                  }`}
                >
                  <motion.div
                    variants={imageVariants(item.rotate)}
                    className={`relative w-full ${item.imgClass} will-change-transform`}
                    style={{ aspectRatio: item.aspect }}
                  >
                    <Image
                      src={item.image}
                      alt={`${item.year} — ${item.title}`}
                      fill
                      sizes="(min-width: 1024px) 34rem, (min-width: 768px) 26rem, 80vw"
                      className={`object-contain pointer-events-none select-none ${item.flip ? "-scale-y-100 rotate-180" : ""}`}
                    />
                  </motion.div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
