import AdminShell from '@/components/admin/AdminShell'
import ServicesList from '@/components/admin/ServicesList'
import { requireAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function AdminServicesPage() {
  const { user, supabase } = await requireAdmin()

  const { data: services, error } = await supabase
    .from('services')
    .select(
      'id, product_id, title, short_description, cta, includes, is_published, order_index, created_at, updated_at'
    )
    .order('order_index', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  return (
    <AdminShell user={user}>
      <div className="w-full max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-16">

        <div className="flex flex-col gap-3 mb-12 md:mb-16">
          <span className="text-label text-text-secondary">
            Dashboard · Serveis
          </span>
          <h1 className="text-heading-h1 text-text-main">
            Els teus productes
          </h1>
          <p className="text-body-sm text-text-secondary max-w-prose">
            Web, landing i auditoria. L&apos;ordre d&apos;aquesta llista és el de les
            cards a /serveis: arrossega&apos;ls per reordenar-los. Aquí s&apos;edita el
            copy; el preu surt del catàleg de codi.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 border border-error rounded-md bg-error-surface text-error">
            <p className="text-body-sm">{error.message}</p>
          </div>
        )}

        {!error && (!services || services.length === 0) && (
          <div className="flex flex-col items-start gap-6 py-16">
            <p className="text-body-lg text-text-secondary max-w-md">
              No hi ha cap producte a la taula. Mentre estigui buida, /serveis
              mostra el catàleg de codi. Els productes es creen per migració,
              no des d&apos;aquí.
            </p>
          </div>
        )}

        {services && services.length > 0 && <ServicesList services={services} />}

      </div>
    </AdminShell>
  )
}
