/**
 * Tests dels mòduls i els packs del pla modular 2026.
 *
 *   node --experimental-strip-types --test src/lib/pricing.modules.test.ts
 *
 * Els vuit mòduls i els dos packs viuen NOMÉS al joc de preus v2, que està
 * darrere PRICING_V2_ENABLED (tancat). Es proven passant el joc explícitament,
 * igual que els esglaons a pricing.v2.test.ts.
 * Xifres: docs/pla-preus-modular-2026-09-16.md §4.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CONFIG_EXTRAS,
  PACKS,
  PRICING_SETS,
  calcConfiguration,
  type ConfigExtraId,
  type ConfigSelection,
} from "./pricing.ts";

const v2 = (selection: ConfigSelection) => calcConfiguration(selection, PRICING_SETS.v2);
const v1 = (selection: ConfigSelection) => calcConfiguration(selection, PRICING_SETS.v1);

/** Web de principi a fi, que és on hi ha tots els mòduls disponibles. */
const web = (modules: ConfigSelection["modules"] = {}): ConfigSelection => ({
  product: "web",
  disciplines: ["ux", "ui", "dev"],
  modules,
});

const linia = (q: ReturnType<typeof v2>, id: string) => q.extras.find((e) => e.id === id);

// ————————————————————————————————— El flag manda

test("amb el joc v1 no s’ofereix cap mòdul del pla nou", () => {
  const disponibles = v1(web()).availableExtras;
  for (const id of ["seo", "accessibilitat", "analitica", "integracio", "blog", "areaPrivada", "migracio", "formacio"] as ConfigExtraId[]) {
    assert.equal(disponibles.includes(id), false, `${id} no hauria de ser-hi al v1`);
  }
});

test("amb el joc v1 un mòdul demanat s’ignora del tot", () => {
  const q = v1(web({ seo: true, blog: true }));
  assert.equal(q.extras.length, 0);
  assert.equal(q.extrasTotal, 0);
});

// ————————————————————————————————— Preus dels vuit mòduls

test("cada mòdul cobra el preu del pla", () => {
  const casos: [ConfigExtraId, number][] = [
    ["seo", 300],
    ["accessibilitat", 350],
    ["analitica", 250],
    ["areaPrivada", 500],
    ["migracio", 150],
    ["integracio", 250],
  ];
  for (const [id, preu] of casos) {
    const q = v2(web({ [id]: true }));
    assert.equal(linia(q, id)?.amount, preu, `${id} hauria de cobrar ${preu}`);
    assert.equal(q.extrasTotal, preu);
  }
});

test("el blog DEMANA el CMS: sol no s'ofereix, amb CMS cobra 400", () => {
  // Un blog sense panell d'edició vol dir que cada entrada nova te l'han de
  // demanar a tu, i el copy promet que els continguts els publica el client.
  const sol = v2(web({ blog: true }));
  assert.ok(!sol.availableExtras.includes("blog"));
  assert.equal(sol.extrasTotal, 0);

  const ambCms = v2({ ...web({ blog: true }), cms: true });
  assert.ok(ambCms.availableExtras.includes("blog"));
  assert.equal(linia(ambCms, "blog")?.amount, 400);
});

test("les integracions són per unitat", () => {
  assert.equal(v2(web({ integracio: 2 })).extrasTotal, 500);
  assert.equal(v2(web({ integracio: 3 })).extrasTotal, 750);
});

// ————————————————————————————————— Disponibilitat

test("blog i àrea privada són només de web", () => {
  const landing = calcConfiguration(
    { product: "landing", disciplines: ["ux", "ui", "dev"], modules: { blog: true, areaPrivada: true } },
    PRICING_SETS.v2,
  );
  assert.equal(landing.availableExtras.includes("blog"), false);
  assert.equal(landing.availableExtras.includes("areaPrivada"), false);
  assert.equal(landing.extrasTotal, 0);
});

test("sense Dev no hi ha mòduls tècnics", () => {
  const q = calcConfiguration(
    { product: "web", disciplines: ["ux", "ui"], modules: { seo: true, analitica: true, integracio: 1 } },
    PRICING_SETS.v2,
  );
  for (const id of ["seo", "analitica", "integracio"] as ConfigExtraId[]) {
    assert.equal(q.availableExtras.includes(id), false);
  }
  assert.equal(q.extrasTotal, 0);
});

test("la formació del CMS no existeix sense el CMS", () => {
  const sense = v2(web({ formacio: true }));
  assert.equal(sense.availableExtras.includes("formacio"), false);
  assert.equal(sense.extrasTotal, 0);

  const amb = v2({ ...web({ formacio: true }), cms: true });
  assert.equal(amb.availableExtras.includes("formacio"), true);
  assert.equal(linia(amb, "formacio")?.amount, 150);
  assert.equal(amb.extrasTotal, 500 + 150);
});

