"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import Button from "@/components/ui/Button";
import CollabConfiguratorModal from "./CollabConfiguratorModal";
import { CONFIGURATOR_ENABLED } from "@/lib/flags";
import BridgeDoor from "@/components/services/BridgeDoor";
import {
  COLLAB_RATES,
  COLLAB_MODIFIERS,
  COLLAB_INTEGRATION,
  COLLAB_CALENDAR_URL,
} from "@/lib/pricing";
import { SITE_EMAIL } from "@/lib/site";
import { COLLAB_CLIENT_LOGOS } from "@/lib/clients";
import { AVAILABILITY, AVAILABILITY_COPY, AVAILABILITY_DOT } from "@/lib/availability";

const SECTION_PX = "px-6 md:px-12 lg:px-16 xl:px-24";
const CONTACT_EMAIL = SITE_EMAIL;

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

function ValueSection() {
  return (
    <section id="colaboracio" className={`${SECTION_PX} pt-20 pb-10 bg-surface-base`}>
      <Reveal>
        <span className="text-caption uppercase text-text-secondary">
          COL·LABORACIÓ AMB AGÈNCIES I ESTUDIS
        </span>
        <h2 className="mt-6 max-w-4xl text-display-xs md:text-display-s lg:text-display-l text-text-main">
          Un perfil sènior que dissenya i entén el codi, integrat al teu equip en 48 hores.
        </h2>
        <p className="mt-8 max-w-2xl text-body-s md:text-body-m lg:text-body-l text-text-secondary">
          Disseny UX/UI de producte per a equips que necessiten múscul sènior sense passar per una
          contractació. Hi he treballat per a:
        </p>
        {/* Prova social amb logotips (Figma). Igualats per alçada de caixa
            alta, com a la home: fixem `height` i deixem l'amplada automàtica
            perquè no es puguin deformar. A mòbil fan wrap. */}
        <ul className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-6 sm:gap-x-12">
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
    <section className={`${SECTION_PX} py-20 bg-surface-base border-t border-border-subtle`}>
      <Reveal>
        <SectionHeader caption="EL DESCOMPTE ES GUANYA AMB COMPROMÍS" title="Tarifes per durada" />
      </Reveal>
      <Reveal className="mt-14">
        <ul>
          {COLLAB_RATES.map((r) => (
            <li
              key={r.modality}
              className="flex flex-col gap-2 border-b border-border-subtle py-7 md:flex-row md:items-center md:gap-8"
            >
              <span className="flex-1 text-body-l lg:text-body-xl text-text-main">{r.modality}</span>
              <span className="flex-1 text-body-xs-light md:text-body-s-light text-text-secondary">{r.detail}</span>
              <span className="text-body-s-semibold md:text-body-l-semibold lg:text-display-xs text-text-main md:w-44 md:text-right">{r.rate}</span>
            </li>
          ))}
        </ul>
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
    <section className={`${SECTION_PX} py-20 bg-surface-base border-t border-border-subtle`}>
      <Reveal>
        <SectionHeader caption="ZERO FRICCIÓ" title="Com m'integro" />
      </Reveal>
      <Reveal className="mt-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {COLLAB_INTEGRATION.map((item) => (
            <div key={item.title} className="flex flex-col gap-3 border-t border-border-subtle pt-6">
              <h3 className="text-display-2xs-medium lg:text-display-xs-medium text-text-main">{item.title}</h3>
              <p className="text-body-xs-light md:text-body-s-light text-text-secondary">{item.text}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— Disponibilitat

function AvailabilitySection() {
  return (
    <section className={`${SECTION_PX} py-16 bg-surface-base border-t border-border-subtle`}>
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
  return (
    <section className={`${SECTION_PX} py-24 bg-surface-base border-t border-border-subtle`}>
      <Reveal>
        <div className="flex flex-col gap-12 md:gap-16">
          <p className="text-caption-eyebrow text-text-secondary">05 · Comencem</p>

          <h2 className="max-w-3xl text-display-xs md:text-display-s lg:text-display-l text-text-main">
            Necessites un perfil sènior a l’equip demà mateix?
          </h2>

          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              {CONFIGURATOR_ENABLED ? (
                <>
                  <Button
                    variant="solid"
                    size="xl"
                    onClick={onConfigure}
                    iconRight={<ArrowRight aria-hidden />}
                    className="self-start"
                  >
                    Configura la col·laboració
                  </Button>
                  <a
                    href={COLLAB_CALENDAR_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body-s md:text-body-m lg:text-body-l text-text-secondary underline underline-offset-4 hover:text-text-main"
                  >
                    O reserva una trucada
                    <span className="sr-only"> (s’obre en una pestanya nova)</span>
                  </a>
                </>
              ) : (
                // Configurador de tarifa tancat: la trucada passa a ser l'acció
                // principal i no es repeteix com a enllaç secundari.
                <Button
                  as="a"
                  href={COLLAB_CALENDAR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="solid"
                  size="xl"
                  iconRight={<ArrowRight aria-hidden />}
                  className="self-start"
                >
                  Reserva una trucada
                </Button>
              )}
            </div>
            <p className="text-body-xs-light md:text-body-s-light text-text-secondary">
              O escriu-me directament:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-4 hover:text-text-main">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>

          {/* Segona porta — pont cap a serveis (client final amb producte propi) */}
          <BridgeDoor
            eyebrow="Tens un producte propi entre mans?"
            line="T’acompanyo d’inici a fi, de l’estratègia a producció."
            href="/serveis"
            cta="Mira com treballo end-to-end"
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
