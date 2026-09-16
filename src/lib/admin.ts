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
 * mariuscr23@gmail.com hi és de transició, mentre quedin sessions obertes del
 * magic link; es pot treure quan el login amb Google estigui rodat.
 */
export const ADMIN_EMAILS = [
  'hello@mariusfreelance.com',
  'mariuscr23@gmail.com',
] as const

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return (ADMIN_EMAILS as readonly string[]).includes(email.toLowerCase())
}
