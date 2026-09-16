import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

/**
 * Només /admin i /auth.
 *
 * Fitxer renombrat de `middleware.ts` a `proxy.ts` el 16set26: Next 16 deprecà
 * el conveni `middleware` i el va reanomenar `proxy` (mateixa API, només canvia
 * el nom del fitxer i de la funció). `src/utils/supabase/middleware.ts` NO es
 * toca: és un mòdul propi, no un conveni de Next.
 *
 * Abans el matcher cobria tot el web, i `updateSession` crida
 * `supabase.auth.getUser()` — una petició al servidor d'auth de Supabase a
 * cada navegació, també per a un visitant anònim que mira /works. Cap ruta
 * pública fa servir la sessió: la zona privada llegeix les cookies pel seu
 * compte amb el client de servidor.
 *
 * Efecte secundari conegut: el preview d'admin a /works/[slug]?preview=draft
 * viu en una ruta pública, així que ja no se li refresca el token pel camí. Si
 * la sessió ha caducat, el banner de preview no apareix fins a passar per
 * /admin i tornar-hi.
 */
export const config = {
  matcher: ['/admin/:path*', '/auth/:path*'],
}
