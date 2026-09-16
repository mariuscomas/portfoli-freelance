/**
 * Font de veritat de preus i catàleg — Estratègia de negoci v1.3 (2026-07-13).
 * Mirall de docs/estrategia-negoci.md. Qualsevol canvi de preu es fa AQUÍ
 * i es propaga al configurador, presets i pàgina de serveis alhora.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Configurador de web per ROL (font de veritat del <ConfiguratorModal />)
//
// Substitueix el model de presets (Essencial/CMS/Premium/Internacional). Ara
// el client tria l'ABAST — el projecte sencer o una fase solta — i la base i el
// desglòs de fases s'adapten. Tota la lògica de càlcul viu aquí: la UI només
// renderitza i suma amb calcConfiguration(). Això evita que preu, etiqueta i
// total divergeixin (l'origen de tots els bugs de QA dels wireframes).
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Preus del pla modular 2026 (600 · 990 · 1.990) — TANCAT.
 *
 * Viu aquí, i no a lib/flags.ts, perquè pricing.ts és la font de veritat de
 * preus i no pot dependre de l'àlies "@/": els tests corren amb el runner de
 * node, sense bundler que el resolgui. `lib/flags.ts` el reexporta perquè
 * seguir tenint un sol lloc on consultar els flags de llançament.
 *
 * Les xifres estan implementades i verificades (PRICING_V2 + pricing.v2.test),
 * però NO es publiquen fins que es compleixin les tres condicions del pla:
 * starter operatiu, hores reals mesurades i escandall industrialitzat. Amb les
 * hores d'avui la landing a 990 € dona un marge del -4%, i el reposicionament
 * es fa de cop. Veure docs/pla-preus-modular-2026-09-16.md.
 */
export const PRICING_V2_ENABLED = false;

/** Versió del model de preus. S'annexa a cada quote desada (snapshot) per
 *  saber quin model va calcular un pressupost històric. Puja-la a cada repricing. */
export const PRICING_VERSION = PRICING_V2_ENABLED ? "v2.0" : "v1.4";

/** Pàgines incloses a la base d'una WEB, per a qualsevol rol. */
export const BASE_PAGES = PRICING_V2_ENABLED ? 3 : 5;
/** Pàgines incloses a la base d'una LANDING (una sola pàgina llarga). */
export const LANDING_BASE_PAGES = 1;

/** Els dos productes que comparteixen el mateix motor de configuració per rol. */
export type ConfigProduct = "web" | "landing";

export type ConfigExtraId = "pagina" | "idioma" | "motion" | "cms" | "redaccio";

// ─── Model modular per DISCIPLINES (multi-select) ───────────────────────────
// L'usuari tria una o més disciplines; les tres juntes són "De principi a fi".
// El preu es compon: Immersió (una sola vegada) + les disciplines triades +
// tancament (una), de manera que triar-ne una sola reprodueix el preu del
// paquet antic i les combinacions no dupliquen fases compartides.

export type Discipline = "ux" | "ui" | "dev";

/** Ordre canònic (per a chips, fases i etiquetes). */
export const DISCIPLINE_ORDER: Discipline[] = ["ux", "ui", "dev"];

export interface DisciplineDef {
  id: Discipline;
  label: string; // chip / etiqueta
  shortLabel: string; // recap ("UX")
  phaseLabel: string; // fase al Resum
  include: string; // línia a la columna Base
}

export const DISCIPLINES: Record<Discipline, DisciplineDef> = {
  ux: {
    id: "ux",
    label: "Disseny UX",
    shortLabel: "UX",
    phaseLabel: "Disseny UX i arquitectura",
    include: "Disseny UX i arquitectura a mida",
  },
  ui: {
    id: "ui",
    label: "Disseny UI",
    shortLabel: "UI",
    phaseLabel: "Disseny UI",
    include: "Disseny UI a mida",
  },
  dev: {
    id: "dev",
    label: "Desenvolupament",
    shortLabel: "Dev",
    phaseLabel: "Desenvolupament a mida",
    include: "Desenvolupament a mida",
  },
};

/** Etiqueta de l'abast complet (les tres disciplines). */
export const FULL_SCOPE_LABEL = "De principi a fi";

interface ProductPricing {
  basePages: number;
  immersio: number;
  /** Tancament amb Dev: "Posada en producció". */
  produccio: number;
  /** Tancament sense Dev: "Lliurament i traspàs". Al model v1 valien igual. */
  lliurament: number;
  disciplinePrice: Record<Discipline, number>;
  pagesInclude: string;
  restIncludes: string[];
  devIncludes: string[];
  /** Preu de pàgina extra segons les disciplines triades. */
  pageExtra: (has: Set<Discipline>) => number;
}

