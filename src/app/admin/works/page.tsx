import Link from 'next/link'
import { Plus } from '@phosphor-icons/react/dist/ssr'
import AdminShell from '@/components/admin/AdminShell'
import WorksList from '@/components/admin/WorksList'
import WorksFilterBar from '@/components/admin/WorksFilterBar'
import { requireAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic' // sempre dades fresques al dashboard

/**
 * Llistat /admin/works amb cerca + filtres a la URL.
 *
 * Filtres suportats (com a searchParams):
 *  - q          → cerca per títol CA (ilike %q%)
 *  - client     → client_id exact
 *  - role       → role_id exact
 *  - category   → category_id exact
 *  - year       → year exact (string '2024', '2025'…)
 *
 * Les opcions de cada filtre (clients, rols, categories, anys únics)
 * es carreguen en paral·lel al fetch principal. Així el filter bar pot
 * dibuixar els selects sense fer rounds-trips addicionals al client.
 */
export default async function AdminWorksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { user, supabase } = await requireAdmin()
  const params = await searchParams

  // Sanitiza els filtres — només acceptem strings ja existents. Si l'usuari
  // posa "?role=foo" amb un id que no existeix, simplement no filtra res
  // (la query ho ignorarà perquè cap row coincidirà).
  const q = typeof params.q === 'string' ? params.q.trim() : ''
  const clientFilter = typeof params.client === 'string' ? params.client : ''
  const roleFilter = typeof params.role === 'string' ? params.role : ''
  const categoryFilter = typeof params.category === 'string' ? params.category : ''
  const yearFilter = typeof params.year === 'string' ? params.year : ''

  // Query principal — apliquem filtres condicionalment.
  let worksQuery = supabase
    .from('works')
    .select(
      'id, title, slug, year, hero_color, content, client_id, client_name, role, role_id, category_id, short_description, conclusion, is_published, is_featured, order_index, created_at, updated_at'
    )

  if (q) {
    // El títol és JSON i18n — filtrem pel CA. `filter()` ens permet
    // expressions de columnes jsonb que `ilike()` directe no suporta.
    worksQuery = worksQuery.filter('title->>ca', 'ilike', `%${q}%`)
  }
  if (clientFilter) worksQuery = worksQuery.eq('client_id', clientFilter)
  if (roleFilter) worksQuery = worksQuery.eq('role_id', roleFilter)
  if (categoryFilter) worksQuery = worksQuery.eq('category_id', categoryFilter)
  if (yearFilter) worksQuery = worksQuery.eq('year', yearFilter)

  // En paral·lel: opcions de filtre + works filtrats. Els llistats de
  // taxonomies són petits (~desenes), així que els carreguem cada cop.
  const [
    { data: works, error },
    { data: clientsList },
    { data: rolesList },
    { data: categoriesList },
    { data: yearsRows },
  ] = await Promise.all([
    worksQuery
      .order('order_index', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('clients')
      .select('id, name, company')
      .order('company', { ascending: true })
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
    // Anys únics: agafem el camp `year` de tots els works i el deduplem
    // al servidor JS (Supabase JS no té DISTINCT directe). Volum petit.
    supabase
      .from('works')
      .select('year')
      .not('year', 'is', null)
      .order('year', { ascending: false }),
  ])

  // Anys únics ordenats descendents (més recent primer).
  const years = Array.from(
    new Set(
      (yearsRows ?? [])
        .map((r) => r.year)
        .filter((y): y is string => typeof y === 'string' && y.length > 0)
    )
  )

  /** Hi ha algun filtre actiu? Útil per al copy del empty state. */
  const isFiltered = Boolean(q || clientFilter || roleFilter || categoryFilter || yearFilter)

  return (
    <AdminShell user={user}>
      <div className="w-full max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-16">
        {/* Header */}
        <div className="flex items-end justify-between gap-6 mb-12 md:mb-16">
          <div className="flex flex-col gap-3">
            <span className="font-sans uppercase tracking-[0.15em] text-body-sm text-text-secondary">
              Dashboard · Treballs
            </span>
            <h1 className="text-heading-h1 text-text-main">Els teus treballs</h1>
            <p className="text-body-sm text-text-secondary max-w-prose">
              L&apos;ordre d&apos;aquesta llista és el mateix que veuen els visitants a /works.
              Arrossega els treballs per reordenar-los manualment.
            </p>
          </div>

          <Link
            href="/admin/works/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-text-main text-text-main-inverse rounded-full font-sans font-medium text-body-md hover:bg-accent hover:text-text-main transition-colors whitespace-nowrap"
          >
            <Plus size={18} weight="bold" />
            Nou treball
          </Link>
        </div>

        {/* Filter bar — cerca + chips. Visible només si hi ha works o
            filtres actius (no apareix al empty state inicial). */}
        {(works && works.length > 0) || isFiltered ? (
          <WorksFilterBar
            clients={clientsList ?? []}
            roles={rolesList ?? []}
            categories={categoriesList ?? []}
            years={years}
          />
        ) : null}

        {/* Errors */}
        {error && (
          <div className="mb-8 p-4 border border-error rounded-md bg-error-surface text-error">
            <p className="text-body-sm">{error.message}</p>
          </div>
        )}

        {/* Empty state — adaptat segons si és perquè no hi ha res o
            perquè els filtres no han retornat resultats. */}
        {!error && (!works || works.length === 0) && (
          <div className="flex flex-col items-start gap-6 py-16">
            {isFiltered ? (
              <p className="text-body-lg text-text-secondary max-w-md">
                Cap treball coincideix amb els filtres actuals. Prova d&apos;esborrar-los
                per veure tots els treballs.
              </p>
            ) : (
              <>
                <p className="text-body-lg text-text-secondary max-w-md">
                  Encara no tens cap treball publicat. Crea el primer per començar a omplir el portfolio.
                </p>
                <Link
                  href="/admin/works/new"
                  className="inline-flex items-center gap-2 text-text-main hover:text-accent transition-colors text-body-md font-medium border-b border-text-main hover:border-accent pb-1"
                >
                  <Plus size={18} weight="bold" />
                  Crea el primer treball
                </Link>
              </>
            )}
          </div>
        )}

        {/* Llistat reordenable. NOTE: el drag-and-drop reordena tots els
            works (no només els filtrats). Si l'usuari té filtres aplicats,
            el reorder podria ser confús — caldria considerar deshabilitar
            DnD quan hi ha filtres. Per ara assumim que l'usuari sap el que fa. */}
        {works && works.length > 0 && <WorksList works={works} />}
      </div>
    </AdminShell>
  )
}
