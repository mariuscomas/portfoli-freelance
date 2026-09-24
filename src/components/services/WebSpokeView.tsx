"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CaretDown } from "@phosphor-icons/react";
import ConfiguratorModal from "@/components/services/ConfiguratorModal";
import { CONFIGURATOR_ENABLED } from "@/lib/flags";
import { useContactModal } from "@/context/ContactModalContext";
import Button from "@/components/ui/Button";
import LinkUnderline from "@/components/ui/LinkUnderline";
import { ServicesHeroCta } from "@/components/services/ServicesViews";
import {
  calcConfiguration,
  CONFIG_EXTRAS,
  extraHelp,
  extraPricing,
  EXTRA_FAMILIES,
  PRICING_V2_ENABLED,
  RECURRENTS,
  PROCESS_STEPS,
  PRODUCT_CALL_URL,
  DISCIPLINE_ORDER,
  type ConfigExtraId,
  type ConfigProduct,
  type Discipline,
  type ExtraContext,
  type Product,
} from "@/lib/pricing";
import { SITE_EMAIL } from "@/lib/site";

const CONTACT_EMAIL = SITE_EMAIL;

const formatPrice = (n: number) =>
  `${n.toLocaleString("ca-ES", { maximumFractionDigits: 0 })} €`;

/** Preu "des de" d'una disciplina solta. Ho resol calcConfiguration: el
 *  tancament val diferent amb Dev (posada en producció) i sense (lliurament),
 *  i sumar-ho a mà aquí tornaria a divergir del configurador. */
const disciplinePriceFrom = (d: Discipline, product: ConfigProduct = "web") =>
  calcConfiguration({ product, disciplines: [d] }).baseTotal;

/* Catàleg d'extres del spoke (Figma: 03 · Extres, tres famílies). Surt de
   CONFIG_EXTRAS, el mateix catàleg del configurador: cap llista a mà. Per
   ensenyar-los tots es resol cada `when` amb el projecte complet, en dues
   passades com el configurador: primer amb tots els extres actius, després
   només amb els que han sobreviscut. Així a la web surten el blog i la
   formació (depenen del CMS), i a la landing, que no té CMS, no. */
const catalogIds = (product: ConfigProduct): ConfigExtraId[] => {
  const all = (Object.keys(CONFIG_EXTRAS) as ConfigExtraId[]).filter(
    (id) => !CONFIG_EXTRAS[id].v2Only || PRICING_V2_ENABLED,
  );
  const pass = (actius: Set<ConfigExtraId>) => {
    const ctx: ExtraContext = { product, has: new Set(DISCIPLINE_ORDER), actius };
    return all.filter((id) => CONFIG_EXTRAS[id].when?.(ctx) ?? true);
  };
  return pass(new Set(pass(new Set(all))));
};

const extraGroups = (product: ConfigProduct) => {
  const ids = catalogIds(product);
  return EXTRA_FAMILIES.map((f) => ({
    ...f,
    ids: ids.filter((id) => CONFIG_EXTRAS[id].family === f.id),
  })).filter((g) => g.ids.length > 0);
};

/** «200 € · PER PÀGINA», «250 € · PER INTEGRACIÓ» o «400 €». Preu i base
 *  del producte (la redacció d'una landing és un preu tancat). */
const extraPriceLabel = (id: ConfigExtraId, product: ConfigProduct) => {
  const def = CONFIG_EXTRAS[id];
  const { price, basis } = extraPricing(id, product);
  const unit = basis === "perPage" ? "PÀGINA" : basis === "perUnit" ? def.unitLabel : null;
  return unit ? `${formatPrice(price)} · PER ${unit}` : formatPrice(price);
};

/* Imatge de «04 · Com treballo» (Figma: image 8 de 12343:100364). Si un dia
   es treu, posar-la a null: la columna no es pinta i la graella passa a dues. */
const PROCESS_IMAGE: { src: string; alt: string } | null = {
  src: "/images/serveis_web_proces.jpg",
  alt: "Portàtil obert amb la portada de Màrius Freelance, sobre la falda d’una persona que sosté un cafè.",
};

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

export type FaqItem = { q: string; a: string };

