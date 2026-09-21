import AdminShell from '@/components/admin/AdminShell'
import LeadsList from '@/components/admin/LeadsList'
import { requireAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * /admin/leads
 *
 * Bústia del que arriba pels formularis públics: missatges del modal de
 * contacte i altes de la newsletter del footer. Fins ara les dues taules
 * s'omplien sense que ningú les llegís.
 */
export default async function AdminLeadsPage() {
  const { user, supabase } = await requireAdmin()

  const [{ data: messages, error: msgError }, { data: subscribers, error: subError }] =
    await Promise.all([
      supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false }),
    ])

  const error = msgError || subError

  return (
    <AdminShell user={user}>
      <div className="w-full max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-16">
        <div className="flex flex-col gap-3 mb-12 md:mb-16">
          <span className="text-label text-text-secondary">Dashboard · Leads</span>
          <h1 className="text-display-s-medium md:text-display-m-medium lg:text-display-l-medium text-text-main">Missatges i subscripcions</h1>
          <p className="text-body-xs-light md:text-body-s-light text-text-secondary max-w-prose">
            El que arriba pel modal de contacte i per la newsletter del footer. Obre un
            missatge per veure&apos;l sencer, contestar-lo i moure&apos;l del camí.
          </p>
        </div>

        {error && (
          <p className="mb-8 rounded-card border border-error/40 bg-error/5 p-4 text-body-xs-light md:text-body-s-light text-error">
            No s&apos;han pogut carregar els leads: {error.message}
          </p>
        )}

        <LeadsList messages={messages ?? []} subscribers={subscribers ?? []} />
      </div>
    </AdminShell>
  )
}
