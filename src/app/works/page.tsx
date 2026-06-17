import WorksGallery from "@/components/works/WorksGallery";
import { createClient } from "@/utils/supabase/server";
import { Project } from "@/types";
import { t } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Treballs",
  description:
    "Selecció de case studies recents — disseny de producte, UI/UX, design systems i mobile apps.",
  path: "/works",
});

export default async function TreballsPage() {
  const supabase = await createClient();

  // JOIN explícit amb àlies per evitar conflicte amb les columnes jsonb
  // legacy `role` i `category`. `role_ref`/`category_ref` són les
  // taxonomies actuals via FK. Si la FK és NULL, fem fallback al jsonb.
  const { data: works } = await supabase
    .from("works")
    .select("*, role_ref:work_roles(id, name), category_ref:work_categories(id, name)")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  // Mapegem cada row de Supabase al tipus Project que consumeix WorksGallery.
  // bgColor surt de content.hero.backgroundColor (canonical) amb fallback
  // a hero_color (legacy per a works pre-unificació).
  // `category` (label visible al llistat) ve del rol — històricament aquest
  // camp s'ha mostrat com a "rol" del projecte. Prioritat:
  //  1) taxonomy via FK (work.role_ref.name)
  //  2) jsonb legacy (work.role) per a entrades pre-migració.
  const projects: Project[] = (works || []).map((work) => {
    const heroContent = (work.content as { hero?: { backgroundColor?: string } } | null)?.hero
    const bgColor = heroContent?.backgroundColor || work.hero_color || undefined
    const roleRef = (work as { role_ref?: { name?: unknown } | null }).role_ref
    const roleName = roleRef?.name ? t(roleRef.name) : t(work.role)
    return {
      id: work.id,
      title: t(work.title),
      category: roleName || "Project",
      slug: t(work.slug),
      image: work.main_image_url || undefined,
      bgColor,
    }
  });

  return (
    <main className="flex min-h-[100dvh] flex-col w-full overflow-x-hidden bg-surface-base">
      <WorksGallery projects={projects} />
    </main>
  );
}
