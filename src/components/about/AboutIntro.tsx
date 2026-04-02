"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function AboutIntro() {
  return (
    <section className="
      w-full 
      px-6 
      md:px-12 
      lg:px-16 
      py-20 
      md:py-32"
    >
      <div className="
        flex 
        flex-col 
        md:flex-row 
        gap-12 
        lg:gap-20 
        xl:gap-24 
        w-full 
        mx-auto 
        items-start">

        {/* Columna Imatge amb Efecte Hover i Revelat */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full md:w-5/12 lg:w-6/12 group cursor-none-on-hover md:sticky md:top-32 h-fit"
        >
          <div className="relative overflow-hidden bg-surface-border">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative aspect-square md:aspect-[4/5] overflow-hidden"
            >
              <Image
                src="/images/mariuscomas_01.png"
                alt="Màrius Comas"
                fill
                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                priority
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Columna Text: 7 columnes de 12 */}
        <div className="w-full md:w-8/12 lg:w-6/12 flex flex-col gap-8 md:gap-10 lg:gap-12 xl:gap-16 md:sticky md:top-32 h-fit">
          <h2 className="text-heading-h1">Digital Product Designer especialitzat en UI/UX Design</h2>
          <div className="text-body-lg font-light text-text-secondary leading-relaxed space-y-6 max-w-[95%]">
            <p>La meva base en programació i especialització en UI/UX em permeten simplificar la complexitat i dissenyar sistemes estratègics que uneixen els objectius de negoci amb les necessitats de l'usuari, generant resultats tangibles.</p>
            <p>Aquest enfocament es tradueix en:</p>
            <ul className="space-y-4">
              {[
                "Disseny viable: Handoffs sense friccions i reducció directa de costos tècnics.",
                "Execució àgil: Prototipat ràpid i de precisió en dinàmiques d'esprint.",
                "Impacte multisectorial: Solucions provades en sectors com l'automoció, l'insurtech i el sector públic."
              ].map((item, index) => {
                // Busquem la posició dels dos punts
                const colonIndex = item.indexOf(':');

                // Separem el text si trobem els dos punts
                const boldPart = colonIndex !== -1 ? item.substring(0, colonIndex) : item;
                const restPart = colonIndex !== -1 ? item.substring(colonIndex + 1) : '';

                return (
                  <li key={index} className="relative pl-6 text-text-secondary">
                    {/* El bullet personalitzat */}
                    <span className="absolute left-0 top-[0.6em] w-1.5 h-1.5 rounded-full bg-text-main opacity-80" />

                    {/* Renderitzem amb el span si hi ha ":", o el text normal si no n'hi ha */}
                    {colonIndex !== -1 ? (
                      <>
                        <span className="font-medium text-text-main">{boldPart}</span>
                        :{restPart}
                      </>
                    ) : (
                      item
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}
