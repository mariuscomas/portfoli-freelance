"use client";

import { useState } from "react";
import ConfiguratorModal from "@/components/services/ConfiguratorModal";
import { CONFIGURATOR_ENABLED } from "@/lib/flags";
import { useContactModal } from "@/context/ContactModalContext";
import {
  ConfiguratorTeaser,
  disciplineCards,
  ExtrasSection,
  FaqSection,
  FinalCtaSection,
  FocusSection,
  IncludesSection,
  ProductSpokeHero,
  RecurrentsSection,
  SpokeProcessSection,
  type FaqItem,
  type SpokeHeroCopy,
} from "@/components/services/WebSpokeView";
import { type Discipline, type Product } from "@/lib/pricing";

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
    description: "Codi a mida, responsive i posada en producció.",
  },
};

// Figma: Serveis - Detall Landing v2 · 05 · Preguntes. Tres preguntes iguals
// que a web; la de pàgines té resposta pròpia.
const LANDING_FAQ: FaqItem[] = [
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
    a: "Una landing és una sola pàgina llarga. Si en necessites més, el que et cal és una web.",
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

// ————————————————————————————————— 01 · Què inclou: IncludesSection de WebSpokeView

// ————————————————————————————————— 02 · Abast

// ————————————————————————————————— 03 · Extres

// ExtrasSection de WebSpokeView, amb product="landing".

// ————————————————————————————————— Configurador (banda fosca)

// ConfiguratorTeaser i SpokeProcessSection de WebSpokeView.

// ————————————————————————————————— 05 · FAQ

// ————————————————————————————————— 06 · Recurrents

// ————————————————————————————————— CTA final

// Hero v2 (Figma: Serveis - Detall Landing · Hero, 12477-20382 · iPad
// 12477-20571 · mòbil 12477-20761). Mateix component que /serveis/web.
const LANDING_HERO_COPY: SpokeHeroCopy = {
  eyebrow: "SERVEIS · LANDING",
  title: "Una landing que converteix, dissenyada i desenvolupada de principi a fi.",
  description:
    "Una sola pàgina pensada per convertir: missatge, disseny i desenvolupament a mida fins a producció. Preu tancat, sense sorpreses.",
  ctaLabel: "Configura la teva landing",
};

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
      <ProductSpokeHero
        product={product}
        configProduct="landing"
        copy={LANDING_HERO_COPY}
        onConfigure={openConfigurator}
        onContact={contact.open}
      />
      <IncludesSection
        includes={product.includes}
        description="El punt de partida de qualsevol landing a mida. El que no hi surt, o no cal, o és un extra."
      />
      <FocusSection cards={disciplineCards("landing", FOCUS_COPY)} />
      <ExtrasSection product="landing" />
      <ConfiguratorTeaser onConfigure={openConfigurator} noun="landing" />
      <SpokeProcessSection />
      <FaqSection items={LANDING_FAQ} />
      <RecurrentsSection />
      <FinalCtaSection onConfigure={openConfigurator} onContact={contact.open} noun="landing" />

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
