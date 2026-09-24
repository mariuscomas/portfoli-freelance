/**
 * Tests de la validació compartida dels formularis públics.
 *
 * Runner integrat de Node (sense dependències), amb type stripping:
 *   node --experimental-strip-types --test src/lib/validation.test.ts
 *
 * El que es vol saber aquí és si un lead real pot quedar-se fora. Cada cas
 * d'error té el seu bessó vàlid a tocar, perquè una validació que ho rebutja
 * tot també passaria una suite que només provés adreces dolentes.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import {
  LIMITS,
  isValidEmail,
  isBot,
  MESSAGES,
  validateContact,
  validateNewsletter,
  validateQuote,
} from "./validation.ts"

// ————————————————————————————————— Email

test("accepta les formes d’adreça que fa servir la gent real", () => {
  for (const email of [
    "marius@example.com",
    "MARIUS@EXAMPLE.COM",
    "nom.cognom@example.com",
    "nom+etiqueta@example.com",
    "nom_cognom@sub.domini.example.com",
    "n@e.co",
    "marius@mariusfreelance.com",
  ]) {
    assert.equal(isValidEmail(email), true, email)
  }
})

test("rebutja el que no és una adreça", () => {
  for (const email of ["", "marius", "marius@", "@example.com", "marius@example", "marius example.com", "marius@exa mple.com"]) {
    assert.equal(isValidEmail(email), false, JSON.stringify(email))
  }
})

test("una adreça per sobre del límit de l’RFC no passa", () => {
  const llarga = "a".repeat(LIMITS.emailMax) + "@example.com"
  assert.equal(isValidEmail(llarga), false)
  assert.equal(llarga.length > LIMITS.emailMax, true)
})

// ————————————————————————————————— Honeypot

test("el honeypot només salta quan porta contingut", () => {
  assert.equal(isBot(undefined), false)
  assert.equal(isBot(null), false)
  assert.equal(isBot(""), false)
  assert.equal(isBot("   "), false, "espais sols no són un bot")
  assert.equal(isBot("http://spam"), true)
})

// ————————————————————————————————— Contacte

test("un missatge de contacte normal passa", () => {
  assert.equal(
    validateContact({ email: "hola@example.com", name: "Marina", message: "Voldria parlar d'una landing." }),
    null
  )
})

test("el nom és opcional", () => {
  assert.equal(validateContact({ email: "hola@example.com", message: "Hola que tal" }), null)
})

test("els límits de contacte avisen amb el missatge que toca", () => {
  assert.equal(validateContact({ email: "no", message: "Hola que tal" }), MESSAGES.email)
  assert.equal(validateContact({ email: "hola@example.com", message: "hola" }), MESSAGES.messageShort)
  assert.equal(
    validateContact({ email: "hola@example.com", message: "x".repeat(LIMITS.messageMax + 1) }),
    MESSAGES.messageLong
  )
  assert.equal(
    validateContact({ email: "hola@example.com", name: "n".repeat(LIMITS.nameMax + 1), message: "Hola que tal" }),
    MESSAGES.nameLong
  )
})

test("els valors just al límit són vàlids, no rebutjats", () => {
  assert.equal(validateContact({ email: "hola@example.com", message: "x".repeat(LIMITS.messageMin) }), null)
  assert.equal(validateContact({ email: "hola@example.com", message: "x".repeat(LIMITS.messageMax) }), null)
  assert.equal(
    validateContact({ email: "hola@example.com", name: "n".repeat(LIMITS.nameMax), message: "Hola que tal" }),
    null
  )
})

test("l'email es comprova abans que la longitud del missatge", () => {
  // Si es fes al revés, qui s'equivoca en les dues coses veuria primer un
  // error sobre el missatge i corregiria el que no toca.
  assert.equal(validateContact({ email: "no", message: "hi" }), MESSAGES.email)
})

// ————————————————————————————————— Newsletter

test("la newsletter només mira l’adreça", () => {
  assert.equal(validateNewsletter("hola@example.com"), null)
  assert.equal(validateNewsletter("hola"), MESSAGES.email)
})

// ————————————————————————————————— Quotes

const PRODUCTS = ["web", "landing", "auditoria", "collaboracio"] as const

test("una configuració enviada des del configurador passa", () => {
  assert.equal(
    validateQuote({ email: "hola@example.com", name: "Marina", message: "Web de 5 pàgines", product: "web", products: PRODUCTS }),
    null
  )
})

test("un producte que no és de la llista es rebutja", () => {
  assert.equal(
    validateQuote({ email: "hola@example.com", product: "hack", products: PRODUCTS }),
    MESSAGES.product
  )
})

test("els quatre productes del catàleg són vàlids", () => {
  for (const product of PRODUCTS) {
    assert.equal(validateQuote({ email: "hola@example.com", product, products: PRODUCTS }), null, product)
  }
})

test("el resum d’una quote té més marge que un missatge de contacte", () => {
  assert.equal(LIMITS.summaryMax > LIMITS.messageMax, true)
  assert.equal(
    validateQuote({ email: "hola@example.com", message: "x".repeat(LIMITS.summaryMax), product: "web", products: PRODUCTS }),
    null
  )
  assert.equal(
    validateQuote({ email: "hola@example.com", message: "x".repeat(LIMITS.summaryMax + 1), product: "web", products: PRODUCTS }),
    MESSAGES.summaryLong
  )
})

test("una quote sense resum ni nom és vàlida", () => {
  // El configurador pot enviar-los buits: la selecció i el càlcul ja van a part.
  assert.equal(validateQuote({ email: "hola@example.com", product: "collaboracio", products: PRODUCTS }), null)
})
