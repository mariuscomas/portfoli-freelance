import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Email que considerem "admin" del portfolio. Coincideix amb el valor usat
 * a la funció `public.is_admin()` de Supabase (Postgres RLS).
 *
 * Si canvies aquest email, actualitza també la migració RLS.
 */
const ADMIN_EMAIL = 'mariuscr23@gmail.com'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresca la sessió si ha expirat — necessari per a Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const { data: { user } } = await supabase.auth.getUser()

  // Protecció de la zona admin (excepte la pàgina de login).
  // Si l'usuari no està autenticat o no és l'admin, el redirigim a /admin/login.
  const path = request.nextUrl.pathname
  const isAdminArea = path.startsWith('/admin')
  const isLoginPage = path === '/admin/login' || path.startsWith('/admin/login/')
  const isAuthCallback = path.startsWith('/auth/callback')

  if (isAdminArea && !isLoginPage && !isAuthCallback) {
    const isAdmin = user?.email === ADMIN_EMAIL
    if (!isAdmin) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      // Conservem la URL d'origen perquè post-login retornem on volia anar
      loginUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}
