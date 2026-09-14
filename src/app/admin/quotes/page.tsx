import AdminShell from '@/components/admin/AdminShell'
import QuotesList from '@/components/admin/QuotesList'
import { requireAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * /admin/quotes
 *
 * Pipeline de configuracions rebudes des dels configuradors (web/landing/
 * auditoria/col·laboració). Server Component: query a `quotes` ordenada per
 * data i passada al <QuotesList /> (filtres, cerca, detall i canvi d'estat).
 */
export default async function AdminQuotesPage() {
  const { user, supabase } = await requireAdmin()

  const [{ data: quotes, error }, { data: clients }] = await Promise.all([
    supabase.from('quotes').select('*').order('created_at', { ascending: false }),
    supabase.from('clients').select('id, name, company').order('name', { ascending: true }),
  ])

  return (
    <AdminShell user={user}>
      <div className="w-full max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-16">
        <div className="flex flex-col gap-3 mb-12 md:mb-16">
          <span className="text-label text-text-secondary">Dashboard · Pressupostos</span>
          <h1 className="text-heading-h1 text-text-main">Configuracions rebudes</h1>
          <p className="text-body-sm text-text-secondary max-w-prose">
            Cada fila és una configuració enviada des d&apos;un configurador, amb el preu
            congelat en el moment. Filtra per estat, obre el detall i mou-la pel pipeline.
          </p>
        </div>

        {error && (
          <p className="mb-8 rounded-card border border-error/40 bg-error/5 p-4 text-body-sm text-error">
            No s&apos;han pogut carregar els pressupostos: {error.message}
          </p>
        )}

        <QuotesList quotes={quotes ?? []} clients={clients ?? []} />
      </div>
    </AdminShell>
  )
}
