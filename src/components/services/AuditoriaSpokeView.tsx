"use client";

import { useState } from "react";
import ConfiguratorModal from "@/components/services/ConfiguratorModal";
import { CONFIGURATOR_ENABLED } from "@/lib/flags";
import { useContactModal } from "@/context/ContactModalContext";
import {
  CardGridSection,
  ConfiguratorTeaser,
  FaqSection,
  FinalCtaSection,
  FocusSection,
  SpokeProcessSection,
  type FaqItem,
  type ProcessStep,
  IncludesSection,
  ProductSpokeHero,
  type FocusCard,
  type SpokeHeroCopy,
  type SpokeHeroScope,
} from "@/components/services/WebSpokeView";
import {
  AUDIT_SIZES,
  AUDIT_EXTRAS,
  AUDIT_BASE_INCLUDES,
  AUDIT_BASE_BY_COUNT,
  PRODUCTS,
  type AuditFocus,
} from "@/lib/pricing";

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

// «03 · Talla» i «04 · Extres» (Figma v2: la graella de cards d'extres, sense
// família). La talla és una tria única: la petita ja és al preu del focus.
const AUDIT_SIZE_GROUPS = [
  {
    id: "talla",
    items: AUDIT_SIZES.map((s) => ({
      key: s.id,
      label: s.label,
      help: s.help,
      price: s.increment === 0 ? "Inclosa" : `+${formatPrice(s.increment)}`,
    })),
  },
];

const AUDIT_EXTRA_GROUPS = [
  {
    id: "extres",
    items: AUDIT_EXTRAS.map((e) => ({ key: e.id, label: e.label, help: e.help, price: formatPrice(e.price) })),
  },
];

// Procés específic de l'auditoria (no és el PROCESS_STEPS de web/landing).
// «05 · Com treballo» i «06 · Preguntes» (Figma v2, 24set26). Veu en singular
// («Em dónes», «Què necessites de mi?») i sense «sense cap compromís».
const AUDIT_PROCESS: ProcessStep[] = [
  { num: "01", title: "Accés", text: "Em dónes accés al producte o prototip i el context." },
  { num: "02", title: "Revisió", text: "Revisió heurística de UI, UX i conversió." },
  { num: "03", title: "Informe", text: "Informe prioritzat amb quick wins i millores estructurals." },
  { num: "04", title: "Sessió", text: "Sessió de retorn de 90 min i roadmap accionable." },
];

const AUDIT_FAQ: FaqItem[] = [
  {
    q: "Què necessites de mi?",
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
    a: "Segons la talla: d’uns dies a un parell de setmanes, amb dates tancades.",
  },
  {
    q: "I si no vull seguir?",
    a: "L’auditoria val per si sola: t’enduus l’informe i el roadmap, i no t’obliga a res més.",
  },
];

// ————————————————————————————————— 01 · Què t'enduus

// ————————————————————————————————— 02 · Focus

// ————————————————————————————————— 03 · Talla

// ————————————————————————————————— 04 · Extres

// ————————————————————————————————— Configurador (banda fosca)

// ————————————————————————————————— 05 · Procés

// ————————————————————————————————— 06 · FAQ

// ————————————————————————————————— CTA final

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
      <CardGridSection
        caption="03 · TALLA"
        title="Tria la profunditat"
        description="Quantes pantalles i fluxos reviso. La talla petita ja és al preu del focus."
        groups={AUDIT_SIZE_GROUPS}
      />
      <CardGridSection
        caption="04 · EXTRES"
        title="Aprofundeix-hi"
        description="Anàlisis que se sumen a la revisió quan necessites més evidència. El configurador les va sumant en viu."
        groups={AUDIT_EXTRA_GROUPS}
      />
      <ConfiguratorTeaser onConfigure={openConfigurator} noun="auditoria" />
      <SpokeProcessSection
        caption="05 · COM TREBALLO"
        title="Com funciona"
        description="Quatre passos, sempre en aquest ordre. Saps què toca a cada moment i què has d’aportar tu."
        steps={AUDIT_PROCESS}
      />
      <FaqSection items={AUDIT_FAQ} caption="06 · PREGUNTES" />
      <FinalCtaSection
        onConfigure={openConfigurator}
        onContact={contact.open}
        noun="auditoria"
        title="Comencem amb una auditoria?"
      />

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
