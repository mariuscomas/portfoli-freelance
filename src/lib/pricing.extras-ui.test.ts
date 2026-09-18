/**
 * Tests de la disposició del pas d'extres del configurador.
 *
 *   node --experimental-strip-types --test src/lib/pricing.extras-ui.test.ts
 *
 * La pantalla dels extres es va quedar enrere del catàleg: els cinc del v1
 * estaven escrits a mà i els vuit del pla modular 2026 no tenien interfície.
 * Ara es pinta des del catàleg, i això prova les regles que no són òbvies:
 * l'agrupació per famílies, on va cada pack, i que el caption digui el mateix
 * que cobrarà el desglòs.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calcConfiguration,
  groupExtras,
  crossFamilyPacks,
  packAmounts,
  packFamily,
  extraCaption,
  PRICING_SETS,
  PACKS,
  type ConfigSelection,
} from "./pricing.ts";

const v2 = (selection: ConfigSelection) => calcConfiguration(selection, PRICING_SETS.v2);
const webCompleta = (modules: ConfigSelection["modules"] = {}, extra: Partial<ConfigSelection> = {}) =>
  v2({ product: "web", disciplines: ["ux", "ui", "dev"], modules, ...extra });

// ————————————————————————————————— Famílies

test("els dotze mòduls d'una web completa surten repartits en tres famílies", () => {
  const q = webCompleta({}, { cms: true });
  const grups = groupExtras(q.availableExtras);
  assert.deepEqual(
    grups.map((g) => g.id),
    ["amplia", "capacitats", "rendiment"],
  );
  // Cap mòdul disponible es queda fora d'un grup: si en cau un, no es ven.
  const pintats = grups.flatMap((g) => g.ids);
  assert.deepEqual([...pintats].sort(), [...q.availableExtras].sort());
});

test("una família sense mòduls disponibles no es dibuixa", () => {
  // Landing amb UI sol: només hi ha redacció, que és de "rendiment".
  const q = v2({ product: "landing", disciplines: ["ui"] });
  const grups = groupExtras(q.availableExtras);
  assert.deepEqual(grups.map((g) => g.id), ["rendiment"]);
});

// ————————————————————————————————— Packs

test("el Pack Rendiment és d'una sola família i el Contingut en creua", () => {
  assert.equal(packFamily(PACKS.find((p) => p.id === "rendiment")!), "rendiment");
  assert.equal(packFamily(PACKS.find((p) => p.id === "contingut")!), null);
});

test("un pack NO s'anuncia si li falta algun mòdul disponible", () => {
  // Sense CMS actiu, el blog no s'ofereix, així que el Pack Contingut tampoc.
  const sense = webCompleta();
  assert.equal(crossFamilyPacks(sense.availableExtras).length, 0);

  const amb = webCompleta({}, { cms: true });
  assert.deepEqual(
    crossFamilyPacks(amb.availableExtras).map((p) => p.id),
    ["contingut"],
  );
});

test("el Pack Rendiment surt dins de la seva família amb el descompte calculat", () => {
  const q = webCompleta({}, { cms: true });
  const rendiment = groupExtras(q.availableExtras).find((g) => g.id === "rendiment")!;
  assert.deepEqual(rendiment.packs.map((p) => p.id), ["rendiment"]);

  const { suma, amb } = packAmounts(PACKS.find((p) => p.id === "rendiment")!, "web");
  assert.equal(suma, 900);
  assert.equal(amb, 810);
});

// ————————————————————————————————— Captions

test("el caption diu el MATEIX que cobrarà el desglòs", () => {
  const q = webCompleta({ seo: true });
  assert.equal(extraCaption("seo", "web", q, 1), "+300 €");
  assert.equal(q.extras.find((e) => e.id === "seo")?.amount, 300);
});

test("les pàgines cobren el preu de l'abast, no el del catàleg", () => {
  const devSol = v2({ product: "web", disciplines: ["dev"] });
  assert.equal(devSol.pageExtraPrice, 100);
  assert.equal(extraCaption("pagina", "web", devSol, 0), "+100 €/PÀGINA");
});

test("la redacció: per pàgina a la web, preu tancat a la landing", () => {
  const web = webCompleta({}, { redaccio: true });
  assert.equal(extraCaption("redaccio", "web", web, 1), "+240 € (3 pàg. × 80 €)");
  assert.equal(web.extras.find((e) => e.id === "redaccio")?.amount, 240);

  const land = v2({ product: "landing", disciplines: ["ux", "ui", "dev"], redaccio: true });
  assert.equal(extraCaption("redaccio", "landing", land, 1), "+240 €");
  assert.equal(land.extras.find((e) => e.id === "redaccio")?.amount, 240);
});

test("sense marcar, la redacció d'una web anuncia el preu per pàgina", () => {
  assert.equal(extraCaption("redaccio", "web", webCompleta(), 0), "+80 €/PÀGINA");
});
