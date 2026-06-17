import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Briefcase,
  Eye,
  EyeSlash,
  Plus,
} from '@phosphor-icons/react/dist/ssr'
import AdminShell from '@/components/admin/AdminShell'
import ClientForm from '@/components/admin/ClientForm'
import ClientNotesTimeline from '@/components/admin/ClientNotesTimeline'
import { requireAdmin } from '@/lib/supabase'
import {
  addClientNote,
  deleteClient,
  deleteClientNote,
  updateClient,
} from '../actions'
import type { Translatable } from '@/types/database'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

/**
 * /admin/clients/[id]
 *
 * Detall i edició d'una fitxa. Layout en dues columnes (md+):
 *   - Esquerra (2/3): formulari de la fitxa + llista de projectes vinculats.
 *   - Dreta (1/3): timeline d'interaccions sticky.
 *
 * A mòbil les columnes s'apilen verticalment.
 */
export default async function AdminClientEditPage({ params }: Props) {
  const { id } = await params
  const { user, supabase } = await requireAdmin()

  const [{ data: client, error: clientError }, { data: notes }, { data: works }] =
    await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase
        .from('client_notes')
        .select('*')
        .eq('client_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('works')
        .select('id, title, slug, year, is_published, main_image_url')
        .eq('client_id', id)
        .order('created_at', { ascending: false }),
    ])

  if (clientError || !client) {
    notFound()
  }

  // Bind dels server actions amb l'id del client per evitar passar-lo al
  // client component cada cop.
  const handleUpdate = async (formData: FormData) => {
    'use server'
    await updateClient(id, formData)
  }
  const handleDelete = async () => {
    'use server'
    await deleteClient(id)
  }
  const handleAddNote = async (formData: FormData) => {
    'use server'
    await addClientNote(id, formData)
  }
  const handleDeleteNote = async (noteId: string) => {
    'use server'
    await deleteClientNote(id, noteId)
  }

  return (
    <AdminShell user={user}>
      <div className="w-full max-w-7xl mx-auto px-6 md:px-10 py-10 md:py-16">
        <div className="flex flex-col gap-3 mb-8">
          <span className="font-sans uppercase tracking-[0.15em] text-body-sm text-text-secondary">
            Dashboard · Edició de client
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* ====== Columna esquerra (form + works vinculats) ====== */}
          <div className="lg:col-span-2 flex flex-col gap-8 min-w-0">
            <ClientForm
              mode="edit"
              client={client}
              onSubmit={handleUpdate}
              onDelete={handleDelete}
            />

            {/* ====== Projectes vinculats ====== */}
            <section
              aria-labelledby="works-linked-heading"
              className="flex flex-col gap-4 rounded-[var(--radius-base)] border border-surface-border bg-surface-card p-5 md:p-7"
            >
              <header className="flex items-end justify-between gap-4 flex-wrap">
                <div className="flex flex-col">
                  <span className="font-sans font-medium uppercase tracking-[0.18em] text-body-xs text-text-secondary">
                    Projectes vinculats
                  </span>
                  <h3
                    id="works-linked-heading"
                    className="text-body-lg text-text-main mt-1"
                  >
                    Treballs d&apos;aquest client
                    <span className="ml-2 text-text-secondary text-body-sm font-normal">
                      ({works?.length ?? 0})
                    </span>
                  </h3>
                </div>
                <Link
                  href="/admin/works"
                  className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-main transition-colors"
                  title="Per vincular un projecte nou, ves al treball i selecciona aquest client al formulari."
                >
                  <Plus size={14} weight="bold" />
                  Anar a Treballs
                </Link>
              </header>

              {(!works || works.length === 0) && (
                <p className="text-body-sm text-text-secondary py-4">
                  Aquest client encara no té cap projecte vinculat. Pots
                  vincular-li treballs des de la pàgina d&apos;edició de
                  cada treball.
                </p>
              )}

              {works && works.length > 0 && (
                <ul className="flex flex-col divide-y divide-surface-border -my-2">
                  {works.map((w) => {
                    const title = pickLocale(w.title)
                    const slug = pickLocale(w.slug)
                    return (
                      <li key={w.id}>
                        <Link
                          href={`/admin/works/${w.id}`}
                          className="flex items-center gap-4 py-3 group"
                        >
                          {/* Thumbnail */}
                          <div className="w-12 h-12 rounded-md bg-surface-base border border-surface-border overflow-hidden shrink-0 flex items-center justify-center">
                            {w.main_image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={w.main_image_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Briefcase
                                size={18}
                                weight="regular"
                                className="text-text-secondary/40"
                              />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-body-md text-text-main font-medium group-hover:text-accent transition-colors truncate">
                              {title || '(Sense títol)'}
                            </span>
                            <span className="text-body-xs text-text-secondary truncate">
                              /works/{slug || '...'}
                              {w.year && ` · ${w.year}`}
                            </span>
                          </div>

                          {/* Estat */}
                          {w.is_published ? (
                            <span className="inline-flex items-center gap-1.5 text-body-xs text-text-secondary shrink-0">
                              <Eye size={12} weight="regular" />
                              Publicat
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-body-xs text-text-secondary/70 shrink-0">
                              <EyeSlash size={12} weight="regular" />
                              Esborrany
                            </span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>

          {/* ====== Columna dreta (timeline sticky) ====== */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 lg:self-start">
            <ClientNotesTimeline
              clientId={id}
              notes={notes ?? []}
              onAdd={handleAddNote}
              onDelete={handleDeleteNote}
            />
          </div>
        </div>
      </div>
    </AdminShell>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                              */
/* ------------------------------------------------------------------ */

/** Selecciona el text del locale CA d'un camp i18n. Fallback EN/ES. */
function pickLocale(field: unknown): string {
  if (typeof field === 'string') return field
  if (typeof field === 'object' && field !== null) {
    const t = field as Translatable
    return t.ca ?? t.en ?? t.es ?? ''
  }
  return ''
}
