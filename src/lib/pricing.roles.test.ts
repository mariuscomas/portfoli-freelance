/**
 * Tests del model de preus per DISCIPLINES (calcConfiguration, producte web).
 *
 * Runner integrat de Node (sense dependències), amb type stripping:
 *   node --experimental-strip-types --test src/lib/pricing.roles.test.ts
 *
 * Cobreix: bases per disciplina i combinacions (sense duplicar fases), els
 * estats dels wireframes (1.010 / 1.940 / 3.000), disponibilitat d'extres,
 * escalat de pàgina, redacció per pàgina, comptadors, clamps, etiquetes i format.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DISCIPLINE_ORDER,
  DISCIPLINES,
  FULL_SCOPE_LABEL,
  scopeLabel,
  disciplineIncludeLine,
  calcConfiguration,
  formatEuro,
  PRICING_SETS,
  type Discipline,
} from "./pricing.ts";

/**
 * Aquests tests verifiquen el joc v1.4, que és el que hi ha a producció. El
 * joc es passa EXPLÍCITAMENT: si depenguessin del joc actiu, la suite es
 * trencaria el dia que s'engegui PRICING_V2_ENABLED, i el que volem saber
 * aleshores és si el v2 calcula bé, no si el v1 ha deixat d'existir.
 * Els preus del pla nou viuen a pricing.v2.test.ts.
 */
const BASE_PAGES = PRICING_SETS.v1.web.basePages;

const q = (
  disciplines: Discipline[],
  extra: Omit<Parameters<typeof calcConfiguration>[0], "disciplines" | "product"> = {},
) => calcConfiguration({ disciplines, ...extra }, PRICING_SETS.v1);

// ————————————————————————————————— Bases per disciplina i combinació
test("una sola disciplina reprodueix el preu del paquet antic", () => {
  assert.equal(q(["ux"]).baseTotal, 960); // 240 + 480 + 240
  assert.equal(q(["ui"]).baseTotal, 960);
  assert.equal(q(["dev"]).baseTotal, 1440); // 240 + 960 + 240
});

test("les combinacions no dupliquen Immersió ni tancament", () => {
  assert.equal(q(["ux", "ui"]).baseTotal, 1440); // 240 + 480 + 480 + 240
  assert.equal(q(["ux", "dev"]).baseTotal, 1920); // 240 + 480 + 960 + 240
  assert.equal(q(["ui", "dev"]).baseTotal, 1920);
  assert.equal(q(["ux", "ui", "dev"]).baseTotal, 2400); // De principi a fi
});

test("el tancament és Posada en producció amb Dev, Lliurament sense", () => {
  assert.equal(q(["ux", "ui"]).phases.at(-1)?.label, "Lliurament i traspàs");
  assert.equal(q(["dev"]).phases.at(-1)?.label, "Posada en producció");
  assert.equal(q(["ux", "dev"]).phases.at(-1)?.label, "Posada en producció");
});

test("les fases surten en ordre: Immersió, disciplines, tancament", () => {
  assert.deepEqual(
    q(["ux"]).phases.map((p) => p.label),
    ["Immersió", "Disseny UX i arquitectura", "Lliurament i traspàs"],
  );
  assert.deepEqual(
    q(["ux", "ui", "dev"]).phases.map((p) => p.label),
    [
      "Immersió",
      "Disseny UX i arquitectura",
      "Disseny UI",
      "Desenvolupament a mida",
      "Posada en producció",
    ],
  );
});

test("disciplines buides = totes (De principi a fi)", () => {
  assert.equal(q([]).baseTotal, 2400);
  assert.deepEqual(q([]).disciplines, ["ux", "ui", "dev"]);
});

test("les disciplines es normalitzen a l’ordre canònic", () => {
  assert.deepEqual(q(["dev", "ux"]).disciplines, ["ux", "dev"]);
});

// ————————————————————————————————— Estats exactes dels wireframes
test("De principi a fi · 1 pàgina + Motion = 3.000 €", () => {
  const c = q(["ux", "ui", "dev"], { pages: 1, motion: true });
  assert.equal(c.total, 3000);
  assert.deepEqual(c.extras, [
    { id: "pagina", label: "Pàgines extra", amount: 200 },
    { id: "motion", label: "Motion i microinteraccions avançades", amount: 400 },
  ]);
});

test("UI · 1 pàgina = 1.010 € · UX · 1 pàgina = 1.010 €", () => {
  assert.equal(q(["ui"], { pages: 1 }).total, 1010);
  assert.equal(q(["ux"], { pages: 1 }).total, 1010);
});

test("Desenvolupament · 1 pàgina + Motion = 1.940 €", () => {
  const c = q(["dev"], { pages: 1, motion: true });
  assert.equal(c.total, 1940);
  assert.deepEqual(c.extras, [
    { id: "pagina", label: "Pàgines extra", amount: 100 },
    { id: "motion", label: "Motion i microinteraccions avançades", amount: 400 },
  ]);
});

// ————————————————————————————————— Escalat de pàgina extra
test("el preu de pàgina extra depèn de l’abast", () => {
  assert.equal(q(["ux", "ui", "dev"]).pageExtraPrice, 200);
  assert.equal(q(["dev"]).pageExtraPrice, 100); // dev sol
  assert.equal(q(["ux"]).pageExtraPrice, 50); // només disseny
  assert.equal(q(["ui"]).pageExtraPrice, 50);
  assert.equal(q(["ux", "ui"]).pageExtraPrice, 50); // disseny sense dev
  assert.equal(q(["ux", "dev"]).pageExtraPrice, 200); // dev + disseny
});

