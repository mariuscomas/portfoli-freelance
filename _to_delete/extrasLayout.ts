/**
 * Disposició del pas d'extres del configurador.
 *
 * La lògica viu AQUÍ i no dins del component perquè es pugui provar sense
 * navegador: quins mòduls surten a cada família, on va cada pack i què diu el
 * caption de preu de cada fila. El component només recorre el que retorna
 * això. Les regles que conté no són òbvies i és on s'amaguen els errors de
 * preu, que són els que acaben en una proposta.
 */
import {
  CONFIG_EXTRAS,
  EXTRA_FAMILIES,
  PACKS,
  extraPricing,
  type ConfigExtraId,
  type ConfigProduct,
  type ConfigQuote,
} from "./pricing.ts";

export interface ExtraGroup {
  id: string;
  label: string;
  ids: ConfigExtraId[];
  /** Packs que pertanyen SENCERS a aquesta família. */
  packs: typeof PACKS;
}

/**
 * Un pack només s'anuncia si tots els seus mòduls es poden oferir ara mateix.
 * Si no, prometria un descompte sobre coses que el client no veu (el blog, per
 * exemple, no surt fins que el CMS està actiu).
 */
export const packVisible = (pack: (typeof PACKS)[number], available: readonly ConfigExtraId[]) =>
  pack.modules.every((id) => available.includes(id));

/** Un pack és "d'una família" si TOTS els seus mòduls hi pertanyen. */
export const packFamily = (pack: (typeof PACKS)[number]) => {
  const first = CONFIG_EXTRAS[pack.modules[0]].family;
  return pack.modules.every((id) => CONFIG_EXTRAS[id].family === first) ? first : null;
};

/** Famílies amb contingut, en l'ordre del catàleg. Les buides no surten. */
export function groupExtras(available: readonly ConfigExtraId[]): ExtraGroup[] {
  return EXTRA_FAMILIES.map((f) => ({
    id: f.id,
    label: f.label,
    ids: available.filter((id) => CONFIG_EXTRAS[id].family === f.id),
    packs: PACKS.filter((p) => packFamily(p) === f.id && packVisible(p, available)),
  })).filter((g) => g.ids.length > 0);
}

/**
 * Packs que CREUEN famílies: van al final de la llista, no dins de cap.
 * El Pack Contingut n'és el cas: CMS és de capacitats, el blog d'amplia, i la
 * migració i la formació de rendiment.
 */
export function crossFamilyPacks(available: readonly ConfigExtraId[]) {
  return PACKS.filter((p) => packFamily(p) === null && packVisible(p, available));
}

/** Preu del pack: suma dels seus mòduls i import amb el descompte aplicat. */
export function packAmounts(pack: (typeof PACKS)[number], product: ConfigProduct) {
  const suma = pack.modules.reduce((acc, id) => acc + extraPricing(id, product).price, 0);
  return { suma, amb: suma - Math.round((suma * pack.discountPct) / 100) };
}

/**
 * Caption de preu d'una fila. Ha de dir EXACTAMENT el que cobrarà el desglòs:
 * per això llegeix `extraPricing`, igual que el càlcul, en comptes de mirar
 * `def.price` pel seu compte.
 */
export function extraCaption(
  id: ConfigExtraId,
  product: ConfigProduct,
  quote: ConfigQuote,
  value: number,
): string {
  const def = CONFIG_EXTRAS[id];
  const { price, basis } = extraPricing(id, product);
  // Les pàgines cobren el preu de l'abast triat, no el del catàleg.
  if (id === "pagina") return `+${quote.pageExtraPrice} €/${def.unitLabel}`;
  if (basis === "perUnit") return `+${price} €/${def.unitLabel}`;
  if (basis === "perPage") {
    return value > 0
      ? `+${price * quote.totalPages} € (${quote.totalPages} pàg. × ${price} €)`
      : `+${price} €/PÀGINA`;
  }
  return `+${price} €`;
}
