/**
 * Tests dels helpers de camps traduïbles.
 *
 *   node --experimental-strip-types --test src/lib/i18n.test.ts
 *
 * El que es vol saber aquí és si hi ha text a la base de dades que no arriba
 * mai a la pantalla. Fins al 16set26 en passava de dues maneres: una cadena
 * buida en català amagava la traducció que sí que hi era, i un idioma fora de
 * ca/en/es es perdia sencer.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { t, isTranslatable, flattenI18n } from "./i18n.ts"

// ————————————————————————————————— isTranslatable

test("reconeix un objecte d'idiomes", () => {
  assert.equal(isTranslatable({ ca: "Hola" }), true)
  assert.equal(isTranslatable({ ca: "Hola", en: "Hello" }), true)
  assert.equal(isTranslatable({ fr: "Bonjour" }), true)
})

test("no confon un objecte qualsevol amb una traducció", () => {
  assert.equal(isTranslatable({ title: "Hola" }), false)
  assert.equal(isTranslatable({}), false)
  assert.equal(isTranslatable([]), false)
  assert.equal(isTranslatable(null), false)
  assert.equal(isTranslatable("Hola"), false)
  assert.equal(isTranslatable({ ca: "Hola", extra: 1 }), false)
})

// ————————————————————————————————— t()

test("dona l'idioma demanat quan hi és", () => {
  assert.equal(t({ ca: "Hola", en: "Hello" }), "Hola")
  assert.equal(t({ ca: "Hola", en: "Hello" }, "en"), "Hello")
})

test("un string ja resolt passa tal qual", () => {
  assert.equal(t("Hola"), "Hola")
})

test("cau al català quan l'idioma demanat no hi és", () => {
  assert.equal(t({ ca: "Hola" }, "en"), "Hola")
})

test("una cadena buida no amaga la traducció que sí que hi ha", () => {
  // L'admin desa {ca: ''} quan es buida el camp: abans això retornava ''.
  assert.equal(t({ ca: "", en: "Hello" }), "Hello")
  assert.equal(t({ ca: "   ", en: "Hello" }), "Hello")
  assert.equal(t({ ca: "", en: "", es: "Hola" }), "Hola")
})

test("un idioma fora de ca/en/es no es perd", () => {
  assert.equal(t({ fr: "Bonjour" }), "Bonjour")
  assert.equal(t({ it: "Ciao" }, "en"), "Ciao")
})

test("ca, en i es manen per davant de la resta", () => {
  assert.equal(t({ fr: "Bonjour", es: "Hola" }), "Hola")
  assert.equal(t({ pt: "Olá", en: "Hello", ca: "Hola" }, "de"), "Hola")
})

test("retorna buit només quan no hi ha text enlloc", () => {
  assert.equal(t(null), "")
  assert.equal(t(undefined), "")
  assert.equal(t({ ca: "", en: "" }), "")
  assert.equal(t(42), "")
  assert.equal(t({ title: "no és un idioma" }), "")
})

// ————————————————————————————————— flattenI18n

test("aplana els camps traduïbles a qualsevol profunditat", () => {
  const content = {
    blocks: [
      { type: "text", body: { ca: "Primer", en: "First" } },
      { type: "media", caption: { ca: "", en: "Second" } },
    ],
    meta: { nested: { deep: { ca: "Fons" } } },
  }
  assert.deepEqual(flattenI18n(content, "ca"), {
    blocks: [
      { type: "text", body: "Primer" },
      { type: "media", caption: "Second" },
    ],
    meta: { nested: { deep: "Fons" } },
  })
})

test("aplanar respecta l'idioma demanat", () => {
  assert.deepEqual(flattenI18n({ a: { ca: "Hola", en: "Hello" } }, "en"), { a: "Hello" })
})

test("el que no és traduïble sobreviu intacte", () => {
  const input = { n: 42, ok: true, buit: null, llista: [1, 2] }
  assert.deepEqual(flattenI18n(input), input)
})
