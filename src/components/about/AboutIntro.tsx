"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { useContactModal } from "@/context/ContactModalContext";

export default function AboutIntro() {
  const { open: openContactModal } = useContactModal();

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
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="w-full md:w-5/12 lg:w-6/12 group cursor-none-on-hover md:sticky md:top-0 md:h-[100svh] md:flex md:items-center"
        >
          <div className="relative w-full overflow-hidden bg-border-subtle">
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

        {/* Columna Text */}
        <div className="w-full md:w-8/12 lg:w-6/12 flex flex-col gap-8 md:gap-10 lg:gap-12">
          {/* Figma 11403:8882 — eyebrow Others/Caption + títol Display/H2 */}
          <div className="flex flex-col gap-6">
            <span className="text-caption text-text-secondary">Del disseny al codi</span>
            <h2 className="text-display-xs md:text-display-s lg:text-display-l text-text-main">Dissenyo i llanço productes digitals end-to-end</h2>
          </div>

          <div className="text-body-m-light md:text-body-xl-light lg:text-body-2xl-light font-light text-text-secondary leading-relaxed space-y-6 max-w-prose">
            <p>
              Vinc del món de la programació i el desenvolupament web. No
              dissenyo sobre el paper: dissenyo interfícies sabent exactament
              com es construiran, amb handoffs sense friccions i menys costos
              de desenvolupament.
            </p>
            <p>
              Especialitzat en arquitectura de la informació i disseny UI/UX,
              faig de pont entre els objectius de negoci i les necessitats de
              l&apos;usuari: guies d&apos;estil robustes, prototips d&apos;alta
              precisió i treball àgil en esprints.
            </p>
            <p>
              I avui vaig un pas més enllà: desenvolupo i publico projectes web
              complets (del primer wireframe al desplegament a producció),
              accelerant el cicle amb eines d&apos;IA. Ja sigui conceptualitzant
              HMI per a Cupra o llançant MVPs en insurtech i sector públic,
              l&apos;objectiu és sempre el mateix: eliminar complexitat i
              generar resultats tangibles.
            </p>
          </div>

          {/* Figma 11403:8886 — Buttons Group: 2× Buttons/Outline/Large, gap 24 */}
          <div className="flex flex-wrap items-center gap-6">
            <Button variant="outline" size="xl" onClick={openContactModal}>
              Comencem un projecte
            </Button>
            <Button variant="outline" size="xl" as="a" href="/works">
              Veure els treballs
            </Button>
          </div>
        </div>

      </div>
    </section>
  );
}
