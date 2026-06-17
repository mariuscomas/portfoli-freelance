import AdminShell from '@/components/admin/AdminShell'
import ClientForm from '@/components/admin/ClientForm'
import { requireAdmin } from '@/lib/supabase'
import { createClient } from '../actions'

export const dynamic = 'force-dynamic'

export default async function AdminClientNewPage() {
  const { user } = await requireAdmin()

  return (
    <AdminShell user={user}>
      <div className="w-full max-w-4xl mx-auto px-6 md:px-10 py-10 md:py-16">
        <div className="flex flex-col gap-3 mb-8">
          <span className="font-sans uppercase tracking-[0.15em] text-body-sm text-text-secondary">
            Dashboard · Nou client
          </span>
          <h1 className="text-heading-h1 text-text-main">
            Crea un client nou
          </h1>
          <p className="text-body-md text-text-secondary max-w-prose">
            Només cal el nom per crear la fitxa. Després pots afegir contacte,
            origen, notes i vincular projectes des de la pàgina de detall.
          </p>
        </div>

        <ClientForm mode="create" onSubmit={createClient} />
      </div>
    </AdminShell>
  )
}
