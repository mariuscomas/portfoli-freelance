/**
 * Comptes amb accés a /admin.
 *
 * Font única per al client, el servidor i el middleware. Ha de coincidir amb
 * la funció `public.is_admin()` de Postgres, que és qui aplica les polítiques
 * RLS: si canvies aquesta llista, canvia també la funció (hi ha una migració
 * que ho fa).
 *
 * L'accés real el filtra Google abans d'arribar aquí: l'app OAuth és interna a
 * l'organització mariusfreelance.com, així que cap compte de fora pot ni
 * començar el flux. Aquesta llista és la segona barrera, no la primera.
 *
 * Un sol compte des del 16set26: mariuscr23@gmail.com hi era de transició
 * mentre quedessin sessions obertes del magic link, i es va treure en
 * comprovar que hello@ ja entrava amb Google i que el Gmail no entrava des del
 * 19 de juny (migració 20260916190000_admin_single_account.sql).
 */
export const ADMIN_EMAILS = [
  'hello@mariusfreelance.com',
] as const

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return (ADMIN_EMAILS as readonly string[]).includes(email.toLowerCase())
}
