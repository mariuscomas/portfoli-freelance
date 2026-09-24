"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import ConfiguratorModal from "@/components/services/ConfiguratorModal";
import ProcessSection from "@/components/services/ProcessSection";
import { CONFIGURATOR_ENABLED } from "@/lib/flags";
import { useContactModal } from "@/context/ContactModalContext";
import SpokeHero from "@/components/services/SpokeHero";
import Button from "@/components/ui/Button";
import {
  calcConfiguration,
  EXTRAS,
  RECURRENTS,
  PRODUCT_CALL_URL,
  DISCIPLINE_ORDER,
  type Discipline,
  type Product,
} from "@/lib/pricing";
import { SITE_EMAIL } from "@/lib/site";

/* Marge lateral de pàgina. Llegeix la rampa `--page-margin`
   (402:24 · 768:48 · 1024:72 · 1440:96 · 1920:144), que mana des del
   21set26. Abans era "px-6 md:px-12 lg:px-16 xl:px-24" escrit a mà,
   que a lg donava 64 on la rampa en diu 72 i no tenia el graó de 144. */
const SECTION_PX = "px-page";
const CONTACT_EMAIL = SITE_EMAIL;

const formatPrice = (n: number) =>
  `${n.toLocaleString("ca-ES", { maximumFractionDigits: 0 })} €`;

const appliesLabel = (appliesTo: string[]) =>
  appliesTo.map((p) => (p === "web" ? "WEB" : p.toUpperCase())).join(" · ");

/** Preu "des de" d'una disciplina solta. Ho resol calcConfiguration: el
 *  tancament val diferent amb Dev (posada en producció) i sense (lliurament),
 *  i sumar-ho a mà aquí tornaria a divergir del configurador. */
const disciplinePriceFrom = (d: Discipline) =>
  calcConfiguration({ product: "landing", disciplines: [d] }).baseTotal;

const LANDING_EXTRAS = EXTRAS.filter((e) => e.appliesTo.includes("landing"));

// Descripcions d'abast (contingut editorial de la pàgina, no de preus).
const FOCUS_COPY: Record<Discipline, { title: string; description: string }> = {
  ux: {
    title: "Disseny UX",
    description: "Immersió, arquitectura d’informació i experiència a mida.",
  },
  ui: {
    title: "Disseny UI",
    description: "Sistema visual, interfície i detall píxel a píxel.",
  },
  dev: {
    title: "Desenvolupament",
    description: "Codi a mida, responsive, transicions i posada en producció.",
  },
};

// Superfície de cada card d'Abast (Figma surface/tint/*, fixes als dos modes).
// Sobre la sorra el text secundari no arriba a 4,5:1, i hi va el text principal.
const FOCUS_TINT: Record<Discipline, { bg: string; secondary: string }> = {
  ux: { bg: "bg-surface-tint-mist", secondary: "text-text-fixed-dark-secondary" },
  ui: { bg: "bg-surface-tint-sand", secondary: "text-text-fixed-dark" },
  dev: { bg: "bg-surface-tint-pistachio", secondary: "text-text-fixed-dark-secondary" },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "Qui aporta els continguts?",
    a: "Els textos, el logo i les imatges els aportes tu. Si no els tens, la redacció és un extra.",
  },
  {
    q: "Puc contractar només una fase?",
    a: "Sí. Tries l’abast: UX, UI, desenvolupament o tot de principi a fi.",
  },
  {
    q: "Puc afegir més pàgines?",
    a: "Una landing és una sola pàgina llarga; si en necessites més pàgines, el que et cal és una web.",
  },
  {
    q: "Quant triga?",
    a: "Depèn de l’abast; ho concretem a la proposta amb dates tancades, sense sorpreses.",
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
      <h2 className="text-display-s-medium md:text-display-m-medium lg:text-display-l-medium text-text-main">{title}</h2>
    </div>
  );
}

// ————————————————————————————————— 01 · Què inclou

