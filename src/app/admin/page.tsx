import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase'

/**
 * /admin
 * Pàgina d'arrel del dashboard. Verifiquem auth i redirigim a la primera
 * vista útil (llistat de works).
 */
export default async function AdminIndexPage() {
  await requireAdmin()
  redirect('/admin/works')
}
