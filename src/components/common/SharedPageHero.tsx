"use client";

import React from "react";
import { motion } from "framer-motion";
import { AsteriskIcon } from "@phosphor-icons/react";

interface SharedPageHeroProps {
  title: string;
  description: string;
  bottomContent?: React.ReactNode;
  containerClassName?: string;
  textClassName?: string;
}

export default function SharedPageHero({
  title,
  description,
  bottomContent,
  containerClassName = "bg-transparent",
  textClassName = "text-text-main",
}: SharedPageHeroProps) {
  return (
    <div className={`flex flex-col justify-between w-full min-h-[calc(90vh-128px)] lg:min-h-[calc(100vh-40px)] pt-32 md:pt-24 pb-12 mb-0 md:mb-0 px-6 md:px-12 lg:px-16 xl:px-40 ${containerClassName}`}>

      {/* Top: Title & Description */}
      <div className="flex flex-col w-full gap-0 md:gap-6 lg:gap-12">

        {/* Marquee Title Container that breaks out of padding */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen overflow-hidden mb-2"
        >
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: 50,
            }}
            className="text-display-h1 flex items-center gap-8 lg:gap-8 w-max px-6 md:px-12 lg:px-24 shrink-0 py-6"
          >
            {/* Set 1 */}
            <h1 className={` ${textClassName}`}>{title}</h1>
            <AsteriskIcon weight="thin" size="1em" className="text-text-secondary animate-spin-linear shrink-0" />
            <h1 className="text-transparent [-webkit-text-stroke:2px_var(--color-text-secondary)]">{title}</h1>
            <AsteriskIcon weight="thin" size="1em" className="text-text-secondary animate-spin-linear shrink-0" />
            <h1 className={` ${textClassName}`}>{title}</h1>
            <AsteriskIcon weight="thin" size="1em" className="text-text-secondary animate-spin-linear shrink-0" />
            <h1 className="text-transparent [-webkit-text-stroke:2px_var(--color-text-secondary)]">{title}</h1>
            <AsteriskIcon weight="thin" size="1em" className="text-text-secondary animate-spin-linear shrink-0" />

            {/* Set 2 (for seamless loop) */}
            <h1 className={` ${textClassName}`}>{title}</h1>
            <AsteriskIcon weight="thin" size="1em" className="text-text-secondary animate-spin-linear shrink-0" />
            <h1 className="text-transparent [-webkit-text-stroke:2px_var(--color-text-secondary)]">{title}</h1>
            <AsteriskIcon weight="thin" size="1em" className="text-text-secondary animate-spin-linear shrink-0" />
            <h1 className={` ${textClassName}`}>{title}</h1>
            <AsteriskIcon weight="thin" size="1em" className="text-text-secondary animate-spin-linear shrink-0" />
            <h1 className="text-transparent [-webkit-text-stroke:2px_var(--color-text-secondary)]">{title}</h1>
            <AsteriskIcon weight="thin" size="1em" className="text-text-secondary animate-spin-linear shrink-0" />
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
                delayChildren: 0.2,    // Retard inicial
              },
            },
          }}
          className="flex flex-wrap text-text-main text-body-xl text-text-muted leading-snug md:leading-tight max-w-[90%] md:max-w-[48rem] lg:max-w-[70%]"
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
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex items-end justify-between w-full mt-auto pt-16 md:pt-0"
      >
        {bottomContent}
      </motion.div>

    </div>
  );
}