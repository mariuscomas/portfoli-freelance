import type { ComponentType, ReactNode } from "react";
import { PROCESS_STEPS, CONDITIONS } from "@/lib/pricing";

/**
 * Secció «Com treballo»: quatre fases + tira de condicions.
 *
 * Figma: Serveis v2, "Section Procés — Com treballo" (Desktop 12353:107594 ·
 * iPad 12353:107744 · iPhone 12353:107674); cada fase és el mestre
 * "Card Fases" 12405:110869. Un sol component per al hub (/serveis) i
 * l'spoke de Landing (24set26): abans n'hi havia una còpia per fitxer i la
 * de l'spoke s'havia quedat enrere. L'spoke de Web NO la fa servir: té el
 * seu propi disseny de procés (capçal · imatge · fases en llista).
 *
 * La secció fixa el mode Dark amb la classe `dark`: els tokens es
 * reinterpreten i el contingut llegeix els mateixos noms.
 *
 * Fases:
 *   mòbil  → apilades sense gap, filet dashed a dalt i 24 a dalt i a baix
 *   tablet → dues columnes amb 48 de gap, filet a dalt i 24 a dalt
 *   desktop→ quatre columnes, el filet passa a la DRETA de cada fase menys
 *            l'última
 * Condicions: a desktop en una línia amb «·» entre elles; per sota fan wrap
 * i el separador desapareix.
 *
 * L'entrada animada la posa cada pàgina (`reveal`), com a CustomWorkRow.
 */
type RevealLike = ComponentType<{ children: ReactNode; className?: string }>;

const Passthrough: RevealLike = ({ children, className }) => (
  <div className={className}>{children}</div>
);

export default function ProcessSection({
  caption,
  title,
  reveal: Reveal = Passthrough,
}: {
  caption: string;
  title: string;
  reveal?: RevealLike;
}) {
  return (
    <section className="dark flex flex-col gap-16 bg-surface-base px-page py-section-s lg:gap-12 lg:py-section-l">
      <Reveal className="flex flex-col gap-6">
        <span className="text-caption uppercase text-text-secondary">{caption}</span>
        <h2 className="text-display-s-medium md:text-display-m-medium lg:text-display-l-medium text-text-main">
          {title}
        </h2>
      </Reveal>
      <Reveal className="flex flex-col gap-16">
        <ol className="grid grid-cols-1 md:grid-cols-2 md:gap-12 lg:grid-cols-4">
          {PROCESS_STEPS.map((step, i) => (
            <li
              key={step.num}
              className={`flex flex-col gap-4 border-t dash-h-border-subtle py-section-2xs md:pb-0 lg:border-t-0 ${
                i < PROCESS_STEPS.length - 1 ? "lg:border-r lg:dash-v-border-subtle" : ""
              }`}
            >
              <span className="text-body-xl text-text-secondary">{step.num}</span>
              <h3 className="text-display-xs-medium text-text-main">{step.title}</h3>
              <p className="text-body-s-light text-text-secondary">{step.text}</p>
            </li>
          ))}
        </ol>
        <ul className="flex flex-wrap gap-x-8 gap-y-4 lg:gap-x-4">
          {CONDITIONS.map((c, i) => (
            <li key={c} className="flex gap-4 text-caption uppercase text-text-secondary">
              {i > 0 && <span aria-hidden className="hidden lg:inline">·</span>}
              {c}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
