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
export const PRICING_V2_ENABLED = true;

/** Versió del model de preus. S'annexa a cada quote desada (snapshot) per
 *  saber quin model va calcular un pressupost històric. Puja-la a cada repricing. */
export const PRICING_VERSION = PRICING_V2_ENABLED ? "v2.0" : "v1.4";

/** Pàgines incloses a la base d'una WEB, per a qualsevol rol. */
export const BASE_PAGES = PRICING_V2_ENABLED ? 3 : 5;
/** Pàgines incloses a la base d'una LANDING (una sola pàgina llarga). */
export const LANDING_BASE_PAGES = 1;

/** Els dos productes que comparteixen el mateix motor de configuració per rol. */
export type ConfigProduct = "web" | "landing";

export type ConfigExtraId =
  // Model v1.4
  | "pagina"
  | "idioma"
  | "motion"
  | "cms"
  | "redaccio"
  // Mòduls del pla modular 2026 (només amb PRICING_V2_ENABLED)
  | "seo"
  | "accessibilitat"
  | "analitica"
  | "integracio"
  | "blog"
  | "areaPrivada"
  | "migracio"
  | "formacio";

/** Famílies del pas d'extres del configurador. */
export type ExtraFamily = "amplia" | "capacitats" | "rendiment";

export const EXTRA_FAMILIES: { id: ExtraFamily; label: string }[] = [
  { id: "amplia", label: "Amplia el projecte" },
  { id: "capacitats", label: "Suma capacitats" },
  { id: "rendiment", label: "Fes-la rendir" },
];

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
  /** Línia de pàgines legals. Va just després de `pagesInclude` perquè el
   *  matisa: són obligatòries per RGPD i no compten com a pàgina de disseny.
   *  Només els productes que en tenen la declaren. */
  legalInclude?: string;
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
    legalInclude: "Avís legal, privacitat i cookies (no compten com a pàgines)",
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

/**
 * Extres disponibles per a una configuració. Surt del catàleg, no d'una llista
 * a mà: cada extra porta la seva condició a `when`, i els mòduls marcats
 * `v2Only` només s'ofereixen amb el joc de preus v2.
 *
 * L'ordre és el del catàleg (v1 primer, després els mòduls del pla), i dins
 * del configurador la família de cada extra decideix a quin grup es pinta.
 */
function availableExtras(ctx: ExtraContext, esV2: boolean): ConfigExtraId[] {
  return (Object.keys(CONFIG_EXTRAS) as ConfigExtraId[]).filter((id) => {
    const def = CONFIG_EXTRAS[id];
    if (def.v2Only && !esV2) return false;
    return def.when ? def.when(ctx) : true;
  });
}

