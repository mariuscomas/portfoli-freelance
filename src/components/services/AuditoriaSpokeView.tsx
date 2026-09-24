"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import ConfiguratorModal from "@/components/services/ConfiguratorModal";
import { CONFIGURATOR_ENABLED } from "@/lib/flags";
import { useContactModal } from "@/context/ContactModalContext";
import {
  FocusSection,
  IncludesSection,
  ProductSpokeHero,
  type FocusCard,
  type SpokeHeroCopy,
  type SpokeHeroScope,
} from "@/components/services/WebSpokeView";
import Button from "@/components/ui/Button";
import {
  AUDIT_SIZES,
  AUDIT_EXTRAS,
  AUDIT_BASE_INCLUDES,
  AUDIT_BASE_BY_COUNT,
  PRODUCT_CALL_URL,
  PRODUCTS,
  type AuditFocus,
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

/**
 * Preus del hero i de la secció 01.
 *
 * Criteri unificat el 16set26: el hero d'un spoke mostra la configuració
 * COMPLETA, com fan web (2.400) i landing (1.440) amb `product.price`. Abans
 * l'auditoria ensenyava el terra d'1 focus i el visitant que venia del hub
 * (1.100 € amb els tres chips) veia baixar el preu en canviar de pàgina.
 *
 * El terra no es perd: va a la nota d'abast, com "o per fases" als germans.
 */
const FULL_PRICE = AUDIT_BASE_BY_COUNT[3];
const MIN_PRICE = AUDIT_BASE_BY_COUNT[1];

/**
 * La 01 enumera LLIURABLES. L'última línia d'AUDIT_BASE_INCLUDES ("Val per si
 * sola: … es descompta íntegra") és una condició comercial, no una cosa que
 * t'enduguis, i a l'spoke el descompte ja el diuen el hero, la nota dels extres
 * i la FAQ sencera: quatre cops. Es treu d'aquesta llista i NOMÉS d'aquí.
 *
 * L'array es queda intacte perquè el ConfiguratorModal també el consumeix, i
 * allà és l'ÚNICA menció del descompte de tot el modal, just on es decideix.
 * Decidit el 16set26.
 */
const SPOKE_INCLUDES = AUDIT_BASE_INCLUDES.filter((item) => !item.startsWith("Val per si sola"));

// Descripcions editorials del focus (contingut de la pàgina, no del càlcul).
const FOCUS_COPY: Record<AuditFocus, { name: string; description: string; tag: string }> = {
  ux: {
    name: "Experiència",
    description: "Fluxos, arquitectura d’informació i punts de fricció.",
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

// Cards de «02 · Focus» (Figma v2: la card d'Abast de web, 24set26). Qualsevol
// focus sol val el mateix, així que totes diuen «DES DE» el preu d'un focus.
const AUDIT_FOCUS_CARDS: FocusCard[] = (["ux", "ui", "dev"] as const).map((id) => ({
  id,
  title: FOCUS_COPY[id].name,
  description: FOCUS_COPY[id].description,
  price: MIN_PRICE,
}));

// Procés específic de l'auditoria (no és el PROCESS_STEPS de web/landing).
const AUDIT_PROCESS = [
  { num: "01", title: "Accés", text: "Ens dónes accés al producte o prototip i el context." },
  { num: "02", title: "Revisió", text: "Revisió heurística de UI, UX i conversió." },
  { num: "03", title: "Informe", text: "Informe prioritzat amb quick wins i millores estructurals." },
  { num: "04", title: "Sessió", text: "Sessió de retorn de 90 min i roadmap accionable." },
] as const;

const FAQ: { q: string; a: string }[] = [
  {
    q: "Què necessiteu de mi?",
    a: "Només accés al producte o prototip i una mica de context sobre els objectius.",
  },
  {
    q: "Puc triar només un focus?",
    a: "Sí. Tries un focus, dos o els tres, i el preu s’ajusta segons quants en triïs.",
  },
  {
    q: "Com és el descompte?",
    a: "Si fem el projecte en 3 mesos, l’import de l’auditoria es descompta íntegre.",
  },
  {
    q: "Quant triga?",
    a: "Segons la talla; d'uns dies a un parell de setmanes, amb dates tancades.",
  },
  {
    q: "I si no vull seguir?",
    a: "L’auditoria val per si sola: t’enduus l’informe i el roadmap, sense cap compromís.",
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

// ————————————————————————————————— 01 · Què t'enduus

// ————————————————————————————————— 02 · Focus

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
              <span className="flex-1 text-body-l lg:text-body-xl text-text-main">{s.label}</span>
              <span className="text-caption uppercase text-text-secondary md:w-72">{s.range}</span>
              <span className="text-body-l lg:text-body-xl text-text-main md:w-44 md:text-right">
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
              <span className="flex-1 text-body-l lg:text-body-xl text-text-main">{extra.label}</span>
              <span className="text-body-l lg:text-body-xl text-text-main md:w-44 md:text-right">
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
        <h2 className="max-w-3xl text-display-xs md:text-display-s lg:text-display-l text-text-main">
          {CONFIGURATOR_ENABLED
            ? "Configura la teva auditoria en dos minuts i rep el pressupost al moment."
            : "Explica’m el projecte i et torno una proposta amb el preu tancat."}
        </h2>
        <div className="mt-10 flex flex-col gap-4">
          <Button
            variant="solid"
            size="lg"
            className="self-start"
            onClick={onConfigure}
          >
            {CONFIGURATOR_ENABLED ? "Configura la teva auditoria" : "Demana pressupost"}
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

// ————————————————————————————————— 05 · Procés

function ProcessSection() {
  return (
    <section className={`${SECTION_PX} py-20 bg-surface-base border-t border-border-subtle`}>
      <Reveal>
        <SectionHeader caption="05 · COM TREBALLEM" title="Com funciona" />
      </Reveal>
      <Reveal className="mt-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIT_PROCESS.map((step) => (
            <div key={step.num} className="flex flex-col gap-3 border-t border-border-subtle pt-6">
              <span className="text-caption text-text-secondary">{step.num}</span>
              <h3 className="text-display-2xs-medium lg:text-display-xs-medium text-text-main">{step.title}</h3>
              <p className="text-body-xs-light md:text-body-s-light text-text-secondary">{step.text}</p>
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
              <dt className="text-body-l lg:text-body-xl text-text-main md:w-2/5">{q}</dt>
              <dd className="flex-1 text-body-l lg:text-body-xl text-text-secondary">{a}</dd>
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
        <h2 className="max-w-3xl text-display-xs md:text-display-s lg:text-display-l text-text-main">Comencem amb una auditoria?</h2>
        <div className="mt-10 flex flex-col gap-4">
          <Button
            variant="solid"
            size="lg"
            className="self-start"
            onClick={onConfigure}
          >
            {CONFIGURATOR_ENABLED ? "Configura la teva auditoria" : "Demana pressupost"}
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

// Hero v2 (Figma: Serveis - Detall Auditoria · Hero, 12484-13828 · iPad
// 12484-14017 · mòbil 12484-14207). Mateix component que web i landing; el
// selector tria per NOMBRE de focus, que és el que mou el preu.
const AUDIT_PRODUCT = PRODUCTS.find((p) => p.id === "auditoria")!;

const AUDIT_HERO_COPY: SpokeHeroCopy = {
  eyebrow: "SERVEIS · AUDITORIA UI/UX",
  title: "Sabràs exactament què falla i què arreglar primer.",
  description:
    "Revisió experta de la teva UI, UX i conversió, amb informe prioritzat i pla d’acció. I si fem el projecte en 3 mesos, te la descompto íntegra.",
  ctaLabel: "Configura la teva auditoria",
};

const AUDIT_HERO_SCOPE: SpokeHeroScope = {
  options: [
    { value: "3", label: "Els tres focus", price: AUDIT_BASE_BY_COUNT[3] },
    { value: "2", label: "Dos focus", price: AUDIT_BASE_BY_COUNT[2] },
    { value: "1", label: "Un focus", price: AUDIT_BASE_BY_COUNT[1] },
  ],
  fullNote: `o un de sol, ${formatPrice(MIN_PRICE)}`,
  partialNote: `o els tres focus, ${formatPrice(FULL_PRICE)}`,
  label: "Nombre de focus",
};

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
      <ProductSpokeHero
        product={AUDIT_PRODUCT}
        copy={AUDIT_HERO_COPY}
        scope={AUDIT_HERO_SCOPE}
        onConfigure={openConfigurator}
        onContact={contact.open}
      />
      <IncludesSection
        includes={SPOKE_INCLUDES}
        title="Què t’enduus"
        description="Per auditar només necessito accés al teu producte o prototip."
      />
      <FocusSection
        caption="02 · FOCUS"
        title="Tria on miro"
        description={`Tries un focus o més d’un. El preu depèn de quants: un ${formatPrice(AUDIT_BASE_BY_COUNT[1])}, dos ${formatPrice(AUDIT_BASE_BY_COUNT[2])} i els tres ${formatPrice(AUDIT_BASE_BY_COUNT[3])}.`}
        cards={AUDIT_FOCUS_CARDS}
      />
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
