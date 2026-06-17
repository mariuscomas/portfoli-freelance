import Link from 'next/link'
import { Plus } from '@phosphor-icons/react/dist/ssr'
import AdminShell from '@/components/admin/AdminShell'
import ClientsList, { type ClientRow } from '@/components/admin/ClientsList'
import { requireAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * /admin/clients
 *
 * Llistat dels clients i leads del portfolio. La pàgina és un Server
 * Component: fa la query Supabase + el JOIN amb la quantitat de works
 * vinculats, i passa les files (ja enriquides) al <ClientsList />
 * (client component que gestiona filtres, cerca i ordenació).
 *
 * Per evitar un JOIN potencialment lent (i pel volum esperat baix), fem
 * dues queries paral·leles i agreguem en memòria.
 */
export default async function AdminClientsPage() {
  const { user, supabase } = await requireAdmin()

  // 1. Tots els clients.
  // 2. Tots els works que tinguin client_id NOT NULL (per comptar projectes).
  const [{ data: clients, error: clientsError }, { data: works, error: worksError }] =
    await Promise.all([
      supabase
        .from('clients')
        .select('*')
        .order('updated_at', { ascending: false }),
      supabase
        .from('works')
        .select('client_id')
        .not('client_id', 'is', null),
    ])

  const error = clientsError || worksError

  // Agreguem en memòria: map client_id → comptador
  const worksByClient = new Map<string, number>()
  if (works) {
    for (const w of works) {
      if (!w.client_id) continue
      worksByClient.set(w.client_id, (worksByClient.get(w.client_id) ?? 0) + 1)
    }
  }

  const enriched: ClientRow[] = (clients ?? []).map((c) => ({
    ...c,
    works_count: worksByClient.get(c.id) ?? 0,
  }))

  return (
    <AdminShell user={user}>
      <div className="w-full max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-16">
        {/* ====== Header de pàgina ====== */}
        <div className="flex items-end justify-between gap-6 mb-12 md:mb-16">
          <div className="flex flex-col gap-3">
            <span className="font-sans uppercase tracking-[0.15em] text-body-sm text-text-secondary">
              Dashboard · Clients
            </span>
            <h1 className="text-heading-h1 text-text-main">
              CRM de clients i leads
            </h1>
            <p className="text-body-sm text-text-secondary max-w-prose">
              Guarda fitxes dels clients potencials i actius, fes seguiment de
              l&apos;estat al pipeline i vincula projectes (Treballs) a cada client.
            </p>
          </div>

          <Link
            href="/admin/clients/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-text-main text-text-main-inverse rounded-full font-sans font-medium text-body-md hover:bg-accent hover:text-text-main transition-colors whitespace-nowrap"
          >
            <Plus size={18} weight="bold" />
            Nou client
          </Link>
        </div>

        {error && (
          <div className="mb-8 p-4 border border-error rounded-md bg-error-surface text-error">
            <p className="text-body-sm">{error.message}</p>
          </div>
        )}

        {!error && enriched.length === 0 && (
          <div className="flex flex-col items-start gap-6 py-16">
            <p className="text-body-lg text-text-secondary max-w-md">
              Encara no tens cap client. Comença afegint la primera fitxa per
              guardar leads i contactes.
            </p>
            <Link
              href="/admin/clients/new"
              className="inline-flex items-center gap-2 text-text-main hover:text-accent transition-colors text-body-md font-medium border-b border-text-main hover:border-accent pb-1"
            >
              <Plus size={18} weight="bold" />
              Crea el primer client
            </Link>
          </div>
        )}

        {!error && enriched.length > 0 && <ClientsList clients={enriched} />}
      </div>
    </AdminShell>
  )
}
