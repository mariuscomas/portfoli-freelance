"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import ConfiguratorModal from "@/components/services/ConfiguratorModal";
import { CONFIGURATOR_ENABLED } from "@/lib/flags";
import { useContactModal } from "@/context/ContactModalContext";
import SpokeHero from "@/components/services/SpokeHero";
import {
  PRODUCTS,
  EXTRAS,
  RECURRENTS,
  PROCESS_STEPS,
  CONDITIONS,
  PRODUCT_CALL_URL,
  DISCIPLINE_ORDER,
  DISCIPLINES,
  PRICING_WEB,
  type Discipline,
} from "@/lib/pricing";

const SECTION_PX = "px-6 md:px-12 lg:px-16 xl:px-24";
const CONTACT_EMAIL = "mariuscr23@gmail.com";

const formatPrice = (n: number) =>
  `${n.toLocaleString("ca-ES", { maximumFractionDigits: 0 })} €`;

const appliesLabel = (appliesTo: string[]) =>
  appliesTo.map((p) => (p === "web" ? "WEB" : p.toUpperCase())).join(" · ");

/** Preu "des de" d'una disciplina solta: Immersió + disciplina + tancament. */
const disciplinePriceFrom = (d: Discipline) =>
  PRICING_WEB.immersio + PRICING_WEB.disciplinePrice[d] + PRICING_WEB.tancament;

const WEB_INCLUDES = PRODUCTS.find((p) => p.id === "web")!.includes;

const WEB_EXTRAS = EXTRAS.filter((e) => e.appliesTo.includes("web"));

// Descripcions d'abast (contingut editorial de la pàgina, no de preus).
const FOCUS_COPY: Record<Discipline, { title: string; description: string }> = {
  ux: {
    title: "Disseny UX",
    description: "Immersió, arquitectura d'informació i experiència a mida.",
  },
  ui: {
    title: "Disseny UI",
    description: "Sistema visual, interfície i detall pixel a pixel.",
  },
  dev: {
    title: "Desenvolupament",
    description: "Codi a mida, responsive, transicions i posada en producció.",
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "Qui aporta els continguts?",
    a: "Els textos, el logo i les imatges els aportes tu. Si no els tens, la redacció és un extra.",
  },
  {
    q: "Puc contractar només una fase?",
    a: "Sí. Tries l'abast: UX, UI, desenvolupament o tot de principi a fi.",
  },
  {
    q: "Què passa si necessito més pàgines?",
    a: "Cada pàgina extra són +200 €, i va desglossada al pressupost abans de tancar-lo.",
  },
  {
    q: "Quant triga?",
    a: "Depèn de l'abast; ho concretem a la proposta amb dates tancades, sense sorpreses.",
  },
  {
    q: "I el manteniment després?",
    a: "Allotjament, domini i evolutius van sempre a part del total del projecte.",
  },
];

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
      <h2 className="text-heading-h1 text-text-main">{title}</h2>
    </div>
  );
}

// ————————————————————————————————— 01 · Què inclou

