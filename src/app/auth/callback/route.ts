import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { ADMIN_EMAIL } from '@/lib/supabase'

/**
 * Magic link callback.
 *
 * Quan l'usuari clica al magic link del seu email, Supabase el porta aquí
 * amb `?code=xxx&redirect=/admin/works`. Aquí canviem el code per una
 * session i el redirigim a la URL desitjada.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectPath = searchParams.get('redirect') || '/admin/works'

  // Validem que el redirect és relatiu (mai a un host extern → open redirect attack)
  const safeRedirect = redirectPath.startsWith('/') ? redirectPath : '/admin/works'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Verifiquem que l'usuari resultat és l'admin
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email === ADMIN_EMAIL) {
        return NextResponse.redirect(`${origin}${safeRedirect}`)
      }
      // No és admin → fora
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/admin/login?error=unauthorized`)
    }
  }

  // Codi invàlid / expirat
  return NextResponse.redirect(`${origin}/admin/login?error=expired`)
}
