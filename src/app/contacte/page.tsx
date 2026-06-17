"use client";

import { motion } from "framer-motion";
import { ArrowRight, EnvelopeSimple, LinkedinLogo, BehanceLogo, DribbbleLogo } from "@phosphor-icons/react";
import SharedPageHero from "@/components/common/SharedPageHero";
import ContactForm from "@/components/contact/ContactForm";

/*
  /contacte
  ---------
  Punt d'aterratge unificat per a totes les CTAs ("Comencem?",
  "Reserva una trucada", "Contacte" del menu). Estructura:
    1. SharedPageHero amb marquee "Contacte"
    2. Bloc principal: email directe + Calendly + canals socials
    3. Microcopy de resposta esperada (gestió d'expectatives)
*/

const EMAIL = "mariuscr23@gmail.com";

export default function ContactePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col w-full bg-surface-base">
      <SharedPageHero
        title="Contacte"
        description="Tens una idea o un producte digital al cap? Parlem-ne. Acostumo a respondre en menys de 24 hores i les primeres trucades exploratòries són sempre sense compromís."
      />

      <section className="w-full px-6 md:px-12 lg:px-24 py-20 md:py-32 flex flex-col gap-24 md:gap-32">

        {/* Bloc 1: Email + Calendly (CTAs principals) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          {/* Email directe */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            <span className="font-sans uppercase tracking-[0.15em] text-body-sm text-text-secondary">
              01 · Email directe
            </span>
            <h2 className="text-heading-h2 text-text-main">
              Escriu-me un correu i et responc el mateix dia.
            </h2>
            <a
              href={`mailto:${EMAIL}`}
              className="group inline-flex items-center gap-3 text-text-main hover:text-accent transition-colors duration-300 text-body-lg font-medium w-fit pb-2 border-b border-text-main hover:border-accent"
            >
              <EnvelopeSimple size={24} weight="regular" />
              <span>{EMAIL}</span>
              <ArrowRight size={20} weight="regular" className="group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          {/* Calendly / reservar trucada */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            <span className="font-sans uppercase tracking-[0.15em] text-body-sm text-text-secondary">
              02 · Reserva una trucada
            </span>
            <h2 className="text-heading-h2 text-text-main">
              Prefereixes parlar? Agafem 30 min sense compromís.
            </h2>
            <a
              href="https://calendly.com/mariuscr23"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 text-text-main hover:text-accent transition-colors duration-300 text-body-lg font-medium w-fit pb-2 border-b border-text-main hover:border-accent"
            >
              <span>Agendar trucada exploratòria</span>
              <ArrowRight size={20} weight="regular" className="group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>

        {/* Bloc 2: Formulari de contacte (desa a contact_submissions) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-10"
        >
          <div className="flex flex-col gap-4 max-w-3xl">
            <span className="font-sans uppercase tracking-[0.15em] text-body-sm text-text-secondary">
              03 · Escriu-me un missatge
            </span>
            <h2 className="text-heading-h2 text-text-main">
              Tens un projecte concret al cap?
            </h2>
            <p className="text-body-lg text-text-secondary leading-relaxed">
              Si prefereixes deixar-me els detalls per escrit, omple aquest formulari i et responc en menys de 24 hores.
            </p>
          </div>
          <ContactForm />
        </motion.div>

        {/* Bloc 3: Canals socials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-10"
        >
          <div className="flex flex-col gap-4">
            <span className="font-sans uppercase tracking-[0.15em] text-body-sm text-text-secondary">
              04 · O segueix-me a
            </span>
          </div>
          <div className="flex flex-wrap gap-6 md:gap-10">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 text-text-secondary hover:text-accent transition-colors duration-300 text-body-lg"
            >
              <LinkedinLogo size={28} weight="regular" />
              <span className="underline underline-offset-4 decoration-text-secondary/30 group-hover:decoration-accent">LinkedIn</span>
            </a>
            <a
              href="https://behance.net"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 text-text-secondary hover:text-accent transition-colors duration-300 text-body-lg"
            >
              <BehanceLogo size={28} weight="regular" />
              <span className="underline underline-offset-4 decoration-text-secondary/30 group-hover:decoration-accent">Behance</span>
            </a>
            <a
              href="https://dribbble.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 text-text-secondary hover:text-accent transition-colors duration-300 text-body-lg"
            >
              <DribbbleLogo size={28} weight="regular" />
              <span className="underline underline-offset-4 decoration-text-secondary/30 group-hover:decoration-accent">Dribbble</span>
            </a>
          </div>
        </motion.div>

      </section>
    </main>
  );
}
