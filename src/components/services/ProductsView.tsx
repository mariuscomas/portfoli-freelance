"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
import ConfiguratorModal from "@/components/services/ConfiguratorModal";
import { CONFIGURATOR_ENABLED } from "@/lib/flags";
import { useContactModal } from "@/context/ContactModalContext";
import TransitionLink from "@/components/common/TransitionLink";
import { Button } from "@/components/ui/Button";
import { DisciplineChips } from "@/components/services/configuratorShared";
import CustomWorkRow from "@/components/services/CustomWorkRow";
import ProcessSection from "@/components/services/ProcessSection";
import ProductCard from "@/components/services/ProductCard";
import {
  RECURRENTS,
  PRODUCT_CALL_URL,
  DISCIPLINE_ORDER,
  AUDIT_BASE_BY_COUNT,
  calcConfiguration,
  type Product,
  type ProductId,
  type Discipline,
} from "@/lib/pricing";

/* Marge lateral de pàgina. Llegeix la rampa `--page-margin`
   (402:24 · 768:48 · 1024:72 · 1440:96 · 1920:144), que mana des del
   21set26. Abans era "px-6 md:px-12 lg:px-16 xl:px-24" escrit a mà,
   que a lg donava 64 on la rampa en diu 72 i no tenia el graó de 144. */
const SECTION_PX = "px-page";

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
    <section id="productes" className="scroll-mt-24 border-t border-border-default bg-surface-base">
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

      {/* Columnes a sang separades per filets dashed (dins de la secció,
          18set26): a dalt entre files quan s'apilen, a la dreta quan van en
          columnes. La vora sòlida de sota la posa la fila «a mida». */}
      <Reveal>
        <div className="flex flex-col border-t dash-h-border-default divide-y dash-divide-h-border-default xl:flex-row xl:divide-x xl:divide-y-0 xl:dash-divide-v-border-default">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              name={p.name}
              description={p.description}
              priceLabel={p.priceLabel}
              price={priceFor(p, disciplines)}
              href={`/serveis/${p.id}`}
              cta={p.cta}
              livePrice
            />
          ))}
        </div>
      </Reveal>

      {/* Fila «a mida»: el mateix component que pinta la home (mestre
          12304:91680). El hub li passa la seva constant de marge, que encara
          no és la rampa page-margin. */}
      <CustomWorkRow
        as={Reveal}
        padX={SECTION_PX}
        padInner="lg:p-16 xl:p-24"
      />
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
    <section className={`${SECTION_PX} border-t border-border-default bg-surface-base py-section-s lg:py-section-m`}>
      <Reveal>
        <div className="flex flex-col gap-6">
          <span className="text-caption uppercase text-text-secondary">
            RECURRENTS · A PART DEL PRESSUPOST
          </span>
          <h2 className="text-display-s-medium md:text-display-m-medium lg:text-display-l-medium text-text-main">
            Després del llançament
          </h2>
        </div>
      </Reveal>

      {/* Taula de tarifes (24set26, substitueix les tres cards). Figma: set
          "Row · Recurrent" 12438:12648, una variant per breakpoint.
          El contingut és el mateix als tres; el que canvia és on cau el preu:
            mòbil  → apilat: nom, què inclou, preu
            tablet → nom i preu comparteixen la línia de dalt
            desktop→ tres columnes de la graella de 12: 3 · 6 · 3, el preu a la
                     dreta tancant amb el marge de pàgina
          Els `pr` de desktop són els carrils del Figma (48 i 112), que deixen
          el text a 336 i 656 dins de les seves 3 i 6 columnes.
          Filet dashed entre files: separa dins d'una secció (18set26).
          Ritme (24set26): padding de secció section/s (72) i section/m (96) a
          desktop, 64 del títol a la primera fila, 0 entre files. Nom i preu en
          text/main, «què inclou» en text/secondary. */}
      <Reveal className="mt-16">
        <ul>
          {RECURRENTS.map((r) => (
            <li
              key={r.label}
              className="grid gap-3 border-t dash-h-border-default py-6 md:grid-cols-[1fr_auto] md:items-baseline md:gap-x-12 md:py-8 lg:grid-cols-12 lg:items-center lg:gap-x-0 lg:py-10"
            >
              <h3 className="order-1 text-display-s-medium text-text-main lg:col-span-3 lg:pr-12">
                {r.label}
              </h3>
              <p className="order-2 text-body-s-light text-text-secondary md:order-3 md:col-span-2 lg:order-2 lg:col-span-6 lg:pr-28">
                {r.body}
              </p>
              <span className="order-3 text-display-xs-medium text-text-main md:order-2 lg:order-3 lg:col-span-3 lg:text-right">
                {r.price}
              </span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— CTA final

function FinalCtaSection({ onConfigure }: { onConfigure: (id: ProductId) => void }) {
  return (
    <section
      className={`${SECTION_PX} border-t border-border-default bg-surface-base pt-24 pb-32 lg:pb-48`}
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
      <ProcessSection caption="EL PROCÉS" title="Com treballo" reveal={Reveal} />
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
