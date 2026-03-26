"use client";

import React from "react";
import { motion } from "framer-motion";

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
          className="w-full md:w-5/12 lg:w-6/12 group cursor-none-on-hover" // Preparat per si després vols fer un custom cursor
        >
          <div className="relative overflow-hidden bg-surface-border">
            <motion.picture
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              <source media="(min-width: 1024px)" srcSet="/images/mariuscomas_01.png" />
              <source media="(min-width: 768px)" srcSet="/images/mariuscomas_01.png" />
              <img
                src="/images/mariuscomas_01.png"
                alt="Màrius Comas"
                className="w-full h-auto object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              />
            </motion.picture>
          </div>
        </motion.div>

        {/* Columna Text: 7 columnes de 12 */}
        <div className="w-full md:w-8/12 lg:w-6/12 flex flex-col gap-8 md:gap-10 lg:gap-16 xl:gap-24">
          <h2 className="text-heading-h1">Digital Product Designer especialitzat en UI/UX Design</h2>
          <div className="text-body-lg leading-relaxed space-y-6 max-w-[95%]">
            <p>El meu avantatge competitiu neix de la combinació entre una base tècnica en programació i l&apos;especialització en Arquitectura de la Informació i UI/UX. Això em permet connectar estratègicament els objectius de negoci amb les necessitats de l&apos;usuari, eliminant la complexitat visual per dissenyar sistemes que generen resultats tangibles.</p>
            <p>Aquest enfocament es tradueix en:</p>
            <ul className="space-y-4">
              {[
                "Disseny pensat per al desenvolupament: interfícies viables que garanteixen un lliurament (handoff) sense friccions i redueixen els costos tècnics.",
                "Execució àgil i precisa: Treballo amb dinamisme en entorns d&apos;esprints, creant des de guies d&apos;estil robustes fins a prototips d&apos;alta precisió.",
                "Impacte multisectorial: Experiència contrastada aportant valor a diferents indústries, des de la conceptualització d&apos;interfícies de vehicles (HMI) per a Cupra, fins al llançament de MVPs per al sector insurtech i públic."
              ].map((item, index) => (
                <li key={index} className="relative pl-6 text-text-secondary">
                  {/* El bullet personalitzat */}
                  <span className="absolute left-0 top-[0.6em] w-1.5 h-1.5 rounded-full bg-text-main opacity-80" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}
