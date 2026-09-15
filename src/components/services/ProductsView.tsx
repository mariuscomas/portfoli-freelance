"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import ConfiguratorModal from "@/components/services/ConfiguratorModal";
import TransitionLink from "@/components/common/TransitionLink";
import { DisciplineChips } from "@/components/services/configuratorShared";
import {
  PRODUCTS,
  PROCESS_STEPS,
  CONDITIONS,
  RECURRENTS,
  PRODUCT_CALL_URL,
  DISCIPLINE_ORDER,
  AUDIT_BASE_BY_COUNT,
  calcConfiguration,
  scopeLabel,
  type Product,
  type ProductId,
  type Discipline,
} from "@/lib/pricing";

const SECTION_PX = "px-6 md:px-12 lg:px-16 xl:px-24";

const formatPrice = (n: number) =>
  `${n.toLocaleString("ca-ES", { maximumFractionDigits: 0 })} €`;

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

/**
 * Capçalera de secció de /serveis (Figma: "Serveis - Header").
 * Dues columnes alineades a baix: eyebrow + títol a l'esquerra, slot lliure
 * a la dreta (els chips d'abast només els porta "Punts de partida").
 */
function SectionHeader({
  caption,
  title,
  aside,
}: {
  caption: string;
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:gap-6">
      <div className="flex flex-1 flex-col gap-6">
        <span className="text-caption uppercase text-text-secondary">{caption}</span>
        <h2 className="text-heading-h1 text-text-main">{title}</h2>
      </div>
      {aside && <div className="lg:shrink-0">{aside}</div>}
    </div>
  );
}

