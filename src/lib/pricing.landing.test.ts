/**
 * Tests del càlcul de LANDING (calcConfiguration amb product: "landing").
 *   node --experimental-strip-types --test src/lib/pricing.landing.test.ts
 * Bases (De principi a fi 1.440 · UX 720 · UI 720 · Dev 960). Sense pàgines
 * extra ni CMS; redacció = 80 € (1 pàgina). Estats: Tot+Motion 1.840 · Dev+Motion 1.360.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcConfiguration, LANDING_BASE_PAGES, type Discipline } from "./pricing.ts";

const L = (
  disciplines: Discipline[],
  extra: Omit<Parameters<typeof calcConfiguration>[0], "disciplines" | "product"> = {},
) => calcConfiguration({ disciplines, product: "landing", ...extra });

test("bases de landing per disciplina i combinació", () => {
  assert.equal(L(["ux", "ui", "dev"]).baseTotal, 1440); // 240+240+240+480+240
  assert.equal(L(["ux"]).baseTotal, 720); // 240+240+240
  assert.equal(L(["ui"]).baseTotal, 720);
  assert.equal(L(["dev"]).baseTotal, 960); // 240+480+240
  assert.equal(L(["ux", "ui"]).baseTotal, 960); // 240+240+240+240
  assert.equal(L(["ux", "dev"]).baseTotal, 1200); // 240+240+480+240
});

test("estats dels mockups de landing", () => {
  assert.equal(L(["ux", "ui", "dev"], { motion: true }).total, 1840); // 1440 + 400
  assert.equal(L(["dev"], { motion: true }).total, 1360); // 960 + 400
});

test("la landing no té pàgines extra ni CMS", () => {
  assert.equal(L(["ux", "ui", "dev"], { pages: 5 }).total, 1440); // pàgines ignorades
  assert.equal(L(["ux", "ui", "dev"], { cms: true }).total, 1440); // CMS no disponible
  assert.ok(!L(["ux", "ui", "dev"]).availableExtras.includes("pagina"));
  assert.ok(!L(["ux", "ui", "dev"]).availableExtras.includes("cms"));
});

test("redacció a la landing = 80 € (1 pàgina base, no 5)", () => {
  const c = L(["ux", "ui", "dev"], { redaccio: true });
  assert.equal(c.extras.find((e) => e.id === "redaccio")?.amount, 80);
  assert.equal(c.total, 1520);
  assert.equal(LANDING_BASE_PAGES, 1);
});

test("UI landing no ofereix cap extra", () => {
  const c = L(["ui"], { motion: true, redaccio: true, languages: 3 });
  assert.equal(c.extras.length, 0);
  assert.equal(c.total, 720);
  assert.deepEqual(c.availableExtras, []);
});

test("Dev landing ofereix idioma i motion, no redacció", () => {
  const c = L(["dev"], { languages: 2, motion: true, redaccio: true });
  assert.deepEqual(
    c.extras.map((e) => e.id),
    ["idioma", "motion"],
  );
  assert.equal(c.extrasTotal, 150 * 2 + 400);
});

test("sense product, calcConfiguration segueix sent WEB (no trenca)", () => {
  assert.equal(calcConfiguration({ disciplines: ["ux", "ui", "dev"] }).baseTotal, 2400);
  assert.equal(
    calcConfiguration({ disciplines: ["ux", "ui", "dev"], product: "web" }).baseTotal,
    2400,
  );
});
