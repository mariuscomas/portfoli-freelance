/**
 * Tests dels estats i del copy de la bústia de leads.
 *
 *   node --experimental-strip-types --test src/lib/leads.test.ts
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  CONTACT_STATUSES,
  CONTACT_STATUS_LABEL,
  CONTACT_FILTERS,
  CONTACT_FILTER_LABEL,
  isContactStatus,
  cleanMessage,
} from "./leads.ts"

test("cada estat i cada filtre tenen etiqueta", () => {
  for (const s of CONTACT_STATUSES) {
    assert.equal(typeof CONTACT_STATUS_LABEL[s], "string")
    assert.notEqual(CONTACT_STATUS_LABEL[s].length, 0, s)
  }
  for (const f of CONTACT_FILTERS) {
    assert.equal(typeof CONTACT_FILTER_LABEL[f], "string")
    assert.notEqual(CONTACT_FILTER_LABEL[f].length, 0, f)
  }
})

test("'read' no és un estat de la bústia", () => {
  // El CHECK de contact_submissions l'admet, però la pantalla no el manté.
  assert.equal(isContactStatus("read"), false)
})

test("isContactStatus filtra el que ve de la URL", () => {
  assert.equal(isContactStatus("new"), true)
  assert.equal(isContactStatus("archived"), true)
  assert.equal(isContactStatus("qualsevol"), false)
  assert.equal(isContactStatus(""), false)
})

test("el sufix d'origen del modal desapareix del missatge", () => {
  assert.equal(cleanMessage("Hola!\n\n— [via /serveis]"), "Hola!")
  assert.equal(cleanMessage("Hola!\n— [via Configurador web]"), "Hola!")
})

test("un missatge sense sufix no es toca, més enllà dels espais", () => {
  assert.equal(cleanMessage("Hola, voldria una web."), "Hola, voldria una web.")
  assert.equal(cleanMessage("  Hola  "), "Hola")
})

test("un guió llarg enmig del text sobreviu", () => {
  // Només s'elimina el sufix del final, no qualsevol guió que hi hagi.
  const text = "Vull una web — i ràpid"
  assert.equal(cleanMessage(text), text)
})
