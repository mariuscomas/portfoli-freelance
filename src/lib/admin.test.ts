/**
 * Tests de la llista de comptes admin.
 *
 *   node --experimental-strip-types --test src/lib/admin.test.ts
 *
 * Aquesta funció ha de coincidir amb `public.is_admin()` de Postgres, que és
 * qui aplica les polítiques RLS. Comprovat el 16set26, després de treure el
 * compte de transició: la funció SQL fa
 * `lower(auth.jwt() ->> 'email') = 'hello@mariusfreelance.com'`. Si algú canvia
 * una banda sense l'altra, l'admin i la base de dades deixen de dir el mateix;
 * aquests tests almenys fixen el comportament d'aquí.
 */
import { test } from "node:test"
import assert from "node:assert/strict"
import { ADMIN_EMAILS, isAdminEmail } from "./admin.ts"

test("els comptes de la llista entren", () => {
  for (const email of ADMIN_EMAILS) {
    assert.equal(isAdminEmail(email), true, email)
  }
})

test("les majúscules no deixen ningú fora", () => {
  assert.equal(isAdminEmail("HELLO@MARIUSFREELANCE.COM"), true)
  assert.equal(isAdminEmail("Hello@Mariusfreelance.com"), true)
})

test("el compte de transició ja no hi és", () => {
  // Es va treure el 16set26 (migració 20260916190000_admin_single_account.sql).
  assert.equal(isAdminEmail("mariuscr23@gmail.com"), false)
  assert.equal(ADMIN_EMAILS.length, 1)
})

test("qualsevol altre compte queda fora", () => {
  for (const email of [
    "algu@example.com",
    "hello@mariusfreelance.com.evil.com",
    "xhello@mariusfreelance.com",
    "hello@mariusfreelance.co",
  ]) {
    assert.equal(isAdminEmail(email), false, email)
  }
})

test("sense email no hi ha accés", () => {
  assert.equal(isAdminEmail(null), false)
  assert.equal(isAdminEmail(undefined), false)
  assert.equal(isAdminEmail(""), false)
})
