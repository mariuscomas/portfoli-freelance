/**
 * Tests del càlcul de tarifa de col·laboració (calcCollab).
 *   node --experimental-strip-types --test src/lib/pricing.collab.test.ts
 * Trams: ad-hoc 40 · setmana 38 · mes 35 · 3+ 30–32. Parcial → tram superior;
 * urgència → +10%.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcCollab, formatRate } from "./pricing.ts";

test("tarifes base per modalitat, sense modificadors", () => {
  const adhoc = calcCollab({ modality: "adhoc" });
  assert.equal(adhoc.rate, 40);
  assert.equal(adhoc.equivalent, null); // ad-hoc no té equivalent mensual

  const setmana = calcCollab({ modality: "setmana" });
  assert.equal(setmana.rate, 38);
  assert.equal(setmana.equivalent, 1520); // 38 × 40 h
  assert.equal(setmana.equivalentUnit, "setmana");

  const mes = calcCollab({ modality: "mes" });
  assert.equal(mes.rate, 35);
  assert.equal(mes.equivalent, 5600); // 35 × 160 h

  const compromis = calcCollab({ modality: "compromis" });
  assert.equal(compromis.rate, 30);
  assert.equal(compromis.rateMax, 32);
  assert.equal(compromis.equivalent, 4800); // 30 × 160 h (des de)
});

test("dedicació parcial puja al tram superior", () => {
  assert.equal(calcCollab({ modality: "compromis", partial: true }).rate, 35); // → mes
  assert.equal(calcCollab({ modality: "mes", partial: true }).rate, 38); // → setmana
  assert.equal(calcCollab({ modality: "setmana", partial: true }).rate, 40); // → ad-hoc
});

test("parcial elimina el rang (el tram superior és tarifa única)", () => {
  const q = calcCollab({ modality: "compromis", partial: true });
  assert.equal(q.rate, q.rateMax); // 35–35
  assert.match(q.modifiers[0], /tram superior/);
});

test("ad-hoc + parcial: ja és el sostre, sense canvi ni modificador", () => {
  const q = calcCollab({ modality: "adhoc", partial: true });
  assert.equal(q.rate, 40);
  assert.equal(q.modifiers.length, 0);
});

test("urgència aplica +10% arrodonit", () => {
  assert.equal(calcCollab({ modality: "mes", urgent: true }).rate, 39); // 35 × 1,1 = 38,5 → 39
  assert.equal(calcCollab({ modality: "setmana", urgent: true }).rate, 42); // 38 × 1,1 = 41,8 → 42
});

test("parcial + urgència es combinen (primer tram, després +10%)", () => {
  const q = calcCollab({ modality: "mes", partial: true, urgent: true });
  assert.equal(q.rate, 42); // mes→setmana 38, ×1,1 = 41,8 → 42
  assert.deepEqual(q.modifiers, ["Parcial · tram superior (38 €/h)", "Urgència +10%"]);
});

test("modalitat desconeguda llança", () => {
  // @ts-expect-error modalitat invàlida a propòsit
  assert.throws(() => calcCollab({ modality: "anual" }));
});

test("formatRate mostra rang o valor únic", () => {
  assert.equal(formatRate(calcCollab({ modality: "compromis" })), "30–32 €/h");
  assert.equal(formatRate(calcCollab({ modality: "mes" })), "35 €/h");
});