function IncludesSection() {
  return (
    <section id="que-inclou" className={`${SECTION_PX} pt-20 pb-20 bg-surface-base`}>
      <Reveal>
        <SectionHeader caption="01 — QUÈ INCLOU" title="Tot el que entra a la base" />
      </Reveal>
      <Reveal className="mt-14">
        <ul>
          {WEB_INCLUDES.map((item, i) => (
            <li
              key={item}
              className="flex items-baseline gap-6 border-t border-border-subtle py-5 md:gap-10"
            >
              <span className="text-caption uppercase tabular-nums text-text-secondary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-body-lg text-text-main">{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-caption text-text-secondary">
          Els textos, el logo i les imatges els aportes tu. Si no els tens, la redacció és un extra.
        </p>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— 02 · Abast (focus)

function FocusSection() {
  return (
    <section className={`${SECTION_PX} py-20 bg-surface-base border-t border-border-subtle`}>
      <Reveal>
        <SectionHeader caption="02 — ABAST" title="Tria fins on arribo" />
      </Reveal>
      <Reveal className="mt-8">
        <p className="max-w-2xl text-body-lg text-text-secondary">
          El projecte sencer o una fase solta. Contracta les tres disciplines de principi a fi, o
          només la que necessites.
        </p>
      </Reveal>
      <Reveal className="mt-14">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {DISCIPLINE_ORDER.map((d) => (
            <article
              key={d}
              className="flex flex-col gap-4 rounded-card border border-border-subtle bg-surface-card p-8 lg:p-10"
            >
              <span className="text-caption uppercase text-text-secondary">
                {DISCIPLINES[d].shortLabel}
              </span>
              <h3 className="text-heading-h3 text-text-main">{FOCUS_COPY[d].title}</h3>
              <p className="text-body-sm text-text-secondary">{FOCUS_COPY[d].description}</p>
              <div className="mt-auto flex flex-col gap-1.5 pt-4">
                <span className="text-caption uppercase text-text-secondary">DES DE</span>
                <span className="text-display-h5 text-text-main">
                  {formatPrice(disciplinePriceFrom(d))}
                </span>
              </div>
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— 03 · Extres

function ExtrasSection() {
  return (
    <section className={`${SECTION_PX} py-20 bg-surface-base border-t border-border-subtle`}>
      <Reveal>
        <SectionHeader caption="03 — EXTRES" title="Fes-la teva" />
      </Reveal>
      <Reveal className="mt-14">
        <ul>
          {WEB_EXTRAS.map((extra) => (
            <li
              key={extra.id}
              className="flex flex-col gap-2 border-b border-border-subtle py-6 md:flex-row md:items-center md:gap-8"
            >
              <span className="flex-1 text-body-lg text-text-main">{extra.label}</span>
              <span className="text-caption uppercase text-text-secondary md:w-44">
                {appliesLabel(extra.appliesTo)}
              </span>
              <span className="text-body-lg text-text-secondary md:w-44 md:text-right">
                {extra.price === null
                  ? "a pressupostar"
                  : `+${extra.price} €${extra.unit ? `/${extra.unit}` : ""}`}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-caption text-text-secondary">
          Cada extra queda desglossat al pressupost, amb el seu import.
        </p>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— Configurador (banda fosca)

function ConfiguratorTeaser({ onConfigure }: { onConfigure: () => void }) {
  // Banda fosca: mode Dark local (tokens normals s'inverteixen) — patró DS.
  return (
    <section className={`dark ${SECTION_PX} py-24 bg-surface-base`}>
      <Reveal>
        <h2 className="max-w-3xl text-display-h3 text-text-main">
          {CONFIGURATOR_ENABLED
            ? "Configura la teva web en dos minuts i rep el pressupost al moment."
            : "Explica'm el projecte i et torno una proposta amb el preu tancat."}
        </h2>
        <div className="mt-10 flex flex-col gap-4">
          <button
            type="button"
            onClick={onConfigure}
            className="group inline-flex min-h-11 items-center gap-2 self-start text-heading-h3 text-text-main underline underline-offset-8 decoration-1 hover:decoration-2"
          >
            {CONFIGURATOR_ENABLED ? "Obre el configurador" : "Demana pressupost"}
            <ArrowRight size={22} className="transition-transform group-hover:translate-x-1" aria-hidden />
          </button>
          <p className="text-body-sm text-text-secondary">
            O{" "}
            <a
              href={PRODUCT_CALL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-text-main"
            >
              reserva 15 minuts
              <span className="sr-only"> (s’obre en una pestanya nova)</span>
            </a>{" "}
            i en parlem, sense compromís.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— 04 · Procés + condicions

function ProcessSection() {
  return (
    <section className={`${SECTION_PX} py-20 bg-surface-base border-t border-border-subtle`}>
      <Reveal>
        <SectionHeader caption="04 — COM TREBALLO" title="De la idea a producció" />
      </Reveal>
      <Reveal className="mt-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEPS.map((step) => (
            <div key={step.num} className="flex flex-col gap-3 border-t border-border-subtle pt-6">
              <span className="text-caption text-text-secondary">{step.num}</span>
              <h3 className="text-heading-h3 text-text-main">{step.title}</h3>
              <p className="text-body-sm text-text-secondary">{step.text}</p>
            </div>
          ))}
        </div>
        <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3">
          {CONDITIONS.map((c) => (
            <li key={c} className="text-caption uppercase text-text-secondary">
              {c}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— 05 · FAQ

function FaqSection() {
  return (
    <section className={`${SECTION_PX} py-20 bg-surface-base border-t border-border-subtle`}>
      <Reveal>
        <SectionHeader caption="05 — PREGUNTES" title="Dubtes freqüents" />
      </Reveal>
      <Reveal className="mt-14">
        <dl>
          {FAQ.map(({ q, a }) => (
            <div
              key={q}
              className="flex flex-col gap-3 border-t border-border-subtle py-6 md:flex-row md:gap-12"
            >
              <dt className="text-body-lg text-text-main md:w-2/5">{q}</dt>
              <dd className="flex-1 text-body-lg text-text-secondary">{a}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— 06 · Recurrents

function RecurrentsSection() {
  return (
    <section className={`${SECTION_PX} py-20 bg-surface-base border-t border-border-subtle`}>
      <Reveal>
        <SectionHeader caption="06 — DESPRÉS DEL LLANÇAMENT" title="Recurrents, sempre a part" />
      </Reveal>
      <Reveal className="mt-14">
        <ul>
          {RECURRENTS.map((r) => (
            <li
              key={r.label}
              className="flex items-center justify-between gap-8 border-b border-border-subtle py-6"
            >
              <span className="text-body-lg text-text-main">{r.label}</span>
              <span className="text-body-lg text-text-secondary">{r.price}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— CTA final

function FinalCtaSection({ onConfigure }: { onConfigure: () => void }) {
  return (
    <section className={`${SECTION_PX} py-24 bg-surface-base border-t border-border-subtle`}>
      <Reveal>
        <h2 className="max-w-3xl text-display-h3 text-text-main">Comencem la teva web?</h2>
        <div className="mt-10 flex flex-col gap-4">
          <button
            type="button"
            onClick={onConfigure}
            className="group inline-flex min-h-11 items-center gap-2 self-start text-heading-h3 text-text-main underline underline-offset-8 decoration-1 hover:decoration-2"
          >
            {CONFIGURATOR_ENABLED ? "Obre el configurador" : "Demana pressupost"}
            <ArrowRight size={22} className="transition-transform group-hover:translate-x-1" aria-hidden />
          </button>
          <p className="text-body-sm text-text-secondary">
            O escriu-me directament:{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline underline-offset-4 hover:text-text-main"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>
      </Reveal>
    </section>
  );
}

export default function WebSpokeView() {
  // Configurador full-screen (cortina). Mantenim el producte seleccionat
  // en tancar perquè l'animació de sortida no es talli. Aquí és sempre "web".
  const [configOpen, setConfigOpen] = useState(false);
  const contact = useContactModal();
  const openConfigurator = () => {
    // Configurador tancat per al llançament: el CTA obre el contacte.
    if (!CONFIGURATOR_ENABLED) {
      contact.open();
      return;
    }
    setConfigOpen(true);
  };

  return (
    <>
      <SpokeHero
        eyebrow="SERVEIS — WEB A MIDA"
        headline={
          <>
            {"La teva web, dissenyada i "}
            <br className="hidden lg:block" />
            {"desenvolupada de principi a fi."}
          </>
        }
        subhead={
          <>
            {"Un sol interlocutor per a tot el procés: estratègia, disseny UX/UI "}
            <br className="hidden lg:block" />
            {"i desenvolupament a mida fins a producció. Preu tancat, sense sorpreses."}
          </>
        }
        price={formatPrice(PRODUCTS.find((p) => p.id === "web")!.price)}
        scopeNote="Projecte complet · o per fases (UX · UI · Dev)"
        ctaLabel={CONFIGURATOR_ENABLED ? "Configura la teva web" : "Demana pressupost"}
        onCta={openConfigurator}
      />
      <IncludesSection />
      <FocusSection />
      <ExtrasSection />
      <ConfiguratorTeaser onConfigure={openConfigurator} />
      <ProcessSection />
      <FaqSection />
      <RecurrentsSection />
      <FinalCtaSection onConfigure={openConfigurator} />

      {CONFIGURATOR_ENABLED && (
          <ConfiguratorModal
            isOpen={configOpen}
            onClose={() => setConfigOpen(false)}
            productId="web"
          />
        )}
    </>
  );
}
