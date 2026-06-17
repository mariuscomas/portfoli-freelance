"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { AsteriskIcon } from "@phosphor-icons/react";

interface SharedPageHeroProps {
  title: string;
  description: string;
  bottomContent?: React.ReactNode;
  containerClassName?: string;
  textClassName?: string;
  /**
   * Classe per al text de descripció. Permet que el hero del case study
   * (sobre color/imatge fosca) usi blanc, mentre que altres pàgines (about,
   * serveis…) conserven el seu gris secundari per defecte.
   */
  descriptionClassName?: string;
  /**
   * Classe per als asteriscs decoratius del marquee. Per defecte usa el
   * `text-text-secondary` del tema. El case study l'override amb un color
   * fixed (no s'inverteix) per mantenir contrast sobre el fons admin-controlat.
   */
  secondaryClassName?: string;
  /**
   * Color CSS (qualsevol valor vàlid: hex, var(...), rgb...) per al contorn
   * del títol duplicat del marquee. Per defecte usa `var(--color-text-secondary)`,
   * que segueix el tema actual. El case study l'override amb un color fixed.
   */
  strokeColor?: string;
  style?: React.CSSProperties;
  /**
   * Si es proporciona, es renderitza com a fons (object-cover) per sobre del
   * `backgroundColor` passat via `style`. Útil per a heros de case studies amb
   * imatge.
   */
  backgroundImage?: string;
  /**
   * Overlay fosc sobre la imatge per millorar legibilitat. Valor 0–80.
   * Només té efecte si `backgroundImage` està definit.
   */
  overlayOpacity?: number;
  /**
   * Activa el mode parallax estil Motto (sticky reveal + zoom + fade).
   * Quan està actiu:
   *  - El hero es queda `sticky top-0` amb alçada exacta de viewport.
   *  - La imatge de fons fa zoom-in subtil i es desplaça més lent que el scroll.
   *  - Títol marquee + descripció + bottomContent fan fade + lleugera pujada
   *    a mesura que la secció següent llisca per sobre.
   * Pensat per a pàgines de detall (case studies). Per defecte desactivat per
   * preservar el comportament a about/serveis/contacte/works.
   */
  parallax?: boolean;
}

