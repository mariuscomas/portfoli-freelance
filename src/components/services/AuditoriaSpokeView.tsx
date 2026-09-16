"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import ConfiguratorModal from "@/components/services/ConfiguratorModal";
import { CONFIGURATOR_ENABLED } from "@/lib/flags";
import { useContactModal } from "@/context/ContactModalContext";
import SpokeHero from "@/components/services/SpokeHero";
import {
  AUDIT_FOCUSES,
  AUDIT_SIZES,
  AUDIT_EXTRAS,
  AUDIT_BASE_INCLUDES,
  AUDIT_BASE_BY_COUNT,
  PRODUCT_CALL_URL,
  type AuditFocus,
} from "@/lib/pricing";

const SECTION_PX = "px-6 md:px-12 lg:px-16 xl:px-24";
const CONTACT_EMAIL = "mariuscr23@gmail.com";

const formatPrice = (n: number) =>
  `${n.toLocaleString("ca-ES", { maximumFractionDigits: 0 })} €`;

/** Preu terra: la configuració mínima és 1 focus. Font: AUDIT_BASE_BY_COUNT. */
const MIN_PRICE = AUDIT_BASE_BY_COUNT[1];

/** Frase de preus per nombre de focus (1/2/3), derivada del catàleg. */
const FOCUS_COUNT_PRICING = `1 focus ${formatPrice(AUDIT_BASE_BY_COUNT[1])}, 2 focus ${formatPrice(
  AUDIT_BASE_BY_COUNT[2],
)}, 3 focus ${formatPrice(AUDIT_BASE_BY_COUNT[3])}`;

// Descripcions editorials del focus (contingut de la pàgina, no del càlcul).
const FOCUS_COPY: Record<AuditFocus, { name: string; description: string; tag: string }> = {
  ux: {
    name: "Experiència",
    description: "Fluxos, arquitectura d'informació i punts de fricció.",
    tag: "Fluxos · Usabilitat",
  },
  ui: {
    name: "Interfície",
    description: "Jerarquia visual, consistència i sistema de disseny.",
    tag: "Visual · Consistència",
  },
  dev: {
    name: "Implementació",
    description: "Rendiment, responsive i accessibilitat WCAG.",
    tag: "Rendiment · Accessibilitat",
  },
};

// Procés específic de l'auditoria (no és el PROCESS_STEPS de web/landing).
const AUDIT_PROCESS = [
  { num: "01", title: "Accés", text: "Em dónes accés al producte o prototip i el context." },
  { num: "02", title: "Revisió", text: "Revisió heurística de UI, UX i conversió." },
  { num: "03", title: "Informe", text: "Informe prioritzat amb quick wins i millores estructurals." },
  { num: "04", title: "Sessió", text: "Sessió de retorn de 90 min i roadmap accionable." },
] as const;

