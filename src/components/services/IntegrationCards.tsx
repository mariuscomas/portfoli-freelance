import { COLLAB_INTEGRATION } from "@/lib/pricing";

/**
 * «Com m’integro» de /colaboracio. Figma: set «Card · Integració» (12528:25251),
 * variants Breakpoint (Desktop · Tablet · Mobile) × Últim (24set26).
 *
 *   mòbil   → apilades, gap 32, filet dashed a dalt de totes
 *   tablet  → 4 columnes, padding 16/24, filet dashed a la dreta menys l'última
 *   desktop → 4 columnes, padding 24/48, filet dashed a la dreta menys l'última
 *
 * El padding lateral de la card és el que separa el text del filet. Perquè el
 * text de la primera columna quedi alineat amb el marge de pàgina, la fila
 * surt del marge amb un marge negatiu igual (-mx-6 · -mx-12).
 */
export default function IntegrationCards() {
  return (
    <ul className="flex flex-col gap-8 md:-mx-6 md:flex-row md:gap-0 lg:-mx-12">
      {COLLAB_INTEGRATION.map((item, i) => {
        const last = i === COLLAB_INTEGRATION.length - 1;
        return (
          <li
            key={item.title}
            className={`flex flex-col gap-4 border-t dash-h-border-default pt-6 md:flex-1 md:border-t-0 md:px-6 md:py-4 lg:px-12 lg:py-6 ${
              last ? "" : "md:border-r md:dash-v-border-default"
            }`}
          >
            <h3 className="text-display-2xs-medium lg:text-display-xs-medium text-text-main">{item.title}</h3>
            <p className="text-body-xs-light md:text-body-s-light text-text-secondary">{item.text}</p>
          </li>
        );
      })}
    </ul>
  );
}
