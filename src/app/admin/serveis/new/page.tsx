import AdminShell from '@/components/admin/AdminShell'
import ServiceForm from '@/components/admin/ServiceForm'
import { requireAdmin } from '@/lib/supabase'
import { createService } from '../actions'

export default async function AdminServiceNewPage() {
  const { user } = await requireAdmin()

  return (
    <AdminShell user={user}>
      <div className="w-full max-w-4xl mx-auto px-6 md:px-10 py-10 md:py-16">
        <div className="flex flex-col gap-3 mb-12">
          <span className="font-sans uppercase tracking-[0.15em] text-body-sm text-text-secondary">
            Dashboard · Nou servei
          </span>
          <h1 className="text-heading-h1 text-text-main">
            Crea un servei nou
          </h1>
          <p className="text-body-md text-text-secondary max-w-prose">
            Comença amb el títol, slug i icona (nom d&apos;un Phosphor icon). Quan estigui creat podràs afegir descripcions, durada, preu i contingut detallat.
          </p>
        </div>

        <ServiceForm mode="create" onSubmit={createService} />
      </div>
    </AdminShell>
  )
}
