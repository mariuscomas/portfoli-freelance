/**
 * Tests del joc de preus v2 — pla modular 2026 (600 · 990 · 1.990).
 *
 * Runner integrat de Node (sense dependències), amb type stripping:
 *   node --experimental-strip-types --test src/lib/pricing.v2.test.ts
 *
 * Aquests preus estan DECIDITS i NO publicats: PRICING_V2_ENABLED és false i
 * producció segueix amb el v1. Es proven igualment, passant el joc a
 * calcConfiguration, perquè el dia que s'engegui el flag no hi hagi sorpreses.
 * Les xifres surten de docs/pla-preus-modular-2026-09-16.md.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AUDIT_BASE_BY_COUNT,
  BASE_LANDING,
  BASE_WEB,
  PRICING_SETS,
  PRICING_V2_ENABLED,
  calcConfiguration,
  type ConfigProduct,
  type Discipline,
} from "./pricing.ts";

const v2 = (product: ConfigProduct, disciplines: Discipline[]) =>
  calcConfiguration({ product, disciplines }, PRICING_SETS.v2).baseTotal;

const v1 = (product: ConfigProduct, disciplines: Discipline[]) =>
  calcConfiguration({ product, disciplines }, PRICING_SETS.v1).baseTotal;

// ————————————————————————————————— Web: 340 · 420 · 420 · 570 · 240 / 190

test("v2 web — els parcials del pla", () => {
  assert.equal(v2("web", ["ux"]), 950); // 340 + 420 + 190 (lliurament)
  assert.equal(v2("web", ["ui"]), 950);
  assert.equal(v2("web", ["ux", "ui"]), 1370); // 340 + 420 + 420 + 190
  assert.equal(v2("web", ["dev"]), 1150); // 340 + 570 + 240 (producció)
  assert.equal(v2("web", ["ux", "dev"]), 1570); // 340 + 420 + 570 + 240
  assert.equal(v2("web", ["ui", "dev"]), 1570);
});

test("v2 web — de principi a fi són 1.990", () => {
  assert.equal(v2("web", ["ux", "ui", "dev"]), 1990);
});

test("v2 web — la base baixa a 3 pàgines", () => {
  assert.equal(PRICING_SETS.v2.web.basePages, 3);
  assert.equal(calcConfiguration({ disciplines: [] }, PRICING_SETS.v2).totalPages, 3);
});

// ————————————————————————————————— Landing: 240 · 175 · 175 · 210 · 190 / 155

test("v2 landing — els parcials del pla", () => {
  assert.equal(v2("landing", ["ux"]), 570); // 240 + 175 + 155
  assert.equal(v2("landing", ["ui"]), 570);
  assert.equal(v2("landing", ["ux", "ui"]), 745); // 240 + 175 + 175 + 155
  assert.equal(v2("landing", ["dev"]), 640); // 240 + 210 + 190
  assert.equal(v2("landing", ["ux", "dev"]), 815); // 240 + 175 + 210 + 190
  assert.equal(v2("landing", ["ui", "dev"]), 815);
});

test("v2 landing — de principi a fi són 990, la barrera dels 1.000", () => {
  assert.equal(v2("landing", ["ux", "ui", "dev"]), 990);
});

// ————————————————————————————————— El tancament partit

test("v2 — el tancament val diferent amb Dev i sense", () => {
  const sense = calcConfiguration({ disciplines: ["ux"] }, PRICING_SETS.v2);
  const amb = calcConfiguration({ disciplines: ["dev"] }, PRICING_SETS.v2);
  assert.equal(sense.phases.at(-1)?.label, "Lliurament i traspàs");
  assert.equal(sense.phases.at(-1)?.amount, 190);
  assert.equal(amb.phases.at(-1)?.label, "Posada en producció");
  assert.equal(amb.phases.at(-1)?.amount, 240);
});

test("v1 — el tancament valia igual als dos costats", () => {
  const sense = calcConfiguration({ disciplines: ["ux"] }, PRICING_SETS.v1);
  const amb = calcConfiguration({ disciplines: ["dev"] }, PRICING_SETS.v1);
  assert.equal(sense.phases.at(-1)?.amount, 240);
  assert.equal(amb.phases.at(-1)?.amount, 240);
});

// ————————————————————————————————— Guardes

test("l'auditoria no es toca al repricing", () => {
  assert.deepEqual(AUDIT_BASE_BY_COUNT, { 1: 600, 2: 900, 3: 1100 });
});

test("el v1 no s’ha mogut: producció segueix a 2.400 i 1.440", () => {
  assert.equal(v1("web", ["ux", "ui", "dev"]), 2400);
  assert.equal(v1("landing", ["ux", "ui", "dev"]), 1440);
});

test("el flag mana: el 'des de' del hub segueix el joc que tria el flag", () => {
  // Val per als dos estats: si algun dia s'engega PRICING_V2_ENABLED, aquest
  // test no s'ha de tocar, i segueix sent la guarda que BASE_WEB no queda
  // cablejat a mà en comptes de derivar-se del joc actiu.
  const expected = PRICING_V2_ENABLED
    ? { web: 1990, landing: 990 }
    : { web: 2400, landing: 1440 };
  assert.equal(BASE_WEB, expected.web);
  assert.equal(BASE_LANDING, expected.landing);
});