// ————————————————————————————————— Packs

test("Pack Rendiment: 900 € de mòduls, 810 € amb el descompte", () => {
  const q = v2(web({ seo: true, analitica: true, accessibilitat: true }));
  assert.equal(linia(q, "pack-rendiment")?.amount, -90);
  assert.equal(q.extrasTotal, 810);
});

test("Pack Contingut: 1.200 € de mòduls, 1.080 € amb el descompte", () => {
  const q = v2({ ...web({ blog: true, formacio: true, migracio: true }), cms: true });
  assert.equal(linia(q, "pack-contingut")?.amount, -120);
  assert.equal(q.extrasTotal, 1080);
});

test("un pack incomplet no descompta res", () => {
  const q = v2(web({ seo: true, analitica: true }));
  assert.equal(linia(q, "pack-rendiment"), undefined);
  assert.equal(q.extrasTotal, 550);
});

test("el descompte del pack és l’última línia del desglòs", () => {
  const q = v2(web({ seo: true, analitica: true, accessibilitat: true }));
  assert.equal(q.extras.at(-1)?.id, "pack-rendiment");
  assert.ok(q.extras.slice(0, -1).every((e) => e.amount > 0));
});

test("els dos packs alhora sumen els dos descomptes", () => {
  const q = v2({
    ...web({ seo: true, analitica: true, accessibilitat: true, blog: true, formacio: true, migracio: true }),
    cms: true,
  });
  assert.equal(linia(q, "pack-rendiment")?.amount, -90);
  assert.equal(linia(q, "pack-contingut")?.amount, -120);
  assert.equal(q.extrasTotal, 810 + 1080);
});

// ————————————————————————————————— Coherència del catàleg

test("els imports dels packs quadren amb el catàleg", () => {
  const esperat: Record<string, number> = { contingut: 1200, rendiment: 900 };
  for (const pack of PACKS) {
    const suma = pack.modules.reduce((acc, id) => acc + CONFIG_EXTRAS[id].price, 0);
    assert.equal(suma, esperat[pack.id], `${pack.label} hauria de sumar ${esperat[pack.id]}`);
    assert.equal(pack.discountPct, 10);
  }
});

test("tot el catàleg declara família", () => {
  for (const [id, def] of Object.entries(CONFIG_EXTRAS)) {
    assert.ok(["amplia", "capacitats", "rendiment"].includes(def.family), `${id} sense família vàlida`);
  }
});

test("web completa amb el Pack Rendiment = 1.990 + 810", () => {
  const q = v2(web({ seo: true, analitica: true, accessibilitat: true }));
  assert.equal(q.baseTotal, 1990);
  assert.equal(q.total, 2800);
});

// Dependències visibles (24set26): sense CMS, el blog i la formació surten
// deshabilitats (lockedExtras), no amagats; amb CMS, passen a disponibles.
test("sense CMS, blog i formació queden bloquejats i no sumen", () => {
  const q = calcConfiguration(
    { product: "web", disciplines: ["ux", "ui", "dev"], modules: { blog: 1, formacio: 1 } },
    PRICING_SETS.v2,
  );
  assert.deepEqual([...q.lockedExtras].sort(), ["blog", "formacio"]);
  assert.equal(q.extras.some((e) => e.id === "blog" || e.id === "formacio"), false);
});

test("amb CMS, res no queda bloquejat", () => {
  const q = calcConfiguration({ product: "web", disciplines: ["ux", "ui", "dev"], cms: true }, PRICING_SETS.v2);
  assert.deepEqual(q.lockedExtras, []);
});

test("sense Dev, el blog no surt ni bloquejat (el CMS tampoc s'ofereix)", () => {
  const q = calcConfiguration({ product: "web", disciplines: ["ux"] }, PRICING_SETS.v2);
  assert.deepEqual(q.lockedExtras, []);
});

// Nota dinàmica del pack (24set26).
test("packStatus: cap, parcial i aplicat del Pack Rendiment", async () => {
  const { PACKS, packStatus } = await import("./pricing.ts");
  const p = PACKS.find((x) => x.id === "rendiment")!;
  const on = (ids: string[]) => (id: string) => ids.includes(id);
  assert.equal(packStatus(p, "web", on([])).state, "cap");
  assert.equal(packStatus(p, "web", on([])).tots, "SEO, analítica i accessibilitat");
  const parcial = packStatus(p, "web", on(["seo", "analitica"]));
  assert.equal(parcial.state, "parcial");
  assert.equal(parcial.falten, "accessibilitat");
  assert.equal(parcial.estalvi, 90);
  assert.equal(packStatus(p, "web", on(["seo", "analitica", "accessibilitat"])).state, "aplicat");
});
