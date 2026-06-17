import { notFound } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import WorkForm from '@/components/admin/WorkForm'
import { requireAdmin } from '@/lib/supabase'
import { updateWork, deleteWork } from '../actions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminWorkEditPage({ params }: Props) {
  const { id } = await params
  const { user, supabase } = await requireAdmin()

  const { data: work, error } = await supabase
    .from('works')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !work) {
    notFound()
  }

  // Slugs CA de la resta de works (per detectar duplicats al form),
  // llistat de clients per al selector del work, i taxonomies (rols +
  // categories) per als comboboxes. Tot en paral·lel per estalviar
  // latència — són queries petites i poden anar alhora.
  const [
    { data: otherWorks },
    { data: clientsList },
    { data: rolesList },
    { data: categoriesList },
  ] = await Promise.all([
    supabase.from('works').select('slug').neq('id', id),
    supabase
      .from('clients')
      .select('id, name, company')
      .order('name', { ascending: true }),
    supabase
      .from('work_roles')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('work_categories')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true }),
  ])

  const otherSlugsCa = (otherWorks || [])
    .map((w) => {
      const slug = w.slug as { ca?: string } | null
      return slug?.ca?.trim()
    })
    .filter((s): s is string => Boolean(s))

  // Bind id a les actions (Server Actions necessiten ser async (formData) => void)
  const handleUpdate = async (formData: FormData) => {
    'use server'
    await updateWork(id, formData)
  }
  const handleDelete = async () => {
    'use server'
    await deleteWork(id)
  }

  return (
    <AdminShell user={user}>
      {/* `pt-0`: el top bar del WorkForm és sticky top-0 i ha d'arrencar
          a la vora superior de <main> sense viatjar des d'un padding
          inicial. El `pb` manté l'espai abans del final del formulari. */}
      <div className="admin-edit-wrapper w-full px-6 md:px-10 pb-10 md:pb-16">
        {/* H1 invisible per a screen readers: el form ja té el seu propi
            header (h2) amb el títol contextual del treball + estat. */}
        <h1 className="sr-only">Editar treball</h1>

        <WorkForm
          mode="edit"
          work={work}
          otherSlugsCa={otherSlugsCa}
          clients={clientsList ?? []}
          roles={rolesList ?? []}
          categories={categoriesList ?? []}
          onSubmit={handleUpdate}
          onDelete={handleDelete}
        />
      </div>
    </AdminShell>
  )
}
