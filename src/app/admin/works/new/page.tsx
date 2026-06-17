import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase'
import { createDraftWork } from '../actions'

/**
 * /admin/works/new
 * --------------------------------------------------------------------
 * Aquesta ruta no renderitza cap formulari. La seva única missió és:
 *   1. Garantir que l'usuari és admin.
 *   2. Crear (o reutilitzar) un esborrany silenciosament.
 *   3. Redirigir a /admin/works/[id] on viu el formulari complet.
 *
 * Beneficis vs. l'antic flow Create + Edit:
 *   - El form complet (i18n, hero amb imatge, blocs, conclusió, etc.)
 *     està disponible des del moment 0.
 *   - L'usuari no ha de "guardar les dades mínimes" per accedir a la
 *     resta de camps.
 *   - Els ImageUploadField poden pujar imatges directament (la URL és
 *     la del work ja existent a la BD).
 *
 * Si es prem múltiples vegades, createDraftWork() reutilitza el darrer
 * draft buit (placeholder title, <24h) per evitar acumulació.
 */
export const dynamic = 'force-dynamic'

export default async function AdminWorkNewPage() {
  await requireAdmin()
  const newId = await createDraftWork()
  redirect(`/admin/works/${newId}`)
}