const FAQ: FaqItem[] = [
  {
    q: "Qui aporta els continguts?",
    a: "Els textos, el logo i les imatges els aportes tu. Si no els tens, la redacció és un extra.",
  },
  {
    q: "Puc contractar només una fase?",
    a: "Sí. Tries l’abast: UX, UI, desenvolupament o tot de principi a fi.",
  },
  {
    q: "Què passa si necessito més pàgines?",
    a: "Amb disseny i desenvolupament, 200 € per pàgina. Si contractes menys disciplines, baixa; el configurador ho suma en viu abans que tanquis el pressupost.",
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

// ————————————————————————————————— Hero
// Figma: Serveis - Detall Web · Hero — Web (desktop 12343:100280, iPad
// 12353:108840, mòbil dins 12343:100437). Desktop: text a l'esquerra i una
// columna de 360 amb el preu; iPad: el preu i els enllaços en fila sota el
// text; mòbil: tot apilat.
//
// Compartit amb /serveis/landing (Figma: Serveis - Detall Landing v2, 24set26):
// la mateixa estructura, amb el copy i el producte del configurador per props.

export interface SpokeHeroCopy {
  eyebrow: string;
  title: string;
  description: string;
  /** Label del CTA amb el configurador obert («Configura la teva web»). */
  ctaLabel: string;
}

const WEB_HERO_COPY: SpokeHeroCopy = {
  eyebrow: "SERVEIS · WEB A MIDA",
  title: "La teva web, dissenyada i desenvolupada de principi a fi.",
  description:
    "Un sol interlocutor per a tot el procés: estratègia, disseny UX/UI i desenvolupament fins a producció. Preu tancat, sense sorpreses.",
  ctaLabel: "Configura la teva web",
};

/** Opcions del selector del hero. La primera és l'abast complet. */
export interface SpokeHeroScope {
  options: { value: string; label: string; price: number }[];
  /** Nota amb l'abast complet triat («o per fases, des de 570 €»). */
  fullNote: string;
  /** Nota amb un abast parcial triat («o el projecte complet, 990 €»). */
  partialNote: string;
  /** Nom accessible del selector. */
  label: string;
}

/** Selector per defecte de web i landing: projecte complet o una disciplina. */
const disciplineScope = (product: Product, configProduct: ConfigProduct): SpokeHeroScope => {
  const priceFrom = (d: Discipline) => disciplinePriceFrom(d, configProduct);
  const phaseFloor = Math.min(...DISCIPLINE_ORDER.map(priceFrom));
  return {
    options: [
      { value: "tot", label: "Projecte complet", price: product.price },
      ...DISCIPLINE_ORDER.map((d) => ({ value: d, label: FOCUS_COPY[d].title, price: priceFrom(d) })),
    ],
    fullNote: `o per fases, des de ${formatPrice(phaseFloor)}`,
    partialNote: `o el projecte complet, ${formatPrice(product.price)}`,
    label: "Abast del projecte",
  };
};

export function ProductSpokeHero({
  product,
  configProduct = "web",
  copy,
  scope: scopeProp,
  onConfigure,
  onContact,
}: {
  product: Product;
  configProduct?: ConfigProduct;
  copy: SpokeHeroCopy;
  /** Selector propi (l'auditoria tria per nombre de focus, no per disciplina). */
  scope?: SpokeHeroScope;
  onConfigure: () => void;
  onContact: () => void;
}) {
  const scopeDef = scopeProp ?? disciplineScope(product, configProduct);
  const [scope, setScope] = useState(scopeDef.options[0].value);
  const current = scopeDef.options.find((o) => o.value === scope) ?? scopeDef.options[0];
  const price = current.price;
  // La nota ensenya l'altra opció: el terra amb l'abast complet triat, i el
  // complet quan es mira una opció parcial.
  const note = scope === scopeDef.options[0].value ? scopeDef.fullNote : scopeDef.partialNote;
  const ctaLabel = CONFIGURATOR_ENABLED ? copy.ctaLabel : "Demana pressupost";
  const arrow = (
    <ArrowRight size={20} weight="regular" className="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden />
  );

  return (
    <section className="flex flex-col gap-16 bg-surface-base px-page pt-[calc(var(--header-h)+var(--spacing-section-s))] pb-section-s xl:flex-row xl:gap-0 xl:p-0">
      <Reveal className="flex flex-col gap-12 xl:flex-1 xl:px-page xl:py-section-xl">
        <div className="flex flex-col gap-8">
          <span className="text-caption uppercase text-text-secondary">{copy.eyebrow}</span>
          <div className="flex flex-col gap-6">
            <h1 className="text-display-m md:text-display-xl xl:text-display-2xl text-text-main text-balance">
              {copy.title}
            </h1>
            <p className="max-w-5xl text-body-m md:text-body-xl xl:text-body-2xl text-text-secondary">
              {copy.description}
            </p>
          </div>
        </div>
        <div>
          <ServicesHeroCta href="#que-inclou" label="Mira què inclou" />
        </div>
      </Reveal>

      <Reveal className="flex flex-col gap-12 md:flex-row md:items-center xl:w-[360px] xl:shrink-0 xl:flex-col xl:items-stretch xl:justify-center xl:border-l xl:border-border-default xl:p-12">
        <div className="flex flex-col gap-2 md:flex-1 xl:flex-none">
          <span className="text-caption uppercase text-text-secondary">DES DE</span>
          <span aria-live="polite" className="text-display-l text-text-main">
            {formatPrice(price)}
          </span>
          <label className="relative inline-flex items-center self-start">
            <span className="sr-only">{scopeDef.label}</span>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="cursor-pointer appearance-none bg-transparent py-1 pr-6 text-body-s uppercase text-text-secondary hover:text-text-main focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring"
            >
              {scopeDef.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <CaretDown size={16} weight="regular" className="pointer-events-none absolute right-0 text-text-secondary" aria-hidden />
          </label>
          <p className="text-body-s-light text-text-secondary">{note}</p>
        </div>
        <div className="flex flex-col items-start gap-8">
          <LinkUnderline size="lg" className="xl:text-button-link-xl" onClick={onConfigure} icon={arrow}>
            {ctaLabel}
          </LinkUnderline>
          <LinkUnderline size="lg" className="xl:text-button-link-xl" onClick={onContact} icon={arrow}>
            Escriu-me
          </LinkUnderline>
        </div>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— 01 · Què inclou

export function IncludesSection({
  includes,
  title = "Tot el que entra a la base",
  description = "El punt de partida de qualsevol web a mida. El que no hi surt, o no cal, o és un extra.",
}: {
  includes: string[];
  title?: string;
  description?: string;
}) {
  // Figma: Què inclou — Web. Desktop: capçal a 1/3 i graella de 2 columnes a
  // 2/3; iPad i mòbil: llista d'una columna sota el capçal.
  return (
    <section
      id="que-inclou"
      className="flex flex-col gap-8 border-t border-border-default bg-surface-base px-page py-section-xs md:py-section-s xl:grid xl:grid-cols-3 xl:gap-0 xl:p-0"
    >
      <Reveal className="flex flex-col gap-4 xl:justify-end xl:gap-8 xl:border-r xl:dash-v-border-default xl:px-page xl:pt-section-xl xl:pb-section-m">
        <div className="flex flex-col gap-8">
          <span className="text-caption uppercase text-text-secondary">01 · QUÈ INCLOU</span>
          <h2 className="text-display-s-medium md:text-display-m-medium xl:text-display-l-medium text-text-main">
            {title}
          </h2>
        </div>
        <p className="text-body-s md:max-w-xl md:text-body-l xl:text-body-s-light text-text-secondary">
          {description}
        </p>
      </Reveal>
      {/* Filets dashed: entre files a dalt; a desktop, la línia vertical entre
          les dues columnes és un sol traç (::before), perquè una cel·la no pot
          portar dos filets dashed (border-image n'accepta un). */}
      <Reveal className="xl:col-span-2">
        <ul className="xl:relative xl:grid xl:h-full xl:grid-cols-2 xl:auto-rows-fr xl:before:absolute xl:before:inset-y-0 xl:before:left-1/2 xl:before:border-l xl:before:dash-v-border-default">
          {includes.map((item, i) => (
            <li
              key={item}
              className={`flex items-center py-6 md:gap-8 md:p-6 xl:px-12 ${
                i > 0 ? "border-t dash-h-border-default" : ""
              } ${i < 2 ? "xl:border-t-0" : ""}`}
            >
              <span className="w-14 shrink-0 text-caption uppercase tabular-nums text-text-secondary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-body-m xl:text-body-l text-text-main">{item}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— 02 · Abast (focus)

export interface FocusCard {
  /** Decideix la superfície de color (FOCUS_TINT). */
  id: Discipline;
  title: string;
  description: string;
  price: number;
}

/** Cards d'abast de web: una per disciplina, amb el preu «des de» del producte. */
export const disciplineCards = (
  configProduct: ConfigProduct,
  copy: Record<Discipline, { title: string; description: string }> = FOCUS_COPY,
): FocusCard[] =>
  DISCIPLINE_ORDER.map((d) => ({ id: d, ...copy[d], price: disciplinePriceFrom(d, configProduct) }));

export function FocusSection({
  caption = "02 · ABAST",
  title = "Tria fins on arribem",
  description = "El projecte sencer o una fase solta. Contracta les tres disciplines, o només la que necessites.",
  cards = disciplineCards("web"),
}: {
  caption?: string;
  title?: string;
  description?: string;
  cards?: FocusCard[];
}) {
  // Figma: Exploracio · Abast — Disciplines (desktop 12343:100322, iPad
  // 12353:109085, mòbil 12353:109451). Mòbil: cards apilades a tot l'ample;
  // md: tres cards en fila a tot l'ample; xl: capçal a 1/3 i cards a 2/3.
  // Compartit amb landing (disciplines) i auditoria (focus), 24set26.
  return (
    <section className="border-t border-border-default bg-surface-base xl:grid xl:grid-cols-3">
      <Reveal className="flex flex-col gap-8 px-page py-section-xs md:py-section-s xl:justify-end xl:gap-6 xl:py-section-m">
        <span className="text-caption uppercase text-text-secondary">{caption}</span>
        <div className="flex flex-col gap-4 xl:gap-8">
          <h2 className="text-display-s-medium md:text-display-m-medium xl:text-display-l-medium text-text-main">
            {title}
          </h2>
          <p className="text-body-s md:max-w-xl md:text-body-l xl:max-w-none xl:text-body-s-light text-text-secondary">
            {description}
          </p>
        </div>
      </Reveal>
      <Reveal className="grid grid-cols-1 md:grid-cols-3 xl:col-span-2 xl:gap-6 xl:py-section-m xl:pl-6 xl:pr-page">
        {cards.map((card) => {
          const tint = FOCUS_TINT[card.id];
          return (
            <article
              key={card.id}
              className={`flex flex-col gap-8 px-12 py-section-xs md:p-8 xl:aspect-[3/4] ${tint.bg}`}
            >
              <div className="flex flex-1 flex-col gap-4">
                <h3 className="text-display-2xs-medium xl:text-display-xs-medium text-text-fixed-dark">
                  {card.title}
                </h3>
                <p className={`text-body-s xl:text-body-l ${tint.secondary}`}>{card.description}</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className={`text-caption uppercase ${tint.secondary}`}>DES DE</span>
                <span className="text-display-xs-medium text-text-fixed-dark">{formatPrice(card.price)}</span>
              </div>
            </article>
          );
        })}
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— 03 · Extres

export interface CardGridItem {
  key: string;
  label: string;
  help?: string;
  /** Text de preu tal com es llegeix («400 €», «150 € · PER IDIOMA», «INCLOSA»). */
  price: string;
}

export interface CardGridGroup {
  id: string;
  /** Eyebrow de la família. Sense label, la graella va sola (auditoria). */
  label?: string;
  items: CardGridItem[];
}

/** Secció de capçal a 1/3 i graella de cards a 2/3 (Figma: 03 · Extres).
 *  Compartida pels extres de web i landing i per la talla i els extres de
 *  l'auditoria (24set26). */
export function CardGridSection({
  id,
  caption,
  title,
  description,
  groups,
}: {
  id?: string;
  caption: string;
  title: string;
  description: string;
  groups: CardGridGroup[];
}) {
  return (
    <section id={id} className="border-t border-border-default bg-surface-base xl:grid xl:grid-cols-3">
      <Reveal className="flex flex-col gap-8 px-page py-section-xs md:border-b md:dash-h-border-default md:py-section-s xl:border-b-0 xl:border-r xl:dash-v-border-default xl:pt-section-xl xl:pb-section-m">
        <span className="text-caption uppercase text-text-secondary">{caption}</span>
        <div className="flex flex-col gap-4">
          <h2 className="text-display-s-medium md:text-display-m-medium xl:text-display-l-medium text-text-main">
            {title}
          </h2>
          <p className="text-body-s md:max-w-xl md:text-body-l xl:text-body-s-light text-text-secondary">
            {description}
          </p>
        </div>
      </Reveal>
      <div className="xl:col-span-2">
        {groups.map((group) => (
          <Reveal key={group.id} className={group.label ? undefined : "md:pt-10"}>
            {group.label && (
              <h3 className="px-page pt-10 pb-4 text-caption uppercase text-text-secondary md:pb-6 xl:px-12">
                {group.label}
              </h3>
            )}
            <ul className="md:grid md:grid-cols-2 md:px-page xl:grid-cols-3 xl:px-12">
              {group.items.map((item) => (
                <li
                  key={item.key}
                  className="flex flex-col gap-2 border-t dash-h-border-default px-page py-6 md:gap-4 md:border-t-0 md:p-12"
                >
                  <span className="text-body-l text-text-main">{item.label}</span>
                  {item.help && (
                    <span className="text-body-xs xl:text-body-s-light text-text-secondary">{item.help}</span>
                  )}
                  <span className="text-caption uppercase text-text-main">{item.price}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function ExtrasSection({ product = "web" }: { product?: ConfigProduct }) {
  // Figma: 03 · Extres (desktop 12343:100332; landing 12477-20382). Els
  // extres del catàleg v2 que el producte ofereix, agrupats per les tres
  // famílies del configurador, amb preu i ajuda del producte a cada card.
  const groups: CardGridGroup[] = extraGroups(product).map((g) => ({
    id: g.id,
    label: g.label,
    items: g.ids.map((id) => ({
      key: id,
      label: CONFIG_EXTRAS[id].label,
      help: extraHelp(id, product),
      price: extraPriceLabel(id, product),
    })),
  }));
  return (
    <CardGridSection
      caption="03 · EXTRES"
      title="Fes-la teva"
      description="Mòduls opcionals que se sumen a la base. Tries els que necessites i el configurador els va sumant en viu."
      groups={groups}
    />
  );
}

// ————————————————————————————————— Configurador (banda fosca)

export function ConfiguratorTeaser({
  onConfigure,
  noun = "web",
}: {
  onConfigure: () => void;
  /** «web» o «landing»: Configura la teva {noun}. */
  noun?: string;
}) {
  // Banda fosca: mode Dark local (tokens normals s'inverteixen) — patró DS.
  // En Dark, l'accent elèctric pot ser text («al moment»), 22set26.
  return (
    <section className="dark bg-surface-base px-page py-section-s md:py-section-m">
      <Reveal className="flex flex-col gap-12 md:gap-16 xl:flex-row xl:items-center xl:gap-24">
        <div className="flex flex-col gap-8 md:gap-12 xl:flex-1">
          <span className="text-caption uppercase text-text-secondary">CONFIGURADOR</span>
          <div className="flex flex-col gap-4 md:gap-8 xl:gap-12">
            <h2 className="max-w-4xl text-display-m md:text-display-l text-text-main">
              {CONFIGURATOR_ENABLED ? (
                <>
                  Configura la teva {noun} en dos minuts i rep el pressupost{" "}
                  <span className="text-accent">al moment</span>.
                </>
              ) : (
                "Explica’m el projecte i et torno una proposta amb el preu tancat."
              )}
            </h2>
            <p className="text-body-s-light text-text-secondary">
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
        </div>
        <Button variant="solid" size="lg" shape="pill" className="self-start xl:self-center" onClick={onConfigure}>
          {CONFIGURATOR_ENABLED ? `Configura la teva ${noun}` : "Demana pressupost"}
        </Button>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— 04 · Procés + condicions

export type ProcessStep = { num: string; title: string; text: string };

export function SpokeProcessSection({
  caption = "04 · COM TREBALLO",
  title = "De la idea a producció",
  description = "Quatre fases, sempre en aquest ordre. Saps què toca a cada moment i què has d’aportar tu.",
  steps = PROCESS_STEPS,
}: {
  caption?: string;
  title?: string;
  description?: string;
  steps?: readonly ProcessStep[];
}) {
  // Figma: 04 · Com treballo. Desktop: capçal · imatge · fases en llista;
  // iPad: capçal, quatre fases en columnes i la imatge a tot l'ample a sota;
  // mòbil: fases apilades. Sense PROCESS_IMAGE, la imatge no es pinta.
  const cols = PROCESS_IMAGE ? "xl:grid-cols-[13fr_10fr_13fr]" : "xl:grid-cols-2";
  return (
    <section className={`border-t border-border-default bg-surface-base xl:grid ${cols}`}>
      <Reveal className="flex flex-col gap-12 px-page py-section-s xl:justify-center xl:gap-6 xl:py-section-xs">
        <div className="flex flex-col gap-8 xl:gap-6">
          <span className="text-caption uppercase text-text-secondary">{caption}</span>
          <div className="flex flex-col gap-4 xl:gap-6">
            <h2 className="text-display-s-medium md:text-display-m-medium xl:text-display-l-medium text-text-main">
              {title}
            </h2>
            <p className="text-body-s md:text-body-l xl:text-body-s-light text-text-secondary">{description}</p>
          </div>
        </div>
        {/* Fases, iPad i mòbil (a desktop van a la columna de la dreta). */}
        <ol className="divide-y dash-divide-h-border-default md:grid md:grid-cols-4 md:divide-x md:divide-y-0 md:dash-divide-v-border-default xl:hidden">
          {steps.map((step) => (
            <li key={step.num} className="flex items-center gap-6 p-4 md:flex-col md:items-start">
              <span className="text-caption-sm text-text-secondary">{step.num}</span>
              <div className="flex flex-col gap-2">
                <h3 className="text-body-l-medium text-text-main">{step.title}</h3>
                <p className="text-body-xs text-text-secondary">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>
      {PROCESS_IMAGE && (
        <div className="xl:p-12">
          <div className="relative aspect-[9/4] md:aspect-[25/12] xl:aspect-auto xl:h-full">
            <Image
              src={PROCESS_IMAGE.src}
              alt={PROCESS_IMAGE.alt}
              fill
              sizes="(min-width: 1280px) 28vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      )}
      <Reveal className="hidden xl:flex xl:flex-col xl:justify-center xl:py-12">
        <ol className="divide-y dash-divide-h-border-default">
          {steps.map((step) => (
            <li key={step.num} className="flex items-center gap-6 px-6 py-6">
              <span className="text-caption text-text-secondary">{step.num}</span>
              <div className="flex flex-col gap-1">
                <h3 className="text-display-s-medium text-text-main">{step.title}</h3>
                <p className="text-body-s-light text-text-secondary">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— 05 · FAQ

export function FaqSection({ items = FAQ, caption = "05 · PREGUNTES" }: { items?: FaqItem[]; caption?: string }) {
  // Figma: 05 · Preguntes. Filets dashed entre files (dins de la secció).
  return (
    <section className="flex flex-col gap-12 border-t border-border-default bg-surface-base px-page py-section-s xl:gap-16 xl:py-section-m">
      <Reveal className="flex flex-col gap-5">
        <span className="text-caption uppercase text-text-secondary">{caption}</span>
        <h2 className="text-display-s-medium md:text-display-m-medium xl:text-display-l-medium text-text-main">
          Dubtes freqüents
        </h2>
      </Reveal>
      <Reveal>
        <dl>
          {items.map(({ q, a }) => (
            <div
              key={q}
              className="flex flex-col gap-2 border-t dash-h-border-default py-6 md:flex-row md:gap-12 xl:py-7"
            >
              <dt className="text-body-l-medium md:flex-1 xl:w-[460px] xl:flex-none xl:text-body-l text-text-main">{q}</dt>
              <dd className="text-body-s-light md:flex-1 text-text-secondary">{a}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}

// ————————————————————————————————— 06 · Recurrents

export function RecurrentsSection() {
  // Figma: 06 · Després del llançament, mestre «Card - Recurrents» amb una
  // variant per breakpoint. Filets dashed: a dalt de cada card al mòbil; a
  // l'iPad, a dalt de la fila i entre cards; a desktop, a l'esquerra de totes.
  return (
    <section className="border-t border-border-default bg-surface-base xl:grid xl:grid-cols-[11fr_7fr_7fr_7fr]">
      <Reveal className="flex flex-col justify-center gap-6 px-page pt-section-s pb-section-xs xl:py-section-m">
        <span className="text-caption uppercase text-text-secondary">06 · DESPRÉS DEL LLANÇAMENT</span>
        <h2 className="text-display-s-medium md:text-display-m-medium xl:text-display-l-medium text-text-main">
          Sempre a part del pressupost
        </h2>
      </Reveal>
      <div className="md:grid md:grid-cols-3 md:border-t md:dash-h-border-default xl:contents">
        {RECURRENTS.map((r, i) => (
          <Reveal
            key={r.label}
            className={`flex flex-col gap-8 border-t dash-h-border-default px-6 py-8 md:border-t-0 md:px-12 md:py-section-xs ${
              i > 0 ? "md:border-l md:dash-v-border-default" : ""
            } xl:border-l xl:dash-v-border-default`}
          >
            <span className="text-caption-sm text-text-secondary">{String(i + 1).padStart(2, "0")}</span>
            <div className="flex flex-1 flex-col gap-6 md:gap-5">
              <div className="flex flex-col gap-2 md:gap-4">
                <h3 className="text-display-2xs-medium md:text-display-xs-medium xl:text-display-s-medium text-text-main">
                  {r.label}
                </h3>
                <p className="text-body-xs-light xl:text-body-s-light text-text-secondary">{r.body}</p>
              </div>
              <span className="text-body-l-semibold md:mt-auto md:text-display-2xs-medium xl:text-display-xs-medium text-text-secondary">
                {r.price}
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ————————————————————————————————— CTA final

export function FinalCtaSection({
  onConfigure,
  onContact,
  noun = "web",
  title,
}: {
  onConfigure: () => void;
  onContact: () => void;
  /** «web», «landing» o «auditoria». */
  noun?: string;
  /** Titular propi; per defecte «Comencem la teva {noun}?». */
  title?: string;
}) {
  return (
    <section className="border-t border-border-default bg-surface-base px-page py-section-s xl:py-section-m">
      <Reveal className="flex flex-col gap-10 md:gap-8">
        <h2 className="text-display-s-medium md:text-display-m-medium xl:text-display-l text-text-main">
          {title ?? `Comencem la teva ${noun}?`}
        </h2>
        <div className="flex flex-col items-start gap-6">
          <LinkUnderline
            size="lg"
            className="xl:text-button-link-xl"
            onClick={onConfigure}
            icon={<ArrowRight size={20} weight="regular" className="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden />}
          >
            {CONFIGURATOR_ENABLED ? `Configura la teva ${noun}` : "Demana pressupost"}
          </LinkUnderline>
          <p className="text-body-m xl:text-body-l text-text-secondary">
            O{" "}
            <button type="button" onClick={onContact} className="underline underline-offset-4 hover:text-text-main">
              escriu-me
            </button>{" "}
            directament: {CONTACT_EMAIL}
          </p>
        </div>
      </Reveal>
    </section>
  );
}

export default function WebSpokeView({ product }: { product: Product }) {
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
      <ProductSpokeHero
        product={product}
        configProduct="web"
        copy={WEB_HERO_COPY}
        onConfigure={openConfigurator}
        onContact={contact.open}
      />
      <IncludesSection includes={product.includes} />
      <FocusSection />
      <ExtrasSection />
      <ConfiguratorTeaser onConfigure={openConfigurator} />
      <SpokeProcessSection />
      <FaqSection />
      <RecurrentsSection />
      <FinalCtaSection onConfigure={openConfigurator} onContact={contact.open} />

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
