import Link from 'next/link'
import { Plus } from '@phosphor-icons/react/dist/ssr'
import AdminShell from '@/components/admin/AdminShell'
import ServicesList from '@/components/admin/ServicesList'
import { requireAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function AdminServicesPage() {
  const { user, supabase } = await requireAdmin()

  const { data: services, error } = await supabase
    .from('services')
    .select(
      'id, title, slug, icon_name, price_starts_at, short_description, duration, revisions, content_about, content_steps, content_deliverables, content_why_us, is_published, order_index, created_at, updated_at'
    )
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  return (
    <AdminShell user={user}>
      <div className="w-full max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-16">

        <div className="flex items-end justify-between gap-6 mb-12 md:mb-16">
          <div className="flex flex-col gap-3">
            <span className="font-sans uppercase tracking-[0.15em] text-body-sm text-text-secondary">
              Dashboard · Serveis
            </span>
            <h1 className="text-heading-h1 text-text-main">
              Els teus serveis
            </h1>
            <p className="text-body-sm text-text-secondary max-w-prose">
              L&apos;ordre d&apos;aquesta llista coincideix amb el que veuen els visitants a /serveis.
              Arrossega els serveis per reordenar-los manualment.
            </p>
          </div>

          <Link
            href="/admin/serveis/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-text-main text-text-main-inverse rounded-full font-sans font-medium text-body-md hover:bg-accent hover:text-text-main transition-colors whitespace-nowrap"
          >
            <Plus size={18} weight="bold" />
            Nou servei
          </Link>
        </div>

        {error && (
          <div className="mb-8 p-4 border border-error rounded-md bg-error-surface text-error">
            <p className="text-body-sm">{error.message}</p>
          </div>
        )}

        {!error && (!services || services.length === 0) && (
          <div className="flex flex-col items-start gap-6 py-16">
            <p className="text-body-lg text-text-secondary max-w-md">
              Encara no tens cap servei. Crea el primer per que aparegui a /serveis.
            </p>
            <Link
              href="/admin/serveis/new"
              className="inline-flex items-center gap-2 text-text-main hover:text-accent transition-colors text-body-md font-medium border-b border-text-main hover:border-accent pb-1"
            >
              <Plus size={18} weight="bold" />
              Crea el primer servei
            </Link>
          </div>
        )}

        {services && services.length > 0 && <ServicesList services={services} />}

      </div>
    </AdminShell>
  )
}