export default function SharedPageHero({
  title,
  description,
  bottomContent,
  containerClassName = "bg-transparent",
  textClassName = "text-text-main",
  descriptionClassName = "text-text-main",
  secondaryClassName = "text-text-secondary",
  strokeColor = "var(--color-text-secondary)",
  style,
  backgroundImage,
  overlayOpacity = 0,
  parallax = false,
}: SharedPageHeroProps) {
  const hasImage = Boolean(backgroundImage)
  const clampedOverlay = Math.max(0, Math.min(80, overlayOpacity)) / 100

  // Parallax — mesurem el progrés del scroll des de que el top del hero
  // toca el top del viewport fins que el bottom del hero arriba al top
  // (és a dir, durant la "pinada" sticky d'aproximadament 1 viewport).
  // Quan parallax=false, scrollYProgress s'ignora i no es paga cap cost.
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  // Imatge: zoom-in subtil + lleugera baixada (parallax — més lent que el scroll)
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.18]);
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  // Contingut: pujada més marcada + fade — desapareix abans de la fi de la pinada
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-25%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const rootBaseClasses =
    "relative flex flex-col justify-between w-full pt-32 md:pt-24 pb-12 px-6 md:px-12 lg:px-16 xl:px-24 overflow-hidden";
  // En mode parallax el hero ha de ser, com a mínim, l'alçada de la finestra
  // perquè la "pinada" sticky duri 1 viewport sencer i la secció següent
  // (amb bg propi i z-10) pugui lliscar per sobre tapant-lo. `min-h-screen`
  // (en lloc de `h-screen`) deixa que creixi si el contingut és més alt.
  const sizingClasses = parallax
    ? "min-h-screen sticky top-0 mb-0"
    : "min-h-[calc(90vh-128px)] lg:min-h-[calc(100vh-40px)] mb-0 md:mb-0";

  return (
    <div
      ref={sectionRef}
      className={`${rootBaseClasses} ${sizingClasses} ${containerClassName}`}
      style={style}
    >
      {hasImage && (
        <>
          {parallax ? (
            <motion.img
              src={backgroundImage}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none will-change-transform"
              style={{ scale: imageScale, y: imageY }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={backgroundImage}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
          {clampedOverlay > 0 && (
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundColor: `rgba(0, 0, 0, ${clampedOverlay})` }}
            />
          )}
          {/* Wrapper z-index — assegura que el contingut quedi sobre la imatge i l'overlay */}
        </>
      )}
      <motion.div
        className={`relative ${hasImage ? "z-10" : ""} flex flex-col justify-between flex-1 gap-0`}
        style={parallax ? { y: contentY, opacity: contentOpacity } : undefined}
      >

        {/* Top: Title & Description */}
        <div className="flex flex-col w-full gap-0 md:gap-6 lg:gap-8">

          {/* Marquee Title Container that breaks out of padding */}
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen overflow-hidden mb-2"
          >
            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                repeat: Infinity,
                ease: "linear",
                duration: 50,
              }}
              className="text-[clamp(4rem,10vw,12.5rem)] font-sans font-medium uppercase leading-none tracking-tight flex items-center gap-8 lg:gap-12 w-max px-6 md:px-12 lg:px-24 shrink-0 py-6 transform-gpu will-change-transform"
            >
              {/*
              Marquee amb alternança solid + outline (hollow letters), però
              tots dos amb EL MATEIX COLOR. La stroke usa `strokeColor` que
              ara és el mateix color del text solid (no el secundari) per
              mantenir uniformitat de to — només varia la textura: filled
              ↔ outline. Asteriscos giratoris com a separador.
            */}
              {/* Set 1 */}
              <h1 className={` ${textClassName}`}>{title}</h1>
              <AsteriskIcon weight="light" size="1em" className={`${textClassName} animate-spin-linear shrink-0`} />
              <h1
                className="text-transparent"
                style={{ WebkitTextStroke: `max(2px, 0.02em) ${strokeColor}` }}
              >
                {title}
              </h1>
              <AsteriskIcon weight="light" size="1em" className={`${textClassName} animate-spin-linear shrink-0`} />

              {/* Set 2 (for seamless loop) */}
              <h1 className={` ${textClassName}`}>{title}</h1>
              <AsteriskIcon weight="light" size="1em" className={`${textClassName} animate-spin-linear shrink-0`} />
              <h1
                className="text-transparent"
                style={{ WebkitTextStroke: `max(2px, 0.02em) ${strokeColor}` }}
              >
                {title}
              </h1>
              <AsteriskIcon weight="light" size="1em" className={`${textClassName} animate-spin-linear shrink-0`} />
            </motion.div>
          </motion.div>

          {/* Description Animada Paraula a Paraula */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.03, // Temps entre cada paraula
                  delayChildren: 0.5,    // Retard inicial coordinat amb el Hero (+0.2s)
                },
              },
            }}
            /*
              tracking-tight (-0.025em) compacta lleugerament les lletres
              per apropar-nos al feel de Motto. La seva font (PP Neue
              Montreal) té formes naturalment més condensades que la nostra
              (Grtsk) — amb tracking 0 ja es veu tight. Aplicant ~-0.025em
              emulem aquest aspecte sense canviar typeface.
            */
            className={`flex flex-wrap font-medium text-body-2xl tracking-tight max-w-[90%] ${descriptionClassName}`}
          >
            {description.split(" ").map((word, index) => (
              <span key={index} className="overflow-hidden inline-flex mr-[0.25em] pb-1">
                <motion.span
                  variants={{
                    hidden: { y: "120%" },
                    visible: {
                      y: "0%",
                      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
                    },
                  }}
                  className="inline-block"
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </motion.div>

        </div>

        {/* Bottom Content / Slots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex items-end justify-between w-full mt-auto pt-16 md:pt-0"
        >
          {bottomContent}
        </motion.div>

      </motion.div>
    </div>
  );
}