// ————————————————————————————————— Disponibilitat d'extres
test("UI sol no ofereix Motion/CMS/Idiomes, però sí Redacció", () => {
  const c = q(["ui"], { motion: true, cms: true, languages: 3 });
  assert.equal(c.total, 960);
  assert.equal(c.extras.length, 0);
  assert.deepEqual(c.availableExtras, ["pagina", "redaccio"]);
});

test("la Redacció surt SEMPRE; Dev afegeix Idiomes/Motion/CMS", () => {
  assert.deepEqual(q(["ux"]).availableExtras, ["pagina", "redaccio"]);
  assert.deepEqual(q(["dev"]).availableExtras, ["pagina", "idioma", "motion", "cms", "redaccio"]);
  assert.deepEqual(q(["ux", "ui", "dev"]).availableExtras, [
    "pagina",
    "idioma",
    "motion",
    "cms",
    "redaccio",
  ]);
});

test("un extra no disponible per l'abast s'ignora al total", () => {
  const c = q(["ux"], { motion: true, cms: true, languages: 2, redaccio: true });
  assert.deepEqual(
    c.extras.map((e) => e.id),
    ["redaccio"],
  ); // 80 × 5 = 400
  assert.equal(c.extrasTotal, 400);
});

// ————————————————————————————————— Redacció per pàgina
test("Redacció = 80 € × (pàgines base + extra)", () => {
  const c1 = q(["ux", "ui", "dev"], { pages: 1, redaccio: true });
  assert.equal(c1.extras.find((e) => e.id === "redaccio")?.amount, 480); // 6 pàgines
  const c0 = q(["ux", "ui", "dev"], { redaccio: true });
  assert.equal(c0.extras.find((e) => e.id === "redaccio")?.amount, BASE_PAGES * 80);
});

// ————————————————————————————————— Comptadors i clamps
test("idiomes extra: 150 € per idioma (només amb Dev)", () => {
  assert.equal(q(["dev"], { languages: 3 }).extrasTotal, 450);
});

test("quantitats 0 o negatives no generen línia d’extra", () => {
  const c = q(["ux", "ui", "dev"], { pages: 0, languages: -5 });
  assert.equal(c.extras.length, 0);
  assert.equal(c.total, 2400);
});

test("quantitats decimals s'arrodoneixen cap avall", () => {
  assert.equal(q(["ux", "ui", "dev"], { pages: 2.9 }).extrasTotal, 400); // 2 × 200
});

test("els extres surten en ordre de catàleg", () => {
  const c = q(["ux", "ui", "dev"], {
    pages: 1,
    languages: 1,
    motion: true,
    cms: true,
    redaccio: true,
  });
  assert.deepEqual(
    c.extras.map((e) => e.id),
    ["pagina", "idioma", "motion", "cms", "redaccio"],
  );
});

// ————————————————————————————————— Etiquetes i includes
test("scopeLabel: 'De principi a fi' per les tres, unió per combinacions", () => {
  assert.equal(scopeLabel(["ux", "ui", "dev"]), FULL_SCOPE_LABEL);
  assert.equal(scopeLabel(["ux"]), "Disseny UX");
  assert.equal(scopeLabel(["ux", "ui"]), "Disseny UX + Disseny UI");
  assert.equal(q(["dev"]).scopeLabel, "Desenvolupament");
});

test("includes: pàgines + disciplines triades + base; QA/formulari només amb Dev", () => {
  const inc = q(["ux", "ui"]).includes;
  assert.equal(inc[0], "5 pàgines: inici, qui som, serveis, contacte i legals");
  assert.ok(inc.includes("Disseny UI/UX a mida")); // ux+ui → una sola línia combinada
  assert.ok(!inc.some((i) => i.startsWith("QA"))); // sense dev, sense QA
  assert.ok(q(["dev"]).includes.some((i) => i.startsWith("QA")));
});

test("disciplineIncludeLine: una sola línia per combinació", () => {
  assert.equal(disciplineIncludeLine(["ux", "ui", "dev"]), "Disseny i desenvolupament a mida");
  assert.equal(disciplineIncludeLine(["ux", "dev"]), "Disseny UX i desenvolupament a mida");
  assert.equal(disciplineIncludeLine(["ui", "dev"]), "Disseny UI i desenvolupament a mida");
  assert.equal(disciplineIncludeLine(["dev"]), "Desenvolupament a mida");
  assert.equal(disciplineIncludeLine(["ux"]), "Disseny UX a mida");
  assert.equal(disciplineIncludeLine(["ui"]), "Disseny UI a mida");
  assert.equal(disciplineIncludeLine(["ux", "ui"]), "Disseny UI/UX a mida");
  // A la llista Base només hi ha UNA línia "a mida"
  assert.equal(q(["ux", "ui", "dev"]).includes.filter((i) => i.endsWith("a mida")).length, 1);
});

test("DISCIPLINE_ORDER i DISCIPLINES coherents", () => {
  assert.deepEqual(DISCIPLINE_ORDER, ["ux", "ui", "dev"]);
  assert.equal(DISCIPLINES.ux.label, "Disseny UX");
});

test("formatEuro dona milers amb punt i sense decimals", () => {
  const norm = (s: string) => s.replace(/\s/g, " ");
  assert.equal(norm(formatEuro(3000)), "3.000 €");
  assert.equal(norm(formatEuro(1010)), "1.010 €");
});
