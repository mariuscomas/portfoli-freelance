/**
 * Tests del càlcul d'auditoria (calcAudit).
 *   node --experimental-strip-types --test src/lib/pricing.audit.test.ts
 * Quadra amb l'escandall: 1 focus 600 · 2 focus 900 · 3 focus 1.100;
 * talles S/M/L +0/+300/+600; Tot + Benchmark = 1.350.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calcAudit,
  AUDIT_EXTRAS,
  AUDIT_SIZES,
} from "./pricing.ts";

test("base segons el nombre de focus (paquet)", () => {
  assert.equal(calcAudit({ focuses: ["ux"] }).total, 600);
  assert.equal(calcAudit({ focuses: ["ux", "ui"] }).total, 900);
  assert.equal(calcAudit({ focuses: ["ux", "ui", "dev"] }).total, 1100);
});

test("la base no depèn de QUIN focus, només de quants", () => {
  assert.equal(calcAudit({ focuses: ["dev"] }).baseTotal, 600);
  assert.equal(calcAudit({ focuses: ["ui"] }).baseTotal, 600);
});

test("talla afegeix l'increment correcte", () => {
  assert.equal(calcAudit({ focuses: ["ux", "ui", "dev"], size: "s" }).total, 1100);
  assert.equal(calcAudit({ focuses: ["ux", "ui", "dev"], size: "m" }).total, 1400);
  assert.equal(calcAudit({ focuses: ["ux", "ui", "dev"], size: "l" }).total, 1700);
});

test("sense talla → S per defecte (inclòs)", () => {
  const q = calcAudit({ focuses: ["ux"] });
  assert.equal(q.size.id, "s");
  assert.equal(q.sizeIncrement, 0);
});

test("estat del wireframe: Tot + Benchmark = 1.350 €", () => {
  const q = calcAudit({ focuses: ["ux", "ui", "dev"], extras: ["benchmark"] });
  assert.equal(q.total, 1350);
  assert.deepEqual(q.extras, [{ id: "benchmark", label: "Benchmark competitiu", amount: 250 }]);
});

test("extres sumen i respecten l'ordre del catàleg", () => {
  const q = calcAudit({
    focuses: ["ux"],
    extras: ["figma", "test", "benchmark"], // ordre d'entrada barrejat
  });
  assert.deepEqual(q.extras.map((e) => e.id), ["test", "benchmark", "figma"]);
  assert.equal(q.extrasTotal, 500 + 250 + 300);
  assert.equal(q.total, 600 + 1050);
});

test("ids d'extra desconeguts s'ignoren", () => {
  const q = calcAudit({ focuses: ["ux"], extras: ["inexistent", "benchmark"] });
  assert.equal(q.extras.length, 1);
  assert.equal(q.total, 850);
});

test("focus duplicats o desordenats es normalitzen", () => {
  const q = calcAudit({ focuses: ["dev", "ux", "ux"] });
  assert.deepEqual(q.focuses.map((f) => f.id), ["ux", "dev"]); // ordre canònic, sense duplicats
  assert.equal(q.baseTotal, 900); // compten 2 focus
});

test("sense focus → error (estat no vàlid)", () => {
  assert.throws(() => calcAudit({ focuses: [] }));
});

test("consistència de catàlegs", () => {
  assert.equal(AUDIT_EXTRAS.length, 7);
  assert.deepEqual(AUDIT_SIZES.map((s) => s.increment), [0, 300, 600]);
});
