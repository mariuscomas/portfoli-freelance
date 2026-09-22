import { Plus } from "@phosphor-icons/react/dist/ssr";

/**
 * Marc de regla decoratiu. Mestre Figma "Frame / Ruler" (12305:14461):
 * quatre vores de marques (border-default al 30%, recepta heronaiapp.com)
 * i creus Plus de Phosphor de 12 px (text/main) a les cantonades, a 6 px
 * de la vora del bloc.
 *
 * Per sota de 768 px només hi ha les vores de dalt i baix (Figma: Show
 * Sides = false): el text, alineat a 24, necessita l'aire horitzontal.
 *
 * Reservat per a blocs «a mida» (22set26). El pare ha de ser `relative`;
 * el contingut manté el seu marge de graella, el marc va per sobre sense
 * rebre clics ni ser llegit pel lector de pantalla.
 */
export default function FrameRuler({ className = "" }: { className?: string }) {
  const corner = "absolute size-3 text-text-main";
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-1.5 text-border-default/30 ${className}`.trim()}>
      <span className="ruler-h absolute inset-x-3 top-0 h-3" />
      <span className="ruler-h absolute inset-x-3 bottom-0 h-3" />
      <span className="ruler-v absolute inset-y-3 left-0 w-3 max-md:hidden" />
      <span className="ruler-v absolute inset-y-3 right-0 w-3 max-md:hidden" />
      <Plus size={12} className={`${corner} left-0 top-0`} />
      <Plus size={12} className={`${corner} right-0 top-0`} />
      <Plus size={12} className={`${corner} bottom-0 left-0`} />
      <Plus size={12} className={`${corner} bottom-0 right-0`} />
    </div>
  );
}