/**
 * Joc de preus v1.4 (vigent). Web 2.400 · Landing 1.440 · Auditoria 600.
 * El tancament val igual amb Dev i sense: és el model d'abans del repricing.
 */
const PRICING_V1: Record<ConfigProduct, ProductPricing> = {
  web: {
    basePages: 5,
    immersio: 240,
    produccio: 240,
    lliurament: 240,
    disciplinePrice: { ux: 480, ui: 480, dev: 960 },
    pagesInclude: "5 pàgines: inici, qui som, serveis, contacte i legals",
    restIncludes: ["Responsive (Mobile First)", "1 idioma"],
    devIncludes: [
      "Transicions lleugeres",
      "Formulari de contacte",
      "QA, producció i acompanyament al llançament",
    ],
    pageExtra: (h) => (h.has("dev") ? (h.has("ux") || h.has("ui") ? 200 : 100) : 50),
  },
  landing: {
    basePages: 1,
    immersio: 240,
    produccio: 240,
    lliurament: 240,
    disciplinePrice: { ux: 240, ui: 240, dev: 480 },
    pagesInclude: "1 pàgina llarga orientada a convertir",
    restIncludes: ["Narrativa de conversió per seccions", "1 idioma"],
    devIncludes: ["Formulari o CTA principal", "QA, publicació i mesura bàsica"],
    pageExtra: () => 0,
  },
};

/**
 * Joc de preus v2.0 — pla modular 2026, DECIDIT i NO publicat.
 * Web 1.990 · Landing 990 · Auditoria 600 (intacta).
 *
 * Les fases fixes pesen més i les disciplines baixen, perquè els encàrrecs
 * d'una sola disciplina aguantin el marge (Web UX sol donava un 12%). Per això
 * el tancament es parteix: amb Dev es paga la posada en producció sencera.
 *
 * Parcials que han de sortir (docs/pla-preus-modular-2026-09-16.md):
 *   web     → UX/UI sol 950 · UX+UI 1.370 · Dev sol 1.150 · +Dev 1.570 · tot 1.990
 *   landing → UX/UI sol 570 · UX+UI 745 · Dev sol 640 · +Dev 815 · tot 990
 */
const PRICING_V2: Record<ConfigProduct, ProductPricing> = {
  web: {
    basePages: 3,
    immersio: 340,
    produccio: 240,
    lliurament: 190,
    disciplinePrice: { ux: 420, ui: 420, dev: 570 },
    // La base baixa de 5 a 3 pàgines: "qui som" i "legals" surten del compte
    // i passen a mòdul (200 €/pàgina). Validat per Marius el 16set26.
    // ⚑ Les legals segueixen sent obligatòries per RGPD: el copy del
    // reposicionament ha de dir que hi van incloses sense comptar com a
    // pàgina de disseny.
    pagesInclude: "3 pàgines: inici, serveis i contacte",
    restIncludes: ["Responsive (Mobile First)", "1 idioma"],
    devIncludes: [
      "Transicions lleugeres",
      "Formulari de contacte",
      "QA, producció i acompanyament al llançament",
    ],
    // Sense canvis respecte del v1: el projecte complet ja cobra la pàgina
    // extra a 200, que és el preu del mòdul al pla nou.
    pageExtra: (h) => (h.has("dev") ? (h.has("ux") || h.has("ui") ? 200 : 100) : 50),
  },
  landing: {
    basePages: 1,
    immersio: 240,
    produccio: 190,
    lliurament: 155,
    disciplinePrice: { ux: 175, ui: 175, dev: 210 },
    pagesInclude: "1 pàgina llarga orientada a convertir",
    restIncludes: ["Narrativa de conversió per seccions", "1 idioma"],
    devIncludes: ["Formulari o CTA principal", "QA, publicació i mesura bàsica"],
    pageExtra: () => 0,
  },
};

/** Jocs exposats per als tests: el v2 es verifica abans de publicar-se. */
export const PRICING_SETS = { v1: PRICING_V1, v2: PRICING_V2 } as const;

/** Joc actiu. El commuta PRICING_V2_ENABLED, no cap altra cosa. */
export const ACTIVE_PRICING = PRICING_V2_ENABLED ? PRICING_V2 : PRICING_V1;

const PRICING = ACTIVE_PRICING;

