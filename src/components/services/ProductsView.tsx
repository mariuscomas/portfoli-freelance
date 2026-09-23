"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import ConfiguratorModal from "@/components/services/ConfiguratorModal";
import { CONFIGURATOR_ENABLED } from "@/lib/flags";
import { SITE_EMAIL } from "@/lib/site";
import { useContactModal } from "@/context/ContactModalContext";
import TransitionLink from "@/components/common/TransitionLink";
import { Button } from "@/components/ui/Button";
import { DisciplineChips } from "@/components/services/configuratorShared";
import {
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
 * Eyebrow + títol. El slot lateral dret es va retirar el 16set26 quan els
 * chips d'abast van baixar a la seva pròpia fila sobre la tríada; al Figma
 * segueix existint al mestre (11615:10828) però amagat com a override.
 */
function SectionHeader({ caption, title }: { caption: string; title: string }) {
  return (
    <div className="flex flex-col gap-6">
      <span className="text-caption uppercase text-text-secondary">{caption}</span>
      <h2 className="text-display-s-medium md:text-display-m-medium lg:text-display-l-medium text-text-main">{title}</h2>
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
 * (`calcConfiguration`), i l'auditoria es dimensiona pel NOMBRE de focus
 * (1→600 · 2→900 · 3→1.100).
 *
 * Els tres chips governen les TRES cards amb la mateixa lògica: disciplines a
 * web i landing, focus a l'auditoria. Un intent de desacoblar-la (commit
 * aabbfa7, preu fix a 600 €) va quedar revertit el 16set26: la tríada existeix
 * perquè els tres preus responen la mateixa pregunta, i amb una card que no
 * escolta el control deixen de ser comparables.
 * Veure docs/punts-de-partida-chips-abast-2026-09-16.md §2.
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
      <h3 className="text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium text-text-main">{product.name}</h3>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <span className="text-caption uppercase text-text-secondary">{product.priceLabel}</span>
          {/* aria-live: el preu reacciona als chips d'abast de la capçalera */}
          <span className="text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium text-text-main" aria-live="polite">
            {formatPrice(priceFor(product, disciplines))}
          </span>
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-caption uppercase text-text-secondary">
            {scopeLabel(disciplines)}
          </span>
          <p className="text-body-xs-light md:text-body-s-light text-text-secondary">{product.description}</p>
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
 * Els chips són el selector d'abast: en treure una disciplina, el preu de les
 * TRES cards baixa en viu (disciplines a web i landing, focus a l'auditoria).
 *
 * Viuen en una fila pròpia just sobre la tríada, no al racó superior dret del
 * header: allà l'afordança deia "filtre" quan el comportament és "configura el
 * preu", i el control quedava a uns 600 px del número que canvia. Figma:
 * frame "Row — Abast" (11942:11376) del Desktop 1728.
 * Veure docs/punts-de-partida-chips-abast-2026-09-16.md §4.
 */
function TriadaSection({
  products,
  disciplines,
  onToggle,
}: {
  products: Product[];
  disciplines: Discipline[];
  onToggle: (d: Discipline) => void;
}) {
  return (
    <section id="productes" className="scroll-mt-24 border-t border-border-subtle bg-surface-base">
      <Reveal className={`${SECTION_PX} py-16`}>
        <SectionHeader caption="SERVEIS" title="Punts de partida" />
      </Reveal>

      {/* Fila d'abast — alineada amb el títol, 24 px sobre la línia de les
          cards. A mòbil el caption va sobre els chips i aquests fan wrap. */}
      <Reveal className={`${SECTION_PX} pb-6`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <span className="text-caption uppercase text-text-secondary">Abast del projecte</span>
          <DisciplineChips
            disciplines={disciplines}
            onToggle={onToggle}
            label="Abast del projecte"
          />
        </div>
      </Reveal>

      {/* Columnes a sang separades per filets (Figma), no cards flotants */}
      <Reveal>
        <div className="grid grid-cols-1 border-y border-border-subtle md:grid-cols-3 lg:px-12">
          {products.map((p, i) => (
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
          catàleg no cobreix es pressuposta per trucada. */}
      <Reveal>
        <div
          className={`${SECTION_PX} flex flex-col gap-8 border-b dash-h-border-strong py-12 lg:flex-row lg:items-end lg:gap-24 lg:py-24`}
        >
          <div className="flex flex-1 flex-col gap-3">
            <span className="text-caption uppercase text-text-secondary">APPS, BRANDING I MÉS</span>
            <h3 className="text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium text-text-main">Una altra cosa al cap?</h3>
            <p className="text-body-xs-light md:text-body-s-light text-text-secondary">
              El que no encaixa en aquests punts de partida el pressupostem junts després d’una
              trucada.
            </p>
          </div>
          {/* Dues sortides, com al Figma: trucada per a qui vol parlar, correu
              per a qui prefereix escriure. No repeteixen substantiu. */}
          <div className="flex shrink-0 flex-col gap-6 lg:flex-row lg:items-center lg:gap-12">
            <a
              href={PRODUCT_CALL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <LinkArrow>Reserva una trucada</LinkArrow>
              <span className="sr-only">(s’obre en una pestanya nova)</span>
            </a>
            <a href={`mailto:${SITE_EMAIL}`} className="group">
              <LinkArrow>Escriu-me</LinkArrow>
            </a>
          </div>
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
        <SectionHeader caption="EL PROCÉS" title="Com treballo" />
      </Reveal>
      <Reveal className="mt-16">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEPS.map((step) => (
            <div key={step.num} className="flex flex-col gap-4 border-t border-border-subtle pt-6">
              <span className="text-caption-sm text-text-secondary">{step.num}</span>
              <h3 className="text-display-2xs-medium lg:text-display-xs-medium text-text-main">{step.title}</h3>
              <p className="text-body-xs-light md:text-body-s-light text-text-secondary">{step.text}</p>
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
    <section className="border-t border-border-subtle bg-surface-base">
      <Reveal>
        <div className="flex flex-col lg:min-h-[424px] lg:flex-row lg:items-stretch">
          {/* Capçalera. A desktop és la primera columna de la fila i porta el
              filet dashed a la dreta; a mòbil i tablet és una banda a sobre. */}
          <div className="flex flex-col justify-center gap-6 px-6 py-24 md:px-12 lg:w-[594px] lg:shrink-0 lg:border-r lg:border-dashed lg:border-border-subtle lg:px-12 lg:py-24">
            <span className="text-caption uppercase text-text-secondary">
              RECURRENTS · A PART DEL PRESSUPOST
            </span>
            <h2 className="text-display-s-medium md:text-display-m-medium lg:text-display-l-medium text-text-main">
              Després del llançament
            </h2>
          </div>

          {/* Les tres cards. A mòbil s'apilen i el filet va a dalt; de md amunt
              van en columnes i el filet passa a l'esquerra de cada card. */}
          <ul className="flex flex-1 flex-col md:flex-row md:border-t md:border-dashed md:border-border-subtle lg:border-t-0">
            {RECURRENTS.map((r, i) => (
              <li
                key={r.label}
                className="flex flex-1 items-center gap-8 border-t border-dashed border-border-subtle px-6 py-8 md:items-stretch md:flex-col md:gap-8 md:border-t-0 md:border-l md:p-12"
              >
                <span className="text-caption-sm shrink-0 text-text-secondary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-1 flex-col gap-6 md:justify-between md:gap-10">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium text-text-main">
                      {r.label}
                    </h3>
                    <p className="text-body-xs-light lg:text-body-s-light text-text-secondary">
                      {r.body}
                    </p>
                  </div>
                  <span className="text-body-l-semibold md:text-display-2xs-medium lg:text-display-xs-medium text-text-main">
                    {r.price}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
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
            <p className="text-caption-eyebrow text-text-secondary">Comencem</p>

            <h2 className="text-display-xs md:text-display-s lg:text-display-l text-text-main">
              {CONFIGURATOR_ENABLED
                ? "Tria el punt de partida i tanca el preu en dos minuts."
                : "Explica’m el projecte i et torno una proposta amb el preu tancat."}
            </h2>

            <div className="flex flex-col gap-8">
              {/* CTA principal de la pàgina: botó sòlid del DS, no enllaç. És
                  l'única acció que obre el configurador i ha de guanyar els
                  enllaços de la secció (Figma: Buttons / Solid / Large). */}
              <Button
                variant="solid"
                size="lg"
                shape="pill"
                className="self-start"
                onClick={() => onConfigure("web")}
                iconRight={<ArrowRight size={20} weight="regular" aria-hidden />}
              >
                {CONFIGURATOR_ENABLED ? "Obre el configurador" : "Demana pressupost"}
              </Button>
              <p className="text-body-xs-light md:text-body-s-light text-text-secondary">
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
                i en parlem.
              </p>
            </div>
          </div>

          {/* Segona porta — pont cap a col·laboració (agències i estudis).
              Al Figma és una card lateral, no una banda sota el CTA. */}
          <TransitionLink
            href="/colaboracio"
            className="group flex flex-col gap-6 rounded-card border border-border-default bg-surface-card/30 p-8 transition-colors hover:border-border-strong lg:w-[412px] lg:shrink-0"
          >
            <span className="flex flex-col gap-4 text-text-secondary">
              <span className="text-caption-eyebrow">Ets una agència o estudi?</span>
              <span className="text-body-xs-light md:text-body-s-light">Treballo integrat al teu equip, com un sènior més.</span>
            </span>
            <LinkArrow className="text-caption-eyebrow">Incorpora&apos;m al teu equip</LinkArrow>
          </TransitionLink>
        </div>
      </Reveal>
    </section>
  );
}

export default function ProductsView({ products }: { products: Product[] }) {
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
  const contact = useContactModal();
  const openConfigurator = (id: ProductId) => {
    // Amb el configurador tancat, el mateix CTA porta al contacte: el visitant
    // explica el projecte i el pressupost surt de la revisió.
    if (!CONFIGURATOR_ENABLED) {
      contact.open();
      return;
    }
    setConfigProduct(id);
    setConfigOpen(true);
  };

  return (
    <>
      <TriadaSection products={products} disciplines={disciplines} onToggle={toggleDiscipline} />
      <ProcessSection />
      <RecurrentsSection />
      <FinalCtaSection onConfigure={openConfigurator} />

      {CONFIGURATOR_ENABLED && (
        <ConfiguratorModal
          isOpen={configOpen}
          onClose={() => setConfigOpen(false)}
          productId={configProduct}
        />
      )}
    </>
  );
}
