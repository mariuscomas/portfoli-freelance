"use client"

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, EnvelopeSimple, CheckCircle } from '@phosphor-icons/react'
import { createClient } from '@/utils/supabase/client'

type FormState = 'idle' | 'submitting' | 'sent' | 'error'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin/works'

  const [email, setEmail] = useState('')
  const [state, setState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setState('submitting')
    setErrorMessage('')

    const supabase = createClient()

    // Origin dinàmic perquè funcioni a localhost, preview i prod
    const emailRedirectTo = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
        // shouldCreateUser:false perquè no es creïn comptes nous accidentalment
        // L'usuari admin ja ha d'estar a auth.users
        shouldCreateUser: false,
      },
    })

    if (error) {
      setState('error')
      setErrorMessage(error.message)
      return
    }

    setState('sent')
  }

  if (state === 'sent') {
    return (
      <div className="flex flex-col items-start gap-6 max-w-md">
        <CheckCircle size={48} weight="thin" className="text-accent" />
        <h1 className="text-display-h4 text-text-main">Revisa el teu correu</h1>
        <p className="text-body-lg text-text-secondary leading-relaxed">
          T&apos;he enviat un magic link a <span className="text-text-main font-medium">{email}</span>.
          Clica l&apos;enllaç per entrar al dashboard.
        </p>
        <button
          onClick={() => { setEmail(''); setState('idle') }}
          className="font-sans text-body-md text-text-secondary hover:text-accent transition-colors duration-300 underline underline-offset-4"
        >
          Provar amb un altre correu
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-md w-full">
      <div className="flex flex-col gap-4">
        <span className="font-sans uppercase tracking-[0.15em] text-body-sm text-text-secondary">
          Admin · Magic link
        </span>
        <h1 className="text-display-h4 text-text-main">Entra al dashboard</h1>
        <p className="text-body-lg text-text-secondary leading-relaxed">
          Posa el teu email i t&apos;enviaré un enllaç màgic per accedir.
        </p>
      </div>

      <div className="relative flex items-center w-full group">
        <EnvelopeSimple
          size={24}
          weight="regular"
          className="absolute left-0 text-text-secondary"
          aria-hidden="true"
        />
        <input
          type="email"
          required
          autoFocus
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="mariuscr23@gmail.com"
          disabled={state === 'submitting'}
          className="w-full bg-transparent border-b border-text-secondary/40 pl-10 pr-12 py-4 text-text-main font-sans text-2xl focus:outline-none focus:border-text-main transition-colors placeholder:text-text-secondary/40 disabled:opacity-50"
          aria-label="Email"
        />
        <button
          type="submit"
          disabled={state === 'submitting' || !email}
          className="absolute right-0 bottom-3 text-text-main opacity-60 hover:opacity-100 hover:text-accent hover:translate-x-1 transition-all p-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:translate-x-0"
          aria-label="Enviar magic link"
        >
          <ArrowRight size={28} weight="regular" />
        </button>
      </div>

      {state === 'error' && (
        <p role="alert" className="text-body-sm text-error">
          {errorMessage || 'Alguna cosa ha anat malament. Torna-ho a provar.'}
        </p>
      )}

      <p className="text-body-xs text-text-secondary/70 leading-relaxed">
        Només els emails autoritzats poden entrar. Si la teva sol·licitud no funciona, contacta amb Màrius.
      </p>
    </form>
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