const FAQ: { q: string; a: string }[] = [
  {
    q: "Què necessites de mi?",
    a: "Només accés al producte o prototip i una mica de context sobre els objectius.",
  },
  {
    q: "Puc triar només un focus?",
    a: "Sí. Tries un focus, dos o els tres; el preu s'ajusta (600 / 900 / 1.100 €).",
  },
  {
    q: "Com és el descompte?",
    a: "Si fem el projecte en 3 mesos, l'import de l'auditoria es descompta íntegre.",
  },
  {
    q: "Quant triga?",
    a: "Segons la talla; d'uns dies a un parell de setmanes, amb dates tancades.",
  },
  {
    q: "I si no vull seguir?",
    a: "L'auditoria val per si sola: t'enduus l'informe i el roadmap, sense cap compromís.",
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

// ————————————————————————————————— 01 · Què t'enduus

function IncludesSection() {
  return (
    <section id="que-inclou" className={`${SECTION_PX} pt-20 pb-20 bg-surface-base`}>
      <Reveal>
        <SectionHeader caption="01 · QUÈ INCLOU" title="Què t'enduus" />
      </Reveal>
      <Reveal className="mt-8">
        <div className="flex flex-col gap-1.5">
          <span className="text-caption uppercase text-text-secondary">DES DE</span>
          <span className="text-display-h5 text-text-main">{formatPrice(MIN_PRICE)}</span>
          <span className="text-caption text-text-secondary">
            Es descompta íntegra si fem el projecte en 3 mesos.
          </span>
        </div>
      </Reveal>
      <Reveal className="mt-14">
        <ul>
          {AUDIT_BASE_INCLUDES.map((item, i) => (
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
          Per auditar només necessito accés al teu producte o prototip.
        </p>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— 02 · Focus

function FocusSection() {
  return (
    <section className={`${SECTION_PX} py-20 bg-surface-base border-t border-border-subtle`}>
      <Reveal>
        <SectionHeader caption="02 · FOCUS" title="Tria on miro" />
      </Reveal>
      <Reveal className="mt-8">
        <p className="max-w-2xl text-body-lg text-text-secondary">
          Un focus, dos o els tres. El preu s&apos;ajusta segons quants en triïs: {FOCUS_COUNT_PRICING}.
        </p>
      </Reveal>
      <Reveal className="mt-14">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {AUDIT_FOCUSES.map((f) => (
            <article
              key={f.id}
              className="flex flex-col gap-4 rounded-card border border-border-subtle bg-surface-card p-8 lg:p-10"
            >
              <span className="text-caption uppercase text-text-secondary">{f.id.toUpperCase()}</span>
              <h3 className="text-heading-h3 text-text-main">{FOCUS_COPY[f.id].name}</h3>
              <p className="text-body-sm text-text-secondary">{FOCUS_COPY[f.id].description}</p>
              <div className="mt-auto pt-4">
                <span className="text-caption uppercase text-text-secondary">
                  {FOCUS_COPY[f.id].tag}
                </span>
              </div>
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— 03 · Talla

function SizesSection() {
  return (
    <section className={`${SECTION_PX} py-20 bg-surface-base border-t border-border-subtle`}>
      <Reveal>
        <SectionHeader caption="03 · TALLA" title="Tria la profunditat" />
      </Reveal>
      <Reveal className="mt-14">
        <ul>
          {AUDIT_SIZES.map((s) => (
            <li
              key={s.id}
              className="flex flex-col gap-2 border-b border-border-subtle py-6 md:flex-row md:items-center md:gap-8"
            >
              <span className="flex-1 text-body-lg text-text-main">{s.label}</span>
              <span className="text-caption uppercase text-text-secondary md:w-56">{s.range}</span>
              <span className="text-body-lg text-text-secondary md:w-44 md:text-right">
                {s.increment === 0 ? "inclosa" : `+${formatPrice(s.increment)}`}
              </span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— 04 · Extres

function ExtrasSection() {
  return (
    <section className={`${SECTION_PX} py-20 bg-surface-base border-t border-border-subtle`}>
      <Reveal>
        <SectionHeader caption="04 · EXTRES" title="Aprofundeix-hi" />
      </Reveal>
      <Reveal className="mt-14">
        <ul>
          {AUDIT_EXTRAS.map((extra) => (
            <li
              key={extra.id}
              className="flex flex-col gap-2 border-b border-border-subtle py-6 md:flex-row md:items-center md:gap-8"
            >
              <span className="flex-1 text-body-lg text-text-main">{extra.label}</span>
              <span className="text-body-lg text-text-secondary md:w-44 md:text-right">
                {`+${formatPrice(extra.price)}`}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-caption text-text-secondary">
          Cada extra s&apos;afegeix al focus triat, i tot es descompta si fem el projecte.
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
            ? "Configura la teva auditoria en dos minuts i rep el pressupost al moment."
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

// ————————————————————————————————— 05 · Procés

function ProcessSection() {
  return (
    <section className={`${SECTION_PX} py-20 bg-surface-base border-t border-border-subtle`}>
      <Reveal>
        <SectionHeader caption="05 · COM FUNCIONA" title="Com funciona" />
      </Reveal>
      <Reveal className="mt-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIT_PROCESS.map((step) => (
            <div key={step.num} className="flex flex-col gap-3 border-t border-border-subtle pt-6">
              <span className="text-caption text-text-secondary">{step.num}</span>
              <h3 className="text-heading-h3 text-text-main">{step.title}</h3>
              <p className="text-body-sm text-text-secondary">{step.text}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— 06 · FAQ

function FaqSection() {
  return (
    <section className={`${SECTION_PX} py-20 bg-surface-base border-t border-border-subtle`}>
      <Reveal>
        <SectionHeader caption="06 · PREGUNTES" title="Dubtes freqüents" />
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

// ————————————————————————————————— CTA final

function FinalCtaSection({ onConfigure }: { onConfigure: () => void }) {
  return (
    <section className={`${SECTION_PX} py-24 bg-surface-base border-t border-border-subtle`}>
      <Reveal>
        <h2 className="max-w-3xl text-display-h3 text-text-main">Comencem amb una auditoria?</h2>
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

export default function AuditoriaSpokeView() {
  // Configurador full-screen (cortina). Mantenim el producte seleccionat
  // en tancar perquè l'animació de sortida no es talli. Aquí és sempre "auditoria".
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
        eyebrow="SERVEIS · AUDITORIA UI/UX"
        headline={
          <>
            {"Sabràs exactament què falla "}
            <br className="hidden lg:block" />
            {"i què arreglar primer."}
          </>
        }
        subhead={
          <>
            {"Revisió experta de la teva UI, UX i conversió, amb informe prioritzat "}
            <br className="hidden lg:block" />
            {"i pla d'acció. I si fem el projecte en 3 mesos, te la descomptes íntegra."}
          </>
        }
        price={formatPrice(MIN_PRICE)}
        scopeNote="Es descompta íntegra si fem el projecte en 3 mesos"
        ctaLabel="Demana la teva auditoria"
        onCta={openConfigurator}
      />
      <IncludesSection />
      <FocusSection />
      <SizesSection />
      <ExtrasSection />
      <ConfiguratorTeaser onConfigure={openConfigurator} />
      <ProcessSection />
      <FaqSection />
      <FinalCtaSection onConfigure={openConfigurator} />

      {CONFIGURATOR_ENABLED && (
          <ConfiguratorModal
            isOpen={configOpen}
            onClose={() => setConfigOpen(false)}
            productId="auditoria"
          />
        )}
    </>
  );
}
