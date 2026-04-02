"use client"; // Hem d'afegir 'use client' perquè utilitzem hooks d'animació

import React, { useRef } from "react";
import SharedPageHero from "@/components/common/SharedPageHero";
import Timeline from "@/components/about/Timeline";
import AboutIntro from "@/components/about/AboutIntro";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

// Com que és una client component, les metadata s'han de gestionar diferent o moure a un layout
// Deixa-les aquí de moment, però Next.js pot donar un warning.
// export const metadata: Metadata = {
//   title: "Sobre Mi | Màrius - Portfoli Freelance",
//   description: "Coneix més sobre mi i la meva experiència en disseny de producte.",
// };

export default function SobreMiPage() {
  // 1. Ref per al contenidor de la imatge que volem trackejar
  const targetSectionRef = useRef(null);

  // 2. useScroll: Detecta el scroll respecte al targetSectionRef
  const { scrollYProgress } = useScroll({
    target: targetSectionRef,
    offset: ["start end", "end start"] // Comença quan el top entra per sota, acaba quan el bottom surt per sobre
  });

  // 3. useTransform: Converteix el scroll (0 a 1) en moviment 'y' (-15% a 15%)
  // El valor '-15%' a '15%' fa que la imatge pugi/baixi suaument dins del contenidor.
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <main className="flex min-h-[100dvh] flex-col w-full bg-surface-base">
      <SharedPageHero
        title="Sobre Mi"
        description="Senior Product Designer amb més de 10 anys d'experiència construint solucions digitals per a corporacions i startups. Combino la precisió d'un programador amb la visió estratègica del disseny per crear productes que no només destaquen visualment, sinó que funcionen, escalen i converteixen."
        bottomContent={
          <>
            <div className="flex items-center gap-3 opacity-60">
              <span className="text-[14px] font-medium tracking-wider uppercase">(Scroll)</span>
            </div>
            <div className="flex items-center gap-6">
              <button className="font-sans font-medium hover:opacity-70 transition-opacity">CA</button>
            </div>
          </>
        }
      />

      {/* Secció 1: Imatge Parallax */}
      <section
        ref={targetSectionRef}
        className="w-full relative overflow-hidden aspect-[16/9] md:aspect-[20/11] lg:aspect-[21/9]"
      >
        <motion.div style={{ y }} className="absolute inset-0 w-full h-[130%] -top-[15%]">
          <Image
            src="/images/uiux_designer_based_emporda.png"
            alt="UI/UX Designer based in Empordà"
            fill // Fill container
            className="object-cover"
            priority
          />
        </motion.div>
      </section>

      {/* Secció 2: Imatge + Text */}
      <AboutIntro />

      {/* Secció 3: Timeline */}
      <Timeline />

    </main>
  );
}