/** Preus base de la WEB exposats per a les pàgines spoke (mateix objecte que
 *  consumeix el configurador). Els preus "des de" per disciplina es componen com
 *  immersio + disciplinePrice[d] + tancament. No dupliquis xifres: llegeix d'aquí. */
export const PRICING_WEB = PRICING.web;

/** Preus base de la LANDING exposats per a la pàgina spoke (mateix objecte que
 *  consumeix el configurador). Els preus "des de" per disciplina es componen com
 *  immersio + disciplinePrice[d] + tancament. No dupliquis xifres: llegeix d'aquí. */
export const PRICING_LANDING = PRICING.landing;

/** Extres disponibles segons producte i disciplines. Reprodueix la
 *  disponibilitat dels antics paquets: idioma/motion/cms lligats a Dev,
 *  redacció lligada a UX, pàgina només a web. */
function availableExtras(product: ConfigProduct, has: Set<Discipline>): ConfigExtraId[] {
  const out: ConfigExtraId[] = [];
  if (product === "web") out.push("pagina");
  if (has.has("dev")) {
    out.push("idioma", "motion");
    if (product === "web") out.push("cms");
  }
  if (has.has("ux")) out.push("redaccio");
  return out;
}

/** Etiqueta llegible de l'abast triat. */
export const scopeLabel = (disciplines: Discipline[]): string =>
  disciplines.length >= 3
    ? FULL_SCOPE_LABEL
    : DISCIPLINE_ORDER.filter((d) => disciplines.includes(d))
        .map((d) => DISCIPLINES[d].label)
        .join(" + ");

/**
 * Línia única "… a mida" a la llista Base segons la combinació de disciplines.
 * Substitueix les línies per disciplina (una entrada per combinació).
 * Clau en ordre canònic (ux, ui, dev).
 */
const DISCIPLINE_INCLUDE_LINE: Record<string, string> = {
  "ux,ui,dev": "Disseny i desenvolupament a mida",
  "ux,dev": "Disseny UX i desenvolupament a mida",
  "ui,dev": "Disseny UI i desenvolupament a mida",
  dev: "Desenvolupament a mida",
  ux: "Disseny UX a mida",
  ui: "Disseny UI a mida",
  "ux,ui": "Disseny UI/UX a mida",
};
export const disciplineIncludeLine = (chosen: Discipline[]): string =>
  DISCIPLINE_INCLUDE_LINE[chosen.join(",")] ?? "Disseny i desenvolupament a mida";
// ────────────────────────────────────────────────────────────────────────────

/** Com es calcula el preu de cada extra:
 *  - counter · perUnit : preu × quantitat (pàgines usen el preu del rol)
 *  - toggle  · flat    : preu fix quan està actiu
 *  - toggle  · perPage : preu × (pàgines base + extra) quan està actiu */
export interface ConfigExtraDef {
  id: ConfigExtraId;
  label: string;
  control: "counter" | "toggle";
  basis: "perUnit" | "flat" | "perPage";
  price: number;
  /** Sufix d'unitat per a la UI ("PÀGINA", "IDIOMA"). */
  unitLabel?: string;
}

/** Catàleg d'extres del configurador. El preu de "pagina" és orientatiu (200):
 *  el preu real l'aplica cada rol via pageExtraPrice. */
export const CONFIG_EXTRAS: Record<ConfigExtraId, ConfigExtraDef> = {
  pagina: { id: "pagina", label: "Pàgines extra", control: "counter", basis: "perUnit", price: 200, unitLabel: "PÀGINA" },
  idioma: { id: "idioma", label: "Idiomes extra", control: "counter", basis: "perUnit", price: 150, unitLabel: "IDIOMA" },
  motion: { id: "motion", label: "Motion i interacció premium", control: "toggle", basis: "flat", price: 400 },
  cms: { id: "cms", label: "CMS bàsic", control: "toggle", basis: "flat", price: 500 },
  redaccio: { id: "redaccio", label: "Redacció de textos", control: "toggle", basis: "perPage", price: 80 },
};

/** Selecció de l'usuari al configurador. Tots els extres són opcionals. */
export interface ConfigSelection {
  /** Producte a configurar. Per defecte "web". */
  product?: ConfigProduct;
  /** Disciplines triades (1–3). Buit = totes (De principi a fi). */
  disciplines: Discipline[];
  pages?: number; // pàgines extra (a més de les de base)
  languages?: number; // idiomes extra
  motion?: boolean;
  cms?: boolean;
  redaccio?: boolean;
}

export interface QuoteLine {
  id: string;
  label: string;
  amount: number;
}

export interface ConfigQuote {
  /** Disciplines triades, en ordre canònic. */
  disciplines: Discipline[];
  /** Etiqueta de l'abast ("De principi a fi" o disciplines unides). */
  scopeLabel: string;
  /** Punts "sempre inclosos" segons l'abast (columna Base). */
  includes: string[];
  /** Extres disponibles segons l'abast. */
  availableExtras: ConfigExtraId[];
  /** Preu d'una pàgina extra segons l'abast. */
  pageExtraPrice: number;
  /** Desglòs de la base (fases), en ordre. */
  phases: QuoteLine[];
  baseTotal: number;
  extras: QuoteLine[];
  extrasTotal: number;
  total: number;
  totalPages: number;
}

const toInt = (n: number | undefined) => Math.max(0, Math.floor(n ?? 0));

/**
 * Font única del càlcul del pressupost. El preu es compon per disciplines:
 * Immersió (una) + les disciplines triades + tancament (una); així triar-ne una
 * sola reprodueix el paquet antic i les combinacions no dupliquen fases.
 * Ignora qualsevol extra que l'abast no ofereixi.
 */
export function calcConfiguration(
  selection: ConfigSelection,
  pricing: Record<ConfigProduct, ProductPricing> = ACTIVE_PRICING,
): ConfigQuote {
  const product = selection.product ?? "web";
  const P = pricing[product];
  const picked = DISCIPLINE_ORDER.filter((d) => selection.disciplines?.includes(d));
  const chosen = picked.length ? picked : [...DISCIPLINE_ORDER];
  const has = new Set(chosen);

  const phaseDefs = [
    { label: "Immersió", amount: P.immersio },
    ...chosen.map((d) => ({ label: DISCIPLINES[d].phaseLabel, amount: P.disciplinePrice[d] })),
    {
      label: has.has("dev") ? "Posada en producció" : "Lliurament i traspàs",
      amount: has.has("dev") ? P.produccio : P.lliurament,
    },
  ];
  const phases: QuoteLine[] = phaseDefs.map((p, i) => ({
    id: `phase-${i}`,
    label: p.label,
    amount: p.amount,
  }));
  const baseTotal = phases.reduce((sum, p) => sum + p.amount, 0);

  const includes = [
    P.pagesInclude,
    disciplineIncludeLine(chosen),
    ...P.restIncludes,
    ...(has.has("dev") ? P.devIncludes : []),
  ];

  const avail = availableExtras(product, has);
  const available = new Set(avail);
  const pageExtraPrice = P.pageExtra(has);

  const pages = toInt(selection.pages);
  const languages = toInt(selection.languages);
  const totalPages = P.basePages + pages;

  const extras: QuoteLine[] = [];

  if (available.has("pagina") && pages > 0) {
    extras.push({ id: "pagina", label: CONFIG_EXTRAS.pagina.label, amount: pageExtraPrice * pages });
  }
  if (available.has("idioma") && languages > 0) {
    extras.push({ id: "idioma", label: CONFIG_EXTRAS.idioma.label, amount: CONFIG_EXTRAS.idioma.price * languages });
  }
  if (available.has("motion") && selection.motion) {
    extras.push({ id: "motion", label: CONFIG_EXTRAS.motion.label, amount: CONFIG_EXTRAS.motion.price });
  }
  if (available.has("cms") && selection.cms) {
    extras.push({ id: "cms", label: CONFIG_EXTRAS.cms.label, amount: CONFIG_EXTRAS.cms.price });
  }
  if (available.has("redaccio") && selection.redaccio) {
    extras.push({ id: "redaccio", label: CONFIG_EXTRAS.redaccio.label, amount: CONFIG_EXTRAS.redaccio.price * totalPages });
  }

  const extrasTotal = extras.reduce((sum, e) => sum + e.amount, 0);

  return {
    disciplines: chosen,
    scopeLabel: scopeLabel(chosen),
    includes,
    availableExtras: avail,
    pageExtraPrice,
    phases,
    baseTotal,
    extras,
    extrasTotal,
    total: baseTotal + extrasTotal,
    totalPages,
  };
}