function IncludesSection({ includes }: { includes: string[] }) {
  return (
    <section id="que-inclou" className={`${SECTION_PX} pt-20 pb-20 bg-surface-base`}>
      <Reveal>
        <SectionHeader caption="01 · QUÈ INCLOU" title="Tot el que entra a la base" />
      </Reveal>
      <Reveal className="mt-14">
        <ul>
          {includes.map((item, i) => (
            <li
              key={item}
              className="flex items-baseline gap-6 border-t border-border-subtle py-5 md:gap-10"
            >
              <span className="text-caption uppercase tabular-nums text-text-secondary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-body-l lg:text-body-xl text-text-main">{item}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— 02 · Abast (focus)

function FocusSection() {
  // Figma: Exploracio · Abast — Disciplines (desktop 12343:100322, iPad
  // 12353:109085, mòbil 12353:109451). Mòbil: cards apilades a tot l'ample;
  // md: tres cards en fila a tot l'ample; xl: capçal a 1/3 i cards a 2/3.
  return (
    <section className="border-t border-border-default bg-surface-base xl:grid xl:grid-cols-3">
      <Reveal className="flex flex-col gap-8 px-page py-section-xs md:py-section-s xl:justify-end xl:gap-6 xl:py-section-m">
        <span className="text-caption uppercase text-text-secondary">02 · ABAST</span>
        <div className="flex flex-col gap-4 xl:gap-8">
          <h2 className="text-display-s-medium md:text-display-m-medium xl:text-display-l-medium text-text-main">
            Tria fins on arribem
          </h2>
          <p className="text-body-s md:max-w-xl md:text-body-l xl:max-w-none xl:text-body-s-light text-text-secondary">
            El projecte sencer o una fase solta. Contracta les tres disciplines, o només la que
            necessites.
          </p>
        </div>
      </Reveal>
      <Reveal className="grid grid-cols-1 md:grid-cols-3 xl:col-span-2 xl:gap-6 xl:py-section-m xl:pl-6 xl:pr-page">
        {DISCIPLINE_ORDER.map((d) => {
          const tint = FOCUS_TINT[d];
          return (
            <article
              key={d}
              className={`flex flex-col gap-8 px-12 py-section-xs md:p-8 xl:aspect-[3/4] ${tint.bg}`}
            >
              <div className="flex flex-1 flex-col gap-4">
                <h3 className="text-display-2xs-medium xl:text-display-xs-medium text-text-fixed-dark">
                  {FOCUS_COPY[d].title}
                </h3>
                <p className={`text-body-s xl:text-body-l ${tint.secondary}`}>{FOCUS_COPY[d].description}</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className={`text-caption uppercase ${tint.secondary}`}>DES DE</span>
                <span className="text-display-xs-medium text-text-fixed-dark">
                  {formatPrice(disciplinePriceFrom(d))}
                </span>
              </div>
            </article>
          );
        })}
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— 03 · Extres

function ExtrasSection() {
  return (
    <section className={`${SECTION_PX} py-20 bg-surface-base border-t border-border-subtle`}>
      <Reveal>
        <SectionHeader caption="03 · EXTRES" title="Fes-la teva" />
      </Reveal>
      <Reveal className="mt-14">
        <ul>
          {LANDING_EXTRAS.map((extra) => (
            <li
              key={extra.id}
              className="flex flex-col gap-2 border-b border-border-subtle py-6 md:flex-row md:items-center md:gap-8"
            >
              <span className="flex-1 text-body-l lg:text-body-xl text-text-main">{extra.label}</span>
              <span className="text-caption uppercase text-text-secondary md:w-44">
                {appliesLabel(extra.appliesTo)}
              </span>
              <span className="text-body-l lg:text-body-xl text-text-main md:w-44 md:text-right">
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
        <h2 className="max-w-3xl text-display-xs md:text-display-s lg:text-display-l text-text-main">
          {CONFIGURATOR_ENABLED
            ? "Configura la teva landing en dos minuts i rep el pressupost al moment."
            : "Explica’m el projecte i et torno una proposta amb el preu tancat."}
        </h2>
        <div className="mt-10 flex flex-col gap-4">
          <Button
            variant="solid"
            size="lg"
            className="self-start"
            onClick={onConfigure}
          >
            {CONFIGURATOR_ENABLED ? "Configura la teva landing" : "Demana pressupost"}
          </Button>
          <p className="text-body-xs-light md:text-body-s-light text-text-secondary">
            O{" "}
            <a
              href={PRODUCT_CALL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-text-main"
            >
              reserva 20 minuts
              <span className="sr-only"> (s’obre en una pestanya nova)</span>
            </a>{" "}
            i en parlem.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— 05 · FAQ

function FaqSection() {
  return (
    <section className={`${SECTION_PX} py-20 bg-surface-base border-t border-border-subtle`}>
      <Reveal>
        <SectionHeader caption="05 · PREGUNTES" title="Dubtes freqüents" />
      </Reveal>
      <Reveal className="mt-14">
        <dl>
          {FAQ.map(({ q, a }) => (
            <div
              key={q}
              className="flex flex-col gap-3 border-t border-border-subtle py-6 md:flex-row md:gap-12"
            >
              <dt className="text-body-l lg:text-body-xl text-text-main md:w-2/5">{q}</dt>
              <dd className="flex-1 text-body-l lg:text-body-xl text-text-secondary">{a}</dd>
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
        <SectionHeader caption="06 · DESPRÉS DEL LLANÇAMENT" title="Recurrents, sempre a part" />
      </Reveal>
      <Reveal className="mt-14">
        <ul>
          {RECURRENTS.map((r) => (
            <li
              key={r.label}
              className="flex items-center justify-between gap-8 border-b border-border-subtle py-6"
            >
              <span className="text-body-l lg:text-body-xl text-text-main">{r.label}</span>
              <span className="text-body-l lg:text-body-xl text-text-main">{r.price}</span>
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
        <h2 className="max-w-3xl text-display-xs md:text-display-s lg:text-display-l text-text-main">Comencem la teva landing?</h2>
        <div className="mt-10 flex flex-col gap-4">
          <Button
            variant="solid"
            size="lg"
            className="self-start"
            onClick={onConfigure}
          >
            {CONFIGURATOR_ENABLED ? "Configura la teva landing" : "Demana pressupost"}
          </Button>
          <p className="text-body-xs-light md:text-body-s-light text-text-secondary">
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

export default function LandingSpokeView({ product }: { product: Product }) {
  // Configurador full-screen (cortina). Mantenim el producte seleccionat
  // en tancar perquè l'animació de sortida no es talli. Aquí és sempre "landing".
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
        eyebrow="SERVEIS · LANDING"
        headline={
          <>
            {"Una landing que converteix, "}
            <br className="hidden lg:block" />
            {"dissenyada i desenvolupada de principi a fi."}
          </>
        }
        subhead={
          <>
            {"Una sola pàgina pensada per convertir: missatge, disseny "}
            <br className="hidden lg:block" />
            {"i desenvolupament a mida fins a producció. Preu tancat, sense sorpreses."}
          </>
        }
        price={formatPrice(product.price)}
        scopeNote="Projecte complet · o per fases (UX · UI · Dev)"
        scrollCta={{ href: "#que-inclou", label: "Mira què inclou" }}
        showControls
        ctaLabel={CONFIGURATOR_ENABLED ? "Configura la teva landing" : "Demana pressupost"}
        onCta={openConfigurator}
      />
      <IncludesSection includes={product.includes} />
      <FocusSection />
      <ExtrasSection />
      <ConfiguratorTeaser onConfigure={openConfigurator} />
      <ProcessSection caption="04 · COM TREBALLO" title="De la idea a producció" reveal={Reveal} />
      <FaqSection />
      <RecurrentsSection />
      <FinalCtaSection onConfigure={openConfigurator} />

      {CONFIGURATOR_ENABLED && (
          <ConfiguratorModal
            isOpen={configOpen}
            onClose={() => setConfigOpen(false)}
            productId="landing"
          />
        )}
    </>
  );
}
