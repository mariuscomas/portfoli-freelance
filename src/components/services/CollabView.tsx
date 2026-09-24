"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import Button from "@/components/ui/Button";
import CollabConfiguratorModal from "./CollabConfiguratorModal";
import { CONFIGURATOR_ENABLED } from "@/lib/flags";
import BridgeDoor from "@/components/services/BridgeDoor";
import RateTable from "@/components/services/RateTable";
import IntegrationCards from "@/components/services/IntegrationCards";
import {
  COLLAB_RATES,
  COLLAB_MODIFIERS,
  COLLAB_CALENDAR_URL,
} from "@/lib/pricing";
import { COLLAB_CLIENT_LOGOS } from "@/lib/clients";
import { AVAILABILITY, AVAILABILITY_COPY, AVAILABILITY_DOT } from "@/lib/availability";

/* Marge lateral de pàgina. Llegeix la rampa `--page-margin`
   (402:24 · 768:48 · 1024:72 · 1440:96 · 1920:144), que mana des del
   21set26. Abans era "px-6 md:px-12 lg:px-16 xl:px-24" escrit a mà,
   que a lg donava 64 on la rampa en diu 72 i no tenia el graó de 144. */
const SECTION_PX = "px-page";

/* Ritme vertical (24set26, igual que /serveis): vora superior sòlida a
   cada secció (border/default), padding section/s (72) a mòbil i tablet i
   section/m (96) a desktop, i 64 del títol al contingut. */

function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function SectionHeader({ caption, title }: { caption: string; title: string }) {
  return (
    <div className="flex flex-col gap-4">
      <span className="text-caption uppercase text-text-secondary">{caption}</span>
      <h2 className="text-display-s-medium md:text-display-m-medium lg:text-display-l-medium text-text-main">{title}</h2>
    </div>
  );
}

// ————————————————————————————————— Proposta de valor
// Figma (24set26): eyebrow —24 (32 a tablet)— titular —24— text —64— logos.