/** Format d'euros canònic del projecte: "3.000 €", sense decimals. */
export const formatEuro = (n: number) =>
  new Intl.NumberFormat("ca-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

// ═══════════════════════════════════════════════════════════════════════════
// Configurador d'AUDITORIA per focus (font de veritat del configurador d'audit)
//
// A diferència de web/landing, una auditoria no es fasea: es dimensiona per
// FOCUS (UX/UI/Dev, multi-selecció), TALLA d'abast (S/M/L) i EXTRES. El preu
// base depèn de QUANTS focus es trien (amb descompte de paquet), no de quins.
// Quadra amb l'escandall (docs/Escandall-preus-Marius.xlsx, full Auditoria).
// ═══════════════════════════════════════════════════════════════════════════

export type AuditFocus = "ux" | "ui" | "dev";
export type AuditSize = "s" | "m" | "l";

export interface AuditFocusDef {
  id: AuditFocus;
  label: string;
  /** Punts "Què cobreix" que es mostren quan el focus és actiu. */
  covers: string[];
}

export const AUDIT_FOCUSES: AuditFocusDef[] = [
  {
    id: "ux",
    label: "UX Design",
    covers: [
      "Arquitectura d'informació i navegació",
      "Fluxos i recorreguts clau: friccions i passos innecessaris",
      "Usabilitat (heurístiques de Nielsen) aplicada als fluxos reals",
      "Jerarquia, claredat i UX writing",
      "Formularis i estats: buit, càrrega, error, èxit",
      "Coherència de patrons d'interacció",
      "Detecció de dark patterns",
      "Base d'evidència: heurística + dades d'analítica quan n'hi hagi",
    ],
  },
  {
    id: "ui",
    label: "UI Design",
    covers: [
      "Consistència visual i sistema (tipografia, color, espaiat, tokens)",
      "Jerarquia visual i llegibilitat",
      "Estats i feedback dels components (hover, focus, actiu, disabled)",
      "Contrast i accessibilitat visual (WCAG 2.2 AA)",
      "Coherència d'iconografia i imatgeria",
      "Grid, alineació i ritme vertical",
      "Responsive i punts de ruptura",
      "Microinteraccions i motion",
    ],
  },
  {
    id: "dev",
    label: "Desenvolupament",
    covers: [
      "Rendiment i Core Web Vitals (LCP, INP, CLS)",
      "HTML semàntic i accessibilitat tècnica (ARIA, ordre de focus, teclat)",
      "SEO tècnic bàsic (meta, headings, sitemap)",
      "Responsive real i cross-browser",
      "Errors de consola i xarxa",
      "Bones pràctiques de codi front i tokens en codi",
      "Seguretat bàsica (HTTPS, formularis)",
    ],
  },
];

/** Preu base segons QUANTS focus es trien (paquet: 3 surt més a compte). */
export const AUDIT_BASE_BY_COUNT: Record<number, number> = { 1: 600, 2: 900, 3: 1100 };

export interface AuditSizeDef {
  id: AuditSize;
  label: string;
  range: string;
  increment: number;
}

export const AUDIT_SIZES: AuditSizeDef[] = [
  { id: "s", label: "Landing o web petita", range: "fins ~10 pantalles · 2 fluxos", increment: 0 },
  { id: "m", label: "Web mitjana", range: "fins ~20 pantalles · 4 fluxos", increment: 300 },
  { id: "l", label: "Web gran, app o 2 productes", range: "fins ~40 pantalles · 8 fluxos", increment: 600 },
];

export interface AuditExtraDef {
  id: string;
  label: string;
  price: number;
}

export const AUDIT_EXTRAS: AuditExtraDef[] = [
  { id: "test", label: "Test amb usuaris (5 participants)", price: 500 },
  { id: "a11y", label: "Auditoria d'accessibilitat WCAG 2.2 AA", price: 350 },
  { id: "benchmark", label: "Benchmark competitiu", price: 250 },
  { id: "analitica", label: "Analítica i comportament real", price: 250 },
  { id: "conversio", label: "Anàlisi de conversió", price: 250 },
  { id: "uxwriting", label: "Revisió de UX writing / microcopy", price: 200 },
  { id: "figma", label: "Recomanacions navegables a Figma", price: 300 },
];

/** Sempre inclòs, sigui quin sigui el focus. */
export const AUDIT_BASE_INCLUDES = [
  "Revisió heurística experta (10 heurístiques de Nielsen)",
  "Cada troballa amb severitat, evidència i recomanació concreta",
  "Informe prioritzat: quick wins i millores estructurals",
  "Roadmap accionable (impacte / esforç)",
  "Sessió de retorn de 90 min",
  "Val per si sola: si fem el projecte en 3 mesos, es descompta íntegra",
] as const;

export const AUDIT_DELIVERABLES = [
  "Informe en PDF + versió Figma anotada",
  "Matriu de troballes per severitat (crítica / greu / menor)",
  "Roadmap prioritzat impacte/esforç",
  "Sessió de retorn de 90 min",
] as const;

export interface AuditSelection {
  focuses: AuditFocus[]; // 1–3
  size?: AuditSize; // per defecte "s"
  extras?: string[]; // ids d'AUDIT_EXTRAS
}

export interface AuditQuote {
  focuses: AuditFocusDef[];
  baseTotal: number;
  size: AuditSizeDef;
  sizeIncrement: number;
  extras: QuoteLine[];
  extrasTotal: number;
  total: number;
}

const AUDIT_FOCUS_ORDER: AuditFocus[] = ["ux", "ui", "dev"];

/**
 * Càlcul del pressupost d'auditoria. Deduplica i ordena els focus, ignora ids
 * desconeguts, i exigeix com a mínim un focus (l'estat buit no és vàlid).
 */
export function calcAudit(selection: AuditSelection): AuditQuote {
  const chosen = AUDIT_FOCUS_ORDER.filter((f) => selection.focuses?.includes(f));
  if (chosen.length === 0) throw new Error("L'auditoria necessita com a mínim un focus.");
  const focuses = chosen.map((id) => AUDIT_FOCUSES.find((f) => f.id === id)!);

  const baseTotal = AUDIT_BASE_BY_COUNT[chosen.length];

  const size = AUDIT_SIZES.find((s) => s.id === selection.size) ?? AUDIT_SIZES[0];

  const extras: QuoteLine[] = AUDIT_EXTRAS.filter(
    (e) => selection.extras?.includes(e.id),
  ).map((e) => ({ id: e.id, label: e.label, amount: e.price }));
  const extrasTotal = extras.reduce((sum, e) => sum + e.amount, 0);

  return {
    focuses,
    baseTotal,
    size,
    sizeIncrement: size.increment,
    extras,
    extrasTotal,
    total: baseTotal + size.increment + extrasTotal,
  };
}

// ————————————————————————————————— Línia B · Productes end-to-end

/** Total "de principi a fi" del joc actiu. Derivat, mai escrit a mà: així el
 *  "des de" del hub i dels spokes segueix el flag sense tocar res més. */
const fullScopeTotal = (product: ConfigProduct) =>
  calcConfiguration({ product, disciplines: [...DISCIPLINE_ORDER] }).baseTotal;

export const BASE_WEB = fullScopeTotal("web");
export const BASE_LANDING = fullScopeTotal("landing");
export const PRICE_AUDIT = 900;

export type ProductId = "web" | "landing" | "auditoria";
export type ExtraApplicability = ProductId[];

export interface Extra {
  id: string;
  label: string;
  price: number | null; // null = a pressupostar
  unit?: string; // "pàgina" | "idioma"
  appliesTo: ExtraApplicability;
}

export const EXTRAS: Extra[] = [
  { id: "pagina", label: "Pàgina extra", price: 200, unit: "pàgina", appliesTo: ["web"] },
  { id: "idioma", label: "Idioma extra (traduccions del client)", price: 150, unit: "idioma", appliesTo: ["web", "landing"] },
  { id: "motion", label: "Motion i interacció premium", price: 400, appliesTo: ["web", "landing"] },
  { id: "cms", label: "CMS bàsic", price: 500, appliesTo: ["web"] },
  { id: "redaccio", label: "Redacció de textos", price: 80, unit: "pàgina", appliesTo: ["web", "landing"] },
  { id: "illustracio", label: "Il·lustració i iconografia a mida", price: null, appliesTo: ["web", "landing"] },
];

// Presets antics (Essencial/CMS/Premium/Internacional) retirats el 2026-07-14:
// substituïts pel model per rols (ROLES + calcConfiguration) i el modal migrat.

export interface Product {
  id: ProductId;
  name: string;
  priceLabel: "DES DE" | "PREU TANCAT";
  price: number;
  description: string;
  configNote?: string;
  cta: string;
  includes: string[];
}

export const PRODUCTS: Product[] = [
  {
    id: "web",
    name: "Web",
    priceLabel: "DES DE",
    price: BASE_WEB,
    configNote: "Projecte complet · o per fases (UX · UI · Dev)",
    description:
      "Web corporativa a mida, de 5 pàgines a tot el que necessitis: disseny, desenvolupament i publicació.",
    cta: "Mira el detall",
    includes: [
      "5 pàgines: inici, qui som, serveis, contacte i legals",
      "Disseny UX/UI i desenvolupament a mida, responsive (Mobile First)",
      "1 idioma",
      "Transicions lleugeres",
      "Formulari de contacte",
      "QA, producció i acompanyament al llançament",
    ],
  },
  {
    id: "landing",
    name: "Landing",
    priceLabel: "DES DE",
    price: BASE_LANDING,
    description:
      "Una sola pàgina orientada a convertir: disseny i desenvolupament a mida, formulari i publicació.",
    cta: "Mira el detall",
    includes: [
      "1 pàgina llarga orientada a convertir",
      "Disseny i desenvolupament a mida, responsive",
      "1 idioma",
      "Narrativa de conversió per seccions",
      "Formulari o CTA principal",
      "QA, publicació i mesura bàsica",
    ],
  },
  {
    id: "auditoria",
    name: "Auditoria UI/UX",
    // Model configurable per focus (1/2/3): el hub mostra el terra "des de".
    // El preu tancat antic (PRICE_AUDIT = 900) es manté com a constant per si
    // es vol revertir; la font del càlcul és AUDIT_BASE_BY_COUNT (calcAudit).
    priceLabel: "DES DE",
    price: AUDIT_BASE_BY_COUNT[1],
    description:
      "Auditoria completa i accionable, dimensionada segons la mida del producte: informe prioritzat, sessió de retorn de 90 min i roadmap. I si en 3 mesos fem el projecte, te la descomptes íntegra.",
    cta: "Mira el detall",
    includes: [
      "Revisió heurística experta: UI, UX i conversió",
      "Fins a 2 fluxos o 10 pantalles",
      "Informe prioritzat: quick wins i millores estructurals",
      "Sessió de retorn de 90 min",
      "Roadmap de millores accionable",
      "Val per si sola: si fem el projecte en 3 mesos, es descompta íntegra",
    ],
  },
];

export const RECURRENTS = [
  { label: "Allotjament gestionat", price: "20 €/mes" },
  { label: "Domini (propietat del client)", price: "≈15 €/any" },
  { label: "Evolutius i millores", price: "35 €/h" },
] as const;

export const PROCESS_STEPS = [
  { num: "01", title: "Descoberta", text: "Objectius, contingut i referents. Sortim amb l’abast clar." },
  { num: "02", title: "Proposta", text: "Preu tancat i abast definit, amb el desglòs de cada fase." },
  { num: "03", title: "Disseny i codi", text: "Disseny a Figma i implementació en codi. Ho veus funcionant, no en captures." },
  { num: "04", title: "Llançament", text: "QA, producció i acompanyament el dia que surt." },
] as const;

/**
 * Compromís públic de resposta (docs/estrategia-negoci.md §6).
 *
 * UNA sola font: aquesta promesa estava escrita a mà a vuit pantalles i havia
 * derivat a "24 hores", el doble de ràpid del que es va decidir. Qualsevol text
 * que la digui ha de llegir d'aquí.
 */
export const RESPONSE_SLA = "48 hores laborables";

export const CONDITIONS = [
  "Pagament 50/50",
  "2 rondes de revisió per fase",
  "Un sol interlocutor, de principi a fi",
  "Validesa 30 dies",
  "Imports sense IVA",
] as const;

// ————————————————————————————————— Línia A · Col·laboració amb agències

export interface CollabRate {
  modality: string;
  detail: string;
  rate: string;
}

export const COLLAB_RATES: CollabRate[] = [
  { modality: "Ad-hoc / hores soltes", detail: "Mínim facturable 4 h", rate: "40 €/h" },
  { modality: "Setmana completa", detail: "≈1.520 €/setmana", rate: "38 €/h" },
  { modality: "Mes complet", detail: "≈5.600 €/mes", rate: "35 €/h" },
  { modality: "Compromís 3+ mesos", detail: "≈4.800-5.100 €/mes · preavís 2-4 setmanes", rate: "30-32 €/h" },
];

export const COLLAB_MODIFIERS = [
  "Urgència < 48 h: +10%",
  "Dedicació parcial: tram superior",
  "Renovació: mateixa tarifa",
  "Facturació mensual · 15-30 dies · sense IVA",
] as const;

// ————— Configurador de tarifa (font de veritat del configurador de col·laboració)
//
// El client (agència) tria modalitat/durada + intensitat + urgència i veu la
// tarifa €/h "des de" i l'equivalent. Principi: menys compromís = més preu.
//   · parcial (<20 h/setmana) → tram superior (menys previsibilitat, més preu)
//   · urgència (<48 h) → +10%
// El terra és 30 €/h; l'ad-hoc (40) és el sostre.

export type CollabModality = "adhoc" | "setmana" | "mes" | "compromis";

export interface CollabTier {
  id: CollabModality;
  label: string;
  detail: string;
  rate: number; // €/h (límit inferior si hi ha rang)
  rateMax?: number; // límit superior del rang (compromís 30–32)
  refHours: number; // hores de referència per a l'equivalent
  equivalentUnit?: "setmana" | "mes"; // absent = sense equivalent (ad-hoc)
}

/** Trams ordenats de menys a més compromís (rate de més a menys). */
export const COLLAB_TIERS: CollabTier[] = [
  { id: "adhoc", label: "Hores soltes (ad-hoc)", detail: "mín. 4 h facturables", rate: 40, refHours: 4 },
  { id: "setmana", label: "Setmana completa", detail: "~1.520 €/setmana", rate: 38, refHours: 40, equivalentUnit: "setmana" },
  { id: "mes", label: "Mes complet", detail: "~5.600 €/mes", rate: 35, refHours: 160, equivalentUnit: "mes" },
  { id: "compromis", label: "Compromís 3+ mesos", detail: "preavís 2–4 setmanes", rate: 30, rateMax: 32, refHours: 160, equivalentUnit: "mes" },
];

const COLLAB_ORDER: CollabModality[] = ["adhoc", "setmana", "mes", "compromis"];

export interface CollabSelection {
  modality: CollabModality;
  partial?: boolean; // dedicació < 20 h/setmana
  urgent?: boolean; // incorporació < 48 h
}

export interface CollabQuote {
  tier: CollabTier;
  rate: number; // €/h final (límit inferior)
  rateMax: number; // €/h final (límit superior; = rate si no hi ha rang)
  modifiers: string[];
  equivalent: number | null; // € segons refHours (usa el límit inferior)
  equivalentUnit: "setmana" | "mes" | null;
}

/**
 * Tarifa de col·laboració. La dedicació parcial puja al tram immediatament
 * superior (més car); la urgència aplica +10%. Els imports són "des de".
 */
export function calcCollab(selection: CollabSelection): CollabQuote {
  const idx = COLLAB_ORDER.indexOf(selection.modality);
  if (idx < 0) throw new Error(`Modalitat desconeguda: ${selection.modality}`);
  const tier = COLLAB_TIERS[idx];

  const modifiers: string[] = [];
  let rate: number;
  let rateMax: number;

  // parcial → tram superior (només si n'hi ha un de més amunt)
  if (selection.partial && idx > 0) {
    const upper = COLLAB_TIERS[idx - 1];
    rate = upper.rate;
    rateMax = upper.rate; // els trams superiors són tarifa única
    modifiers.push(`Parcial · tram superior (${upper.rate} €/h)`);
  } else {
    rate = tier.rate;
    rateMax = tier.rateMax ?? tier.rate;
  }

  if (selection.urgent) {
    rate = Math.round(rate * 1.1);
    rateMax = Math.round(rateMax * 1.1);
    modifiers.push("Urgència +10%");
  }

  const equivalent = tier.equivalentUnit ? Math.round(rate * tier.refHours) : null;

  return { tier, rate, rateMax, modifiers, equivalent, equivalentUnit: tier.equivalentUnit ?? null };
}

/** Format "des de" d'una tarifa: "30–32 €/h" o "38 €/h". */
export const formatRate = (q: Pick<CollabQuote, "rate" | "rateMax">) =>
  q.rate === q.rateMax ? `${q.rate} €/h` : `${q.rate}–${q.rateMax} €/h`;

export const COLLAB_INTEGRATION = [
  { title: "Eines", text: "Les teves: Figma, Slack, Linear, Notion. Sense onboarding." },
  { title: "Ritme", text: "Sprints i cerimònies del teu equip, com un membre més." },
  { title: "Format", text: "Remot amb overlap horari complet (CET)." },
  { title: "Incorporació", text: "En 48 hores si cal. Sense període de prova." },
] as const;

export const COLLAB_CLIENTS = ["North Studio", "Quantion", "Cupra", "Santalucía", "Alphanet"] as const;

/** Enllaç de cita per a col·laboracions (estratègia §5). */
export const COLLAB_CALENDAR_URL = "https://calendar.app.google/MRVip8R9GcYYNCEz6";

/** Enllaç de trucada curta per a productes (mateix que CALL_BOOKING_URL del ServiceModal). */
export const PRODUCT_CALL_URL = "https://calendar.app.google/b4khxKQkiSNss4KR6";
