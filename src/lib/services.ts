/**
 * Fusió entre la taula `services` de Supabase i el catàleg de `pricing.ts`.
 *
 * Repartiment decidit el 16set26: la BD porta el COPY (nom, descripció,
 * includes, CTA i etiqueta de preu) i `pricing.ts` porta el PREU i tot el que
 * el calcula (`price`, `configNote`, els esglaons i el configurador). La junta
 * és `product_id`, amb check constraint als tres valors de `ProductId`.
 *
 * Aquí NO hi ha accés a Supabase: cada pàgina fa la seva pròpia consulta i
 * passa les files a `productsFrom`. Així el mapeig no es repeteix al hub i als
 * spokes, i cada ruta segueix decidint què demana.
 */

import { flattenI18n, t } from "@/lib/i18n";
import { PRODUCTS, type Product, type ProductId } from "@/lib/pricing";

/** Columnes que necessita `mergeServiceRow`. Mateix select a totes les rutes. */
export const SERVICE_COLUMNS =
  "product_id, title, price_label, short_description, includes, cta, order_index";

export interface ServiceRow {
  product_id: string;
  title: unknown;
  price_label: unknown;
  short_description: unknown;
  includes: unknown;
  cta: unknown;
}

const PRICED_BY_ID = new Map<ProductId, Product>(PRODUCTS.map((p) => [p.id, p]));

/**
 * Una fila de `services` amb el preu que li toca del catàleg de codi.
 * Retorna null si el `product_id` no existeix a `pricing.ts`: val més
 * descartar la card que pintar-ne una sense preu.
 */
export function mergeServiceRow(row: ServiceRow): Product | null {
  const base = PRICED_BY_ID.get(row.product_id as ProductId);
  if (!base) return null;

  // includes és [{ca,en,es}, ...]: flattenI18n el deixa en strings.
  const lines = (flattenI18n<unknown[]>(row.includes) ?? []).filter(
    (line): line is string => typeof line === "string" && line.trim() !== ""
  );

  // priceLabel és una union tancada: validem el valor de la BD abans de
  // fer-lo servir i, si no encaixa, mana el del codi.
  const label = t(row.price_label);
  const priceLabel = label === "DES DE" || label === "PREU TANCAT" ? label : base.priceLabel;

  return {
    ...base,
    name: t(row.title) || base.name,
    description: t(row.short_description) || base.description,
    cta: t(row.cta) || base.cta,
    includes: lines.length ? lines : base.includes,
    priceLabel,
  };
}

/**
 * Catàleg per al hub. Si la taula ve buida o la consulta ha fallat, caiem al
 * catàleg de codi: el hub comercial no s'ha de quedar mai sense productes.
 */
export function productsFrom(rows: unknown[] | null): Product[] {
  const merged = (rows ?? [])
    .map((row) => mergeServiceRow(row as ServiceRow))
    .filter((p): p is Product => p !== null);

  return merged.length ? merged : PRODUCTS;
}

/**
 * Un sol producte per a la seva pàgina de detall (spoke). Mateix fallback que
 * el hub: sense fila publicada, mana el catàleg de codi i la ruta segueix viva.
 */
export function productFrom(rows: unknown[] | null, id: ProductId): Product {
  const fromDb = (rows ?? [])
    .map((row) => mergeServiceRow(row as ServiceRow))
    .find((p) => p?.id === id);

  return fromDb ?? PRICED_BY_ID.get(id)!;
}
