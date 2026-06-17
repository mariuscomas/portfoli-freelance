import { notFound } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import ServiceForm from '@/components/admin/ServiceForm'
import { requireAdmin } from '@/lib/supabase'
import { updateService, deleteService } from '../actions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminServiceEditPage({ params }: Props) {
  const { id } = await params
  const { user, supabase } = await requireAdmin()

  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !service) {
    notFound()
  }

  const handleUpdate = async (formData: FormData) => {
    'use server'
    await updateService(id, formData)
  }
  const handleDelete = async () => {
    'use server'
    await deleteService(id)
  }

  return (
    <AdminShell user={user}>
      <div className="w-full max-w-4xl mx-auto px-6 md:px-10 py-10 md:py-16">
        <div className="flex flex-col gap-3 mb-12">
          <span className="font-sans uppercase tracking-[0.15em] text-body-sm text-text-secondary">
            Dashboard · Edició
          </span>
          <h1 className="text-heading-h1 text-text-main">
            Editar servei
          </h1>
        </div>

        <ServiceForm
          mode="edit"
          service={service}
          onSubmit={handleUpdate}
          onDelete={handleDelete}
        />
      </div>
    </AdminShell>
  )
}
