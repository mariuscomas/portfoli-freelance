/**
 * Taula de tarifes: una fila per concepte amb nom, què inclou i preu.
 * Figma: set "Row · Recurrent" 12438:12648, una variant per breakpoint.
 * La fan servir els recurrents de /serveis («Després del llançament») i les
 * tarifes per durada de /colaboracio (24set26).
 *
 * El contingut és el mateix als tres breakpoints; el que canvia és on cau el preu:
 *   mòbil   → apilat: nom, què inclou, preu
 *   tablet  → nom i preu comparteixen la línia de dalt
 *   desktop → tres columnes de la graella de 12: 3 · 6 · 3, el preu a la
 *             dreta tancant amb el marge de pàgina
 * Els `pr` de desktop són els carrils del Figma (48 i 112), que deixen el text
 * a 336 i 656 dins de les seves 3 i 6 columnes.
 * Filet dashed entre files: separa dins d'una secció (18set26).
 * Nom i preu en text/main, «què inclou» en text/secondary.
 * El marge lateral no és del component: el posa la secció.
 */
export interface RateRow {
  name: string;
  body: string;
  price: string;
}

export default function RateTable({ rows }: { rows: readonly RateRow[] }) {
  return (
    <ul>
      {rows.map((r) => (
        <li
          key={r.name}
          className="grid gap-3 border-t dash-h-border-default py-6 md:grid-cols-[1fr_auto] md:items-baseline md:gap-x-12 md:py-8 lg:grid-cols-12 lg:items-center lg:gap-x-0 lg:py-10"
        >
          <h3 className="order-1 text-display-s-medium text-text-main lg:col-span-3 lg:pr-12">{r.name}</h3>
          <p className="order-2 text-body-s-light text-text-secondary md:order-3 md:col-span-2 lg:order-2 lg:col-span-6 lg:pr-28">
            {r.body}
          </p>
          <span className="order-3 text-display-xs-medium text-text-main md:order-2 lg:order-3 lg:col-span-3 lg:text-right">
            {r.price}
          </span>
        </li>
      ))}
    </ul>
  );
}
