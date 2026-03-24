"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function AboutTeaser() {
  return (
    <section className="w-full py-24 md:py-40 px-4 md:px-[3vw] lg:px-[4vw] bg-surface-base flex flex-col gap-12 md:gap-20">
      
      {/* Heading */}
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="font-heading text-6xl md:text-8xl lg:text-[140px] text-text-main uppercase leading-none m-0"
      >
        Sobre mi
      </motion.h2>

      {/* 3 Images Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: 0.1 }}
           className="w-full aspect-square bg-surface-elevated overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 relative"
        >
          {/* A falta d'imatge utilitzarem aquest placeholder decoratiu */}
          <div className="absolute inset-0 bg-text-main/10" />
        </motion.div>
        
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: 0.2 }}
           className="w-full aspect-square bg-surface-elevated overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 relative"
        >
          <div className="absolute inset-0 bg-text-main/20" />
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: 0.3 }}
           className="w-full aspect-square bg-surface-elevated overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 relative"
        >
          <div className="absolute inset-0 bg-text-main/30" />
        </motion.div>
      </div>

      {/* Text Context - Right Aligned */}
      <div className="w-full flex justify-end mt-4">
        <div className="w-full md:w-1/2 lg:w-5/12 flex flex-col gap-8 md:pr-[5vw]">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-sans text-xl md:text-2xl lg:text-[28px] text-text-secondary leading-snug"
          >
            Orgullós de col·laborar i poder ajudar a les empreses a aconseguir el seus objectius i millorar les experiències dels seus clients.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <a
              href="/about"
              className="inline-block font-sans font-medium text-lg text-text-main hover:text-text-secondary pb-1 border-b border-text-main hover:border-text-secondary transition-colors"
            >
              Descobreix més sobre mi
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