function ValueSection() {
  return (
    <section id="colaboracio" className={`${SECTION_PX} py-section-s lg:py-section-m bg-surface-base border-t border-border-default`}>
      <Reveal>
        <span className="text-caption uppercase text-text-secondary">
          AGÈNCIES I ESTUDIS
        </span>
        <h2 className="mt-6 md:mt-8 lg:mt-6 max-w-4xl text-display-xs md:text-display-s lg:text-display-l text-text-main">
          Un perfil sènior que dissenya i entén el codi, integrat al teu equip en 48 hores.
        </h2>
        <p className="mt-6 max-w-2xl text-body-s md:text-body-m lg:text-body-l text-text-secondary">
          Disseny UX/UI de producte per a equips que necessiten reforç sense passar per una
          contractació. Hi he treballat per a:
        </p>
        {/* Prova social amb logotips (Figma). Igualats per alçada de caixa
            alta, com a la home: fixem `height` i deixem l'amplada automàtica
            perquè no es puguin deformar. A mòbil fan wrap. */}
        <ul className="mt-16 flex flex-wrap items-center gap-x-10 gap-y-6 sm:gap-x-12">
          {COLLAB_CLIENT_LOGOS.map((c) => (
            <li key={c.id} className="flex h-14 items-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG local de mida fixa; next/image no hi aporta res */}
              <img src={c.src} alt={c.name} height={c.h} style={{ height: c.h, width: "auto" }} />
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— Tarifes per durada

function RatesSection() {
  return (
    <section id="tarifes" className={`${SECTION_PX} py-section-s lg:py-section-m bg-surface-base border-t border-border-default`}>
      <Reveal>
        <SectionHeader caption="EL DESCOMPTE ES GUANYA AMB COMPROMÍS" title="Tarifes per durada" />
      </Reveal>
      <Reveal className="mt-16">
        {/* Mateixa taula que els recurrents de /serveis: set "Row · Recurrent"
            12438:12648 (24set26). */}
        <RateTable rows={COLLAB_RATES.map((r) => ({ name: r.modality, body: r.detail, price: r.rate }))} />
        <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          {COLLAB_MODIFIERS.map((m) => (
            <li key={m} className="text-caption uppercase text-text-secondary">
              {m}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— Com m'integro

function IntegrationSection() {
  return (
    <section className={`${SECTION_PX} py-section-s lg:py-section-m bg-surface-base border-t border-border-default`}>
      <Reveal>
        <SectionHeader caption="ZERO FRICCIÓ" title="Com m’integro" />
      </Reveal>
      <Reveal className="mt-16">
        <IntegrationCards />
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— Disponibilitat

function AvailabilitySection() {
  return (
    <section className={`${SECTION_PX} py-section-s lg:py-section-m bg-surface-base border-t border-border-default`}>
      <Reveal>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <span className="flex items-center gap-3">
            <span aria-hidden className={`h-3 w-3 rounded-full ${AVAILABILITY_DOT[AVAILABILITY]}`} />
            <span className="text-caption uppercase text-text-secondary">DISPONIBILITAT ACTUAL</span>
          </span>
          {/* Sense xifra a posta: un recompte exacte caduca sol i ningú l'actualitza.
              L'estat qualitatiu sempre és cert i es llegeix igual de bé. */}
          <p className="text-body-s md:text-body-m lg:text-body-l text-text-main">
            {AVAILABILITY_COPY[AVAILABILITY]}
          </p>
        </div>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— CTA final

function CollabCtaSection({ onConfigure }: { onConfigure: () => void }) {
  // Mateix patró que el CTA final de /serveis (Figma «Section CTA — Comencem»,
  // 24set26): eyebrow sense número, titular, botó sòlid, nota de la trucada i
  // la card pont a la dreta a desktop i a sota a tablet i mòbil.
  return (
    <section
      className={`${SECTION_PX} border-t border-border-default bg-surface-base pt-24 pb-32 lg:pb-48`}
    >
      <Reveal>
        <div className="flex flex-col gap-16 lg:flex-row lg:items-start">
          <div className="flex flex-1 flex-col gap-16">
            <p className="text-caption-eyebrow text-text-secondary">Comencem</p>

            <h2 className="text-display-xs md:text-display-s lg:text-display-l text-text-main">
              Necessites un perfil sènior a l’equip demà mateix?
            </h2>

            <div className="flex flex-col gap-8">
              {CONFIGURATOR_ENABLED ? (
                <>
                  <Button
                    variant="solid"
                    size="lg"
                    shape="pill"
                    className="self-start"
                    onClick={onConfigure}
                    iconRight={<ArrowRight size={20} weight="regular" aria-hidden />}
                  >
                    Configura la col·laboració
                  </Button>
                  <p className="text-body-xs-light md:text-body-s-light text-text-secondary">
                    Si ho prefereixes,{" "}
                    <a
                      href={COLLAB_CALENDAR_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 hover:text-text-main"
                    >
                      reserva una trucada de 20 min
                      <span className="sr-only"> (s’obre en una pestanya nova)</span>
                    </a>{" "}
                    i en parlem.
                  </p>
                </>
              ) : (
                // Configurador de tarifa tancat: la trucada passa a ser l'acció
                // principal i no es repeteix a la nota.
                <Button
                  as="a"
                  href={COLLAB_CALENDAR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="solid"
                  size="lg"
                  shape="pill"
                  className="self-start"
                  iconRight={<ArrowRight size={20} weight="regular" aria-hidden />}
                >
                  Reserva una trucada
                </Button>
              )}
            </div>
          </div>

          {/* Segona porta — pont cap a /serveis (client final amb projecte propi). */}
          <BridgeDoor
            eyebrow="Tens un projecte propi?"
            line="Webs, landings i auditories amb preu tancat."
            href="/serveis"
            cta="Mira els punts de partida"
          />
        </div>
      </Reveal>
    </section>
  );
}

export default function CollabView() {
  const [configOpen, setConfigOpen] = useState(false);
  return (
    <>
      <ValueSection />
      <RatesSection />
      <IntegrationSection />
      <AvailabilitySection />
      <CollabCtaSection onConfigure={() => setConfigOpen(true)} />
      {CONFIGURATOR_ENABLED && (
        <CollabConfiguratorModal isOpen={configOpen} onClose={() => setConfigOpen(false)} />
      )}
    </>
  );
}
