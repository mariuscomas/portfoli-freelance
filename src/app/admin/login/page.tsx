"use client"

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { GoogleLogo } from '@phosphor-icons/react'
import { createClient } from '@/utils/supabase/client'

/**
 * /admin/login
 *
 * Accés amb Google. Abans hi havia un magic link per correu, i donava dos
 * problemes: el límit d'enviaments de Supabase i el code verifier del PKCE,
 * que es trenca si l'enllaç s'obre en un navegador diferent del que el demana.
 *
 * L'app OAuth és interna a l'organització mariusfreelance.com: Google ja no
 * deixa començar el flux a ningú de fora. La segona barrera és
 * /auth/callback, que tanca la sessió si el correu no és a ADMIN_EMAILS.
 */
function LoginForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin/works'
  const initialError = searchParams.get('error') === 'unauthorized'
    ? 'Aquest compte no té accés al dashboard.'
    : ''

  const [state, setState] = useState<'idle' | 'redirecting'>('idle')
  const [errorMessage, setErrorMessage] = useState(initialError)

  const handleSignIn = async () => {
    setState('redirecting')
    setErrorMessage('')

    const supabase = createClient()
    // Origin dinàmic perquè funcioni a localhost, preview i producció.
    const redirectTo = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })

    if (error) {
      setState('idle')
      setErrorMessage(error.message)
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-md w-full">
      <div className="flex flex-col gap-4">
        <span className="text-label text-text-secondary">Admin · Accés</span>
        <h1 className="text-body-l-semibold md:text-display-2xs lg:text-display-m text-text-main">Entra al dashboard</h1>
        <p className="text-body-l lg:text-body-xl text-text-secondary leading-relaxed">
          Accedeix amb el compte de Google autoritzat.
        </p>
      </div>

      <button
        type="button"
        onClick={handleSignIn}
        disabled={state === 'redirecting'}
        className="inline-flex w-fit items-center gap-3 rounded-card bg-text-main px-8 py-5 font-sans text-body-s md:text-body-m lg:text-body-l text-text-main-inverse transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <GoogleLogo size={24} weight="regular" aria-hidden="true" />
        {state === 'redirecting' ? 'Obrint Google…' : 'Entra amb Google'}
      </button>

      {errorMessage && (
        <p role="alert" className="text-body-xs-light md:text-body-s-light text-error">
          {errorMessage}
        </p>
      )}

      <p className="text-body-2xs md:text-body-xs text-text-secondary/70 leading-relaxed">
        Només el compte autoritzat pot entrar.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col justify-center items-start px-6 md:px-12 lg:px-24 py-20">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