/** Enllaç de text subratllat amb fletxa — "Buttons / Custom / Link" del DS. */
function LinkArrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex min-h-11 items-center gap-2.5 text-button-lg text-text-main underline underline-offset-8 decoration-1 group-hover:decoration-2 ${className}`}
    >
      {children}
      <ArrowRight
        size={20}
        weight="regular"
        className="shrink-0 transition-transform group-hover:translate-x-1"
        aria-hidden
      />
    </span>
  );
}

// ————————————————————————————————— Tríada de productes

/**
 * Preu "des de" d'un producte per a l'abast triat als chips. Font única:
 * pricing.ts — web/landing componen Immersió + disciplines + tancament
 * (`calcConfiguration`), i l'auditoria es dimensiona pel NOMBRE de focus.
 * Els números del frame de Figma són mock d'un model anterior: manen aquests.
 */
function priceFor(product: Product, disciplines: Discipline[]): number {
  if (product.id === "auditoria") {
    return AUDIT_BASE_BY_COUNT[disciplines.length] ?? product.price;
  }
  return calcConfiguration({ product: product.id, disciplines }).baseTotal;
}

function ProductCard({
  product,
  disciplines,
  className = "",
}: {
  product: Product;
  disciplines: Discipline[];
  className?: string;
}) {
  return (
    <TransitionLink
      href={`/serveis/${product.id}`}
      className={`group flex flex-col gap-10 p-8 transition-colors hover:bg-surface-card/40 lg:p-12 ${className}`}
    >
      <h3 className="text-heading-h2 text-text-main">{product.name}</h3>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <span className="text-caption uppercase text-text-secondary">{product.priceLabel}</span>
          {/* aria-live: el preu reacciona als chips d'abast de la capçalera */}
          <span className="text-heading-h2 text-text-main" aria-live="polite">
            {formatPrice(priceFor(product, disciplines))}
          </span>
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-caption uppercase text-text-secondary">
            {scopeLabel(disciplines)}
          </span>
          <p className="text-body-sm text-text-secondary">{product.description}</p>
        </div>
      </div>

      <div className="mt-auto pt-2">
        <LinkArrow>{product.cta}</LinkArrow>
      </div>
    </TransitionLink>
  );
}

/**
 * Punts de partida — tríada Web · Landing · Auditoria.
 *
 * Els chips de la capçalera ("Què necessites?") són el selector d'abast: en
 * treure una disciplina el preu de cada card baixa en viu. Tanca l'expectativa
 * d'interacció que el toggle antic només insinuava (docs/analisi-estrategica-
 * serveis-2026-07-16.md §3.2).
 */
function TriadaSection({
  disciplines,
  onToggle,
}: {
  disciplines: Discipline[];
  onToggle: (d: Discipline) => void;
}) {
  return (
    <section id="productes" className="scroll-mt-24 border-t border-border-subtle bg-surface-base">
      <Reveal className={`${SECTION_PX} py-16`}>
        <SectionHeader
          caption="SERVEIS · PREUS ORIENTATIUS"
          title="Punts de partida"
          aside={
            <div className="flex flex-col gap-6 lg:items-end">
              <span className="text-caption uppercase text-text-secondary">Què necessites?</span>
              <DisciplineChips
                disciplines={disciplines}
                onToggle={onToggle}
                label="Abast del projecte"
                className="lg:justify-end"
              />
            </div>
          }
        />
      </Reveal>

      {/* Columnes a sang separades per filets (Figma), no cards flotants */}
      <Reveal>
        <div className="grid grid-cols-1 border-y border-border-subtle md:grid-cols-3 lg:px-12">
          {PRODUCTS.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              disciplines={disciplines}
              className={
                i === 0
                  ? "border-b border-border-subtle md:border-b-0"
                  : i === 1
                    ? "border-b border-border-subtle md:border-x md:border-b-0"
                    : ""
              }
            />
          ))}
        </div>
      </Reveal>

      {/* A mida: banda a sang amb filet inferior discontinu — el que el
          configurador no cobreix es pressuposta per trucada. */}
      <Reveal>
        <div
          className={`${SECTION_PX} flex flex-col gap-8 border-b border-dashed border-surface-border-strong py-12 lg:flex-row lg:items-end lg:gap-24 lg:py-24`}
        >
          <div className="flex flex-1 flex-col gap-3">
            <span className="text-caption uppercase text-text-secondary">APPS, BRANDING I MÉS</span>
            <h3 className="text-heading-h2 text-text-main">Una altra cosa al cap?</h3>
            <p className="text-body-sm text-text-secondary">
              El que no encaixa al configurador el pressupostem junts després d’una trucada.
            </p>
          </div>
          <a
            href={PRODUCT_CALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group shrink-0"
          >
            <LinkArrow>Reserva una trucada</LinkArrow>
            <span className="sr-only">(s’obre en una pestanya nova)</span>
          </a>
        </div>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— Procés + condicions

/**
 * Com treballem — banda invertida (Figma: la secció fixa el mode Dark).
 * Els tokens del DS s'inverteixen amb la classe `.dark`, així que embolcallem
 * la secció amb `dark` i el contingut llegeix els mateixos noms de token.
 * `bg-surface-base` dins de `.dark` ja resol al gris fosc del sistema.
 */
function ProcessSection() {
  return (
    <section className={`dark ${SECTION_PX} bg-surface-base py-24 lg:pb-40`}>
      <Reveal>
        <SectionHeader caption="EL PROCÉS" title="Com treballem" />
      </Reveal>
      <Reveal className="mt-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEPS.map((step) => (
            <div key={step.num} className="flex flex-col gap-4 border-t border-border-subtle pt-6">
              <span className="text-caption-sm text-text-secondary">{step.num}</span>
              <h3 className="text-heading-h3 text-text-main">{step.title}</h3>
              <p className="text-body-sm text-text-secondary">{step.text}</p>
            </div>
          ))}
        </div>
        <ul className="mt-16 flex flex-wrap gap-x-8 gap-y-3">
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

// ————————————————————————————————— Recurrents

/**
 * Després del llançament — costos recurrents, deliberadament FORA del total
 * del projecte. És part de la promesa de transparència de la pàgina.
 */
function RecurrentsSection() {
  return (
    <section className={`${SECTION_PX} bg-surface-base py-24 lg:py-32`}>
      <Reveal>
        <SectionHeader caption="RECURRENTS · SEMPRE A PART DEL TOTAL" title="Després del llançament" />
      </Reveal>
      <Reveal className="mt-16">
        <dl className="flex flex-col">
          {RECURRENTS.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between gap-12 border-b border-border-subtle py-8"
            >
              <dt className="text-body-lg text-text-main">{r.label}</dt>
              <dd className="shrink-0 text-right text-body-lg text-text-secondary">{r.price}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— CTA final

function FinalCtaSection({ onConfigure }: { onConfigure: (id: ProductId) => void }) {
  return (
    <section
      className={`${SECTION_PX} border-t border-border-subtle bg-surface-base pt-24 pb-32 lg:pb-48`}
    >
      <Reveal>
        <div className="flex flex-col gap-16 lg:flex-row lg:items-start">
          <div className="flex flex-1 flex-col gap-16">
            <p className="text-eyebrow text-text-secondary">05 — Comencem</p>

            <h2 className="text-display-h3 text-text-main">
              No saps per on començar? Configura el teu producte en dos minuts.
            </h2>

            <div className="flex flex-col gap-8">
              <button type="button" onClick={() => onConfigure("web")} className="group self-start">
                <LinkArrow className="text-eyebrow">Obre el configurador</LinkArrow>
              </button>
              <p className="text-body-sm text-text-secondary">
                Si ho prefereixes,{" "}
                <a
                  href={PRODUCT_CALL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-text-main"
                >
                  reserva una trucada de 20 min
                  <span className="sr-only"> (s’obre en una pestanya nova)</span>
                </a>{" "}
                i en parlem sense compromís.
              </p>
            </div>
          </div>

          {/* Segona porta — pont cap a col·laboració (agències i estudis).
              Al Figma és una card lateral, no una banda sota el CTA. */}
          <TransitionLink
            href="/colaboracio"
            className="group flex flex-col gap-6 rounded-card border border-border-default bg-surface-card/30 p-8 transition-colors hover:border-surface-border-strong lg:w-[412px] lg:shrink-0"
          >
            <span className="flex flex-col gap-4 text-text-secondary">
              <span className="text-eyebrow">Ets una agència o estudi?</span>
              <span className="text-body-sm">Treballo integrat al teu equip, com un sènior més.</span>
            </span>
            <LinkArrow className="text-eyebrow">Incorpora&apos;m al teu equip</LinkArrow>
          </TransitionLink>
        </div>
      </Reveal>
    </section>
  );
}

export default function ProductsView() {
  // Abast triat als chips de "Punts de partida". Per defecte les tres
  // disciplines (l'anchor de valor: el projecte sencer).
  const [disciplines, setDisciplines] = useState<Discipline[]>([...DISCIPLINE_ORDER]);
  const toggleDiscipline = (d: Discipline) =>
    setDisciplines((prev) => {
      const next = prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d];
      // Mai buit: els chips ja bloquegen l'últim actiu, però l'estat mana.
      return next.length ? DISCIPLINE_ORDER.filter((x) => next.includes(x)) : prev;
    });

  // Configurador full-screen (cortina). Mantenim el producte seleccionat
  // en tancar perquè l'animació de sortida no es talli.
  const [configProduct, setConfigProduct] = useState<ProductId | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const openConfigurator = (id: ProductId) => {
    setConfigProduct(id);
    setConfigOpen(true);
  };

  return (
    <>
      <TriadaSection disciplines={disciplines} onToggle={toggleDiscipline} />
      <ProcessSection />
      <RecurrentsSection />
      <FinalCtaSection onConfigure={openConfigurator} />

      <ConfiguratorModal
        isOpen={configOpen}
        onClose={() => setConfigOpen(false)}
        productId={configProduct}
      />
    </>
  );
}
