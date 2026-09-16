/**
 * Logotips de client — font única.
 *
 * Els SVG viuen a public/logos/, exportats del Figma ja normalitzats.
 * L'ALÇADA és la dimensió que normalitza: els logos s'igualen per alçada de
 * caixa alta, no per amplada (slot 160×56 del Figma, decisió 15set26). Per
 * això cada entrada porta la seva `h` i l'amplada es deixa automàtica.
 *
 * Abans aquesta llista vivia dins de components/home/Clients.tsx. Va sortir
 * aquí el 16set26, quan /colaboracio va passar d'ensenyar els noms en text a
 * ensenyar els logos, com ja tenia dibuixat el Figma.
 */
export interface ClientLogo {
  id: string;
  src: string;
  /** Alçada normalitzada en px (slot 160×56, igualat per caixa alta). */
  h: number;
  name: string;
}

export const CLIENT_LOGOS: ClientLogo[] = [
  { id: "north", src: "/logos/north.svg", h: 30, name: "The North Studio" },
  { id: "quantion", src: "/logos/quantion.svg", h: 34, name: "Quantion" },
  { id: "cupra", src: "/logos/cupra.svg", h: 52, name: "Cupra" },
  { id: "santalucia", src: "/logos/santalucia.svg", h: 32, name: "Santalucía Impulsa" },
  { id: "alphanet", src: "/logos/alphanet.svg", h: 18, name: "Alphanet Solutions" },
  { id: "onabitz", src: "/logos/onabitz.svg", h: 30, name: "Onabitz" },
];

const byId = new Map(CLIENT_LOGOS.map((c) => [c.id, c]));

/** Els cinc de la prova social de /colaboracio, en l'ordre del Figma. */
export const COLLAB_CLIENT_LOGOS: ClientLogo[] = [
  "north",
  "quantion",
  "cupra",
  "santalucia",
  "alphanet",
].map((id) => byId.get(id)!);