/** Quantitats demanades, normalitzades a un mapa id → unitats. */
function selectedAmounts(selection: ConfigSelection): Map<ConfigExtraId, number> {
  const m = new Map<ConfigExtraId, number>();
  const set = (id: ConfigExtraId, n: number) => {
    if (n > 0) m.set(id, n);
  };
  set("pagina", toInt(selection.pages));
  set("idioma", toInt(selection.languages));
  set("motion", selection.motion ? 1 : 0);
  set("cms", selection.cms ? 1 : 0);
  set("redaccio", selection.redaccio ? 1 : 0);
  for (const [id, valor] of Object.entries(selection.modules ?? {})) {
    if (!valor) continue;
    set(id as ConfigExtraId, typeof valor === "number" ? toInt(valor) : 1);
  }
  return m;
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

/**
 * Preu i base efectius d'un mòdul per a un producte. Un mòdul pot declarar
 * `perProduct` (la redacció d'una landing, per exemple), i tant el càlcul com
 * la interfície han de llegir el mateix valor: si la UI recalcula pel seu
 * compte, el caption diu una cosa i el desglòs una altra.
 */
export function extraPricing(id: ConfigExtraId, product: ConfigProduct) {
  const def = CONFIG_EXTRAS[id];
  const over = def.perProduct?.[product];
  return { price: over?.price ?? def.price, basis: over?.basis ?? def.basis };
}

/** Com es calcula el preu de cada extra:
 *  - counter · perUnit : preu × quantitat (pàgines usen el preu del rol)
 *  - toggle  · flat    : preu fix quan està actiu
 *  - toggle  · perPage : preu × (pàgines base + extra) quan està actiu */
export interface ExtraContext {
  product: ConfigProduct;
  has: Set<Discipline>;
  /** Extres ja actius a la selecció (la formació depèn del CMS). */
  actius: Set<ConfigExtraId>;
}

export interface ConfigExtraDef {
  id: ConfigExtraId;
  label: string;
  control: "counter" | "toggle";
  basis: "perUnit" | "flat" | "perPage";
  price: number;
  /** Sufix d'unitat per a la UI ("PÀGINA", "IDIOMA"). */
  unitLabel?: string;
  /**
   * Text d'ajuda de l'extra (toggletip al configurador). Copy validat al Figma,
   * frame "Tooltip — Còpia dels extres".
   */
  help?: string;
  /**
   * Preu i base alternatius per a un producte concret. La redacció d'una
   * landing no es pot cobrar per pàgina: una landing és UNA pàgina llarga de
   * vuit o deu seccions, o sigui més feina de redacció que una web de tres,
   * i per pàgina sortiria a 80 €. Decidit el 18set26.
   */
  perProduct?: Partial<Record<ConfigProduct, { price: number; basis: "perUnit" | "flat" | "perPage" }>>;
  /** Família del pas d'extres del configurador. */
  family: ExtraFamily;
  /** Només amb el joc de preus v2 (mòduls del pla modular 2026). */
  v2Only?: boolean;
  /** Condició de disponibilitat. Sense `when`, sempre disponible. */
  when?: (ctx: ExtraContext) => boolean;
}

/**
 * Catàleg d'extres. El preu de "pagina" és orientatiu (200): el real l'aplica
 * cada abast via `pageExtraPrice`.
 *
 * `help` és el copy del toggletip, literal del frame "Tooltip — Còpia dels
 * extres" del Figma (11556:9884). Sense `help` no es pinta cap `?`, i per això
 * els vuit mòduls nous i els extres d'auditoria no en tenen: no hi ha copy
 * validat. El de "pagina" interpola BASE_PAGES perquè segueixi el flag del
 * repricing (5 avui, 3 amb el v2) en comptes de quedar-se desfasat.
 *
 * `family` situa l'extra al pas del configurador; `v2Only` marca els vuit
 * mòduls del pla modular, que no s'ofereixen mentre PRICING_V2_ENABLED estigui
 * tancat (els seus preus són del model nou); `when` és la condició de
 * disponibilitat, que pot dependre del producte, de les disciplines i dels
 * altres extres actius (la formació de CMS no es pot vendre sense el CMS).
 */
export const CONFIG_EXTRAS: Record<ConfigExtraId, ConfigExtraDef> = {
  pagina: { id: "pagina", label: "Pàgines extra", control: "counter", basis: "perUnit", price: 200, unitLabel: "PÀGINA", family: "amplia", when: ({ product }) => product === "web", help: `Qualsevol pàgina més enllà de les ${BASE_PAGES} de la base (blog, portfolio, landing de campanya), amb disseny i maquetació responsive a mida.` },
  idioma: { id: "idioma", label: "Idiomes extra", control: "counter", basis: "perUnit", price: 150, unitLabel: "IDIOMA", family: "amplia", when: ({ has }) => has.has("dev"), help: "El web en un idioma més, amb selector i maquetació adaptada. La traducció dels textos va a part." },
  motion: { id: "motion", label: "Motion i microinteraccions avançades", control: "toggle", basis: "flat", price: 400, family: "capacitats", when: ({ has }) => has.has("dev"), help: "Un pas més enllà de les transicions de la base: animacions d'entrada, efectes al cursor i seqüències que donen caràcter al web." },
  cms: { id: "cms", label: "Panell d'edició de continguts (CMS)", control: "toggle", basis: "flat", price: 500, family: "capacitats", when: ({ product, has }) => product === "web" && has.has("dev"), help: "Edita textos i imatges tu mateix des d'un panell senzill, sense tocar codi ni dependre de ningú per a cada canvi." },
  // Sense `when`: els textos són un lliurable independent de les disciplines.
  // Abans demanava UX i deixava fora qui contracta només Dev, que sol ser
  // justament qui més els necessita. Canviat el 18set26.
  redaccio: { id: "redaccio", label: "Redacció de textos", control: "toggle", basis: "perPage", price: 80, family: "rendiment", perProduct: { landing: { price: 240, basis: "flat" } }, help: "Escric els textos a partir del teu brief: titulars, cos i crides a l'acció pensats per convertir." },

  // ——— Mòduls del pla modular 2026 (35 €/h, marge 25%) ———
  // El blog DEMANA el CMS actiu (com la formació): un blog sense panell
  // d'edició vol dir que cada entrada nova te l'han de demanar a tu, que és
  // el contrari del que el client entén quan compra un blog. Decidit 18set26.
  blog: { id: "blog", label: "Blog o catàleg", control: "toggle", basis: "flat", price: 400, family: "amplia", v2Only: true, when: ({ product, has, actius }) => product === "web" && has.has("dev") && actius.has("cms"), help: "Secció d'entrades o de productes amb llistat, fitxa i filtres, sobre el panell d'edició. El disseny de la fitxa entra al preu; els continguts els publiques tu." },
  areaPrivada: { id: "areaPrivada", label: "Àrea privada", control: "toggle", basis: "flat", price: 500, family: "amplia", v2Only: true, when: ({ product, has }) => product === "web" && has.has("dev"), help: "Zona amb accés per usuari i contrasenya per al que no ha de ser públic: tarifes, documents o material reservat a clients." },
  integracio: { id: "integracio", label: "Integracions externes", control: "counter", basis: "perUnit", price: 250, unitLabel: "INTEGRACIÓ", family: "capacitats", v2Only: true, when: ({ has }) => has.has("dev"), help: "Connecto el web amb una eina que ja fas servir (CRM, reserves, facturació, newsletter). El preu és per integració." },
  seo: { id: "seo", label: "SEO tècnic", control: "toggle", basis: "flat", price: 300, family: "rendiment", v2Only: true, when: ({ has }) => has.has("dev"), help: "La feina que fa que els cercadors entenguin el web: metadades, dades estructurades, sitemap i velocitat. No inclou continguts ni campanyes." },
  analitica: { id: "analitica", label: "Analítica i conversió", control: "toggle", basis: "flat", price: 250, family: "rendiment", v2Only: true, when: ({ has }) => has.has("dev"), help: "Instal·lo la mesura i els esdeveniments que importen (formularis, trucades, clics clau), amb consentiment de cookies i un panell per llegir-ho." },
  accessibilitat: { id: "accessibilitat", label: "Accessibilitat WCAG 2.2 AA", control: "toggle", basis: "flat", price: 350, family: "rendiment", v2Only: true, when: ({ has }) => has.has("ui") || has.has("dev"), help: "Reviso i corregeixo fins a complir la norma: contrast, navegació amb teclat, lectors de pantalla i formularis ben etiquetats." },
  migracio: { id: "migracio", label: "Migració de continguts", control: "toggle", basis: "flat", price: 150, family: "rendiment", v2Only: true, when: ({ has }) => has.has("dev"), help: "Passo els continguts de la web actual a la nova: textos, imatges i enllaços de les pàgines del projecte. Un blog o catàleg amb històric el pressuposto a part." },
  // Sense CMS no hi ha res a ensenyar a fer servir.
  formacio: { id: "formacio", label: "Formació i manual del CMS", control: "toggle", basis: "flat", price: 150, family: "rendiment", v2Only: true, when: ({ actius }) => actius.has("cms"), help: "Sessió d'una hora, gravada, i un manual curt perquè el teu equip publiqui sense dependre de ningú." },
};

/**
 * Packs drecera del pla modular: 10% de descompte sobre la suma dels seus
 * mòduls. El descompte s'aplica SOL quan la configuració té tots els mòduls
 * del pack, i surt com una línia pròpia al desglòs. Així ningú no paga 120 €
 * de més per no haver trobat la drecera.
 */
export interface PackDef {
  id: "contingut" | "rendiment";
  label: string;
  modules: ConfigExtraId[];
  discountPct: number;
  /** Text d'ajuda del pack al configurador. */
  help?: string;
}

export const PACKS: PackDef[] = [
  { id: "contingut", label: "Pack Contingut", modules: ["cms", "blog", "formacio", "migracio"], discountPct: 10, help: "El CMS, el blog, la migració i la formació junts, amb un 10% de descompte. S'aplica sol quan els tens tots quatre actius." },
  { id: "rendiment", label: "Pack Rendiment", modules: ["seo", "analitica", "accessibilitat"], discountPct: 10, help: "SEO tècnic, analítica i accessibilitat junts, amb un 10% de descompte. S'aplica sol quan els tens tots tres actius." },
];

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
  /**
   * Canal genèric per als mòduls del pla modular: `{ seo: true, integracio: 2 }`.
   * Els cinc extres del v1 conserven el seu camp propi per no trencar el
   * configurador ni els tests que ja hi són.
   */
  modules?: Partial<Record<ConfigExtraId, number | boolean>>;
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
    ...(P.legalInclude ? [P.legalInclude] : []),
    disciplineIncludeLine(chosen),
    ...P.restIncludes,
    ...(has.has("dev") ? P.devIncludes : []),
  ];

  const pageExtraPrice = P.pageExtra(has);

  const pages = toInt(selection.pages);
  const totalPages = P.basePages + pages;

  // Els mòduls del pla modular només existeixen amb el joc v2.
  const esV2 = pricing === PRICING_SETS.v2;

  // Disponibilitat en dues passades: la de `formacio` depèn que el CMS hi sigui,
  // i el CMS al seu torn depèn del producte i de les disciplines.
  const demanats = selectedAmounts(selection);
  const primera = new Set(availableExtras({ product, has, actius: new Set() }, esV2));
  const actius = new Set<ConfigExtraId>(
    [...demanats.keys()].filter((id) => primera.has(id)),
  );
  const avail = availableExtras({ product, has, actius }, esV2);
  const available = new Set(avail);

  const extras: QuoteLine[] = [];

  for (const id of avail) {
    const unitats = demanats.get(id) ?? 0;
    if (unitats <= 0) continue;
    const def = CONFIG_EXTRAS[id];
    // Un mòdul pot tenir preu i base propis per producte (vegeu `perProduct`).
    const { price: preu, basis } = extraPricing(id, product);
    // "pagina" cobra el preu de l'abast, no el del catàleg (que és orientatiu).
    const unitari = id === "pagina" ? pageExtraPrice : preu;
    const amount =
      basis === "perUnit"
        ? unitari * unitats
        : basis === "perPage"
          ? preu * totalPages
          : preu;
    extras.push({ id, label: def.label, amount });
  }

  // Packs: 10% sobre la suma dels seus mòduls, només si hi són tots. Surt com
  // una línia negativa pròpia perquè el desglòs expliqui d'on ve el descompte.
  for (const pack of PACKS) {
    if (!pack.modules.every((id) => available.has(id) && (demanats.get(id) ?? 0) > 0)) continue;
    const suma = pack.modules.reduce((acc, id) => acc + CONFIG_EXTRAS[id].price, 0);
    const descompte = Math.round((suma * pack.discountPct) / 100);
    if (descompte > 0) {
      extras.push({ id: `pack-${pack.id}`, label: `${pack.label} (−${pack.discountPct}%)`, amount: -descompte });
    }
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
  { id: "motion", label: "Motion i microinteraccions avançades", price: 400, appliesTo: ["web", "landing"] },
  { id: "cms", label: "Panell d'edició de continguts (CMS)", price: 500, appliesTo: ["web"] },
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
    // FALLBACK de codi: el que es publica viu a la taula `services`. Ha de
    // seguir el joc de preus actiu, o si la consulta falla el hub ensenya
    // 1.990 € al costat de "5 pàgines" (la trampa del 18set26).
    description: `Web corporativa a mida, de ${BASE_PAGES} pàgines a tot el que necessitis: disseny, desenvolupament i publicació.`,
    cta: "Mira el detall",
    includes: [
      PRICING_V2_ENABLED
        ? "3 pàgines: inici, serveis i contacte"
        : "5 pàgines: inici, qui som, serveis, contacte i legals",
      "Avís legal, privacitat i cookies incloses, que no compten com a pàgina",
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
    // Configuració completa (3 focus), mateix criteri que BASE_WEB i
    // BASE_LANDING: el "des de" del catàleg és l'abast sencer, i el terra d'un
    // sol focus viu a la nota d'abast. Unificat el 16set26.
    price: AUDIT_BASE_BY_COUNT[3],
    // Versió combinada aprovada el 16set26: manté la terminologia d'ofici
    // ("revisió heurística") i recupera l'argument del descompte, que és el que
    // elimina el risc de comprar-la. Fora "Auditoria completa i accionable":
    // autoelogi, contra la veu de marca. Aquest text és el FALLBACK; el que es
    // publica viu a la taula `services`.
    description:
      "Revisió heurística de fins a 2 fluxos o 10 pantalles: informe prioritzat, sessió de retorn de 90 min i roadmap. Si en 3 mesos fem el projecte, te la descomptes íntegra.",
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

/** Enllaç de cita per a col·laboracions (estratègia §5). */
export const COLLAB_CALENDAR_URL = "https://calendar.app.google/MRVip8R9GcYYNCEz6";

/** Enllaç de trucada curta per a productes (mateix que CALL_BOOKING_URL del ServiceModal). */
export const PRODUCT_CALL_URL = "https://calendar.app.google/b4khxKQkiSNss4KR6";

// ─── Disposició del pas d'extres del configurador ───────────────────────────
// Viu aquí i no al component perquè es pugui provar sense navegador: quins
// mòduls surten a cada família, on va cada pack i què diu el caption de preu.
// El component només recorre el que retorna això. És on s'amaguen els errors
// de preu, que són els que acaben en una proposta.

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
