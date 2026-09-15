"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function AboutTeaser() {
  return (
    <section className="w-full border-t border-border-subtle py-section-y-lg">

      {/* Heading */}
      <div className="flex justify-between items-end mb-16 md:mb-20 px-4 md:px-[3vw] lg:px-[4vw]">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-heading text-heading-h1 uppercase text-text-main leading-none m-0"
        >
          Sobre mi
        </motion.h2>
      </div>

      {/* 3 Images Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 px-4 md:px-[3vw] lg:px-[4vw] gap-4 md:gap-6 w-full">

        {/* Imatge 1 (Esquerra): Ocupa 2 columnes a mòbil, 1 columna i 2 files a Tablet, i 1 columna i 1 fila a Desktop */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="col-span-2 md:col-span-1 md:row-span-2 lg:row-span-1 w-full relative overflow-hidden bg-surface-elevated grayscale hover:grayscale-0 transition-all duration-500 aspect-square md:aspect-auto lg:aspect-[4/5] h-full min-h-[300px]"
        >
          <Image src="/images/home_about_marius_03.png" alt="Màrius Comas" fill className="object-cover absolute inset-0" />
        </motion.div>

        {/* Imatge 2 (Dreta Dalt) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="col-span-1 w-full relative overflow-hidden bg-surface-elevated grayscale hover:grayscale-0 transition-all duration-500 aspect-square md:aspect-[4/3] lg:aspect-[4/5]"
        >
          <Image src="/images/home_about_marius_02.png" alt="Paisatge 1" fill className="object-cover absolute inset-0" />
        </motion.div>

        {/* Imatge 3 (Dreta Baix) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="col-span-1 w-full relative overflow-hidden bg-surface-elevated grayscale hover:grayscale-0 transition-all duration-500 aspect-square md:aspect-[4/3] lg:aspect-[4/5]"
        >
          <Image src="/images/home_about_marius_01.png" alt="Paisatge 2" fill className="object-cover absolute inset-0" />
        </motion.div>
      </div>

      {/* Text Content - Right Aligned (Alineat amb les fotos de la dreta) */}
      <div className="w-full px-4 md:px-[3vw] lg:px-[4vw] mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-0">
        {/* Figma (node 10756:5169): col 6/span 6 d'un grid de 12 → meitat dreta deixant 1 columna (1/12 ≈ 128px) d'aire a la dreta, igual que a l'esquerra de la columna */}
        <div className="md:col-start-2 lg:col-start-6 lg:col-span-6 flex flex-col gap-10">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-body-2xl text-text-secondary"
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
              className="inline-block text-body-md font-medium text-text-main hover:text-text-secondary pb-1 border-b border-text-main hover:border-text-secondary transition-colors"
            >
              Descobreix més sobre mi
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
