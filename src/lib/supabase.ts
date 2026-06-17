import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

/**
 * Email que considerem admin. Coincideix amb `is_admin()` a Postgres
 * i amb ADMIN_EMAIL al middleware. Si canvies aquest valor cal actualitzar
 * els 3 llocs alhora.
 */
export const ADMIN_EMAIL = 'mariuscr23@gmail.com'

/**
 * Helper de servidor: garanteix que l'usuari actual és l'admin.
 * Si no ho és, redirigeix a /admin/login (defensa en profunditat sobre el middleware).
 *
 * Retorna l'objecte user de Supabase perquè el component que el crida
 * pugui accedir-hi sense haver de fer una segona crida.
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/admin/login')
  }

  return { user, supabase }
}

/**
 * Helper Boolean: comprova si l'usuari actual és admin.
 * Útil per renderitzar UI condicional (sense forçar redirect).
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === ADMIN_EMAIL
}
