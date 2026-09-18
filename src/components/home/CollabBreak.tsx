/**
 * Tall entre Serveis i Col·laboració a la home.
 *
 * Figma: "Section · Tall"
 *   Desktop 1728 → 12127:63960 · Tablet 834 → 12142:13409 · Mobile 402 → 12142:13413
 *
 * Una pantalla sencera amb una sola frase, sense CTA ni etiqueta: és una
 * pausa, no una secció de venda. Marca el canvi de model de contractació,
 * del projecte amb preu tancat (Serveis) a la dedicació continuada
 * (Col·laboració). Referència: el tall de heronaiapp.com.
 *
 * Estàtica de moment. L'aparició en fer scroll és comportament i es valida
 * al dev server, no al Figma.
 *
 * Sense <section>: no té títol propi i un landmark sense nom és soroll per
 * al lector de pantalla. La frase va en <p>; el títol de la secció següent
 * continua sent l'h2 de Col·laboració.
 */
export default function CollabBreak() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center border-t border-border-strong bg-surface-base px-section-x-xl">
      <p className="text-display-h2 text-balance text-center text-text-main">
        I si el projecte no s’acaba?
      </p>
    </div>
  );
}
