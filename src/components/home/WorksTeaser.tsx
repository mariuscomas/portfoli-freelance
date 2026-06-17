import TransitionLink from "../common/TransitionLink";
import WorksTeaserInteractive from "./WorksTeaserInteractive";
import { createClient } from "@/utils/supabase/server";
import { t } from "@/lib/i18n";
import type { Project } from "@/types";

/**
 * <WorksTeaser />
 *
 * Secció del Home que mostra una selecció de projectes destacats.
 * Fa fetch dels works publicats a Supabase (limit 4 per no saturar el
 * scroll del home) i prioritza els `is_featured = true`.
 *
 * Server Component: la part interactiva (hover, custom cursor) viu
 * a <WorksTeaserInteractive />.
 */
export default async function WorksTeaser() {
  const supabase = await createClient();

  // JOIN amb work_roles via FK (àlies `role_ref` per no col·lidir amb la
  // columna jsonb legacy `role`). Si el work no té FK encara, fem
  // fallback al jsonb.
  const { data: works } = await supabase
    .from("works")
    .select("id, title, role, role_id, slug, main_image_url, hero_color, content, is_featured, role_ref:work_roles(id, name)")
    .eq("is_published", true)
    .order("is_featured", { ascending: false }) // featured primer
    .order("order_index", { ascending: true })
    .limit(4);

  const projects: Project[] = (works || []).map((work) => {
    // Color de la card: prioritzem content.hero.backgroundColor (única
    // font de veritat). Fallback a hero_color (legacy) per a works
    // creats abans de la unificació i que encara no s'hagin reeditat.
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

  // Si no hi ha projectes publicats, no muntem la secció. Així evitem
  // un buit estrany al Home; quan publiquis works des del dashboard hi
  // apareixerà automàticament.
  if (projects.length === 0) return null;

  return (
    <section className="w-full py-16 md:py-32 bg-surface-base relative overflow-hidden">
      <div className="w-full">
        {/* Header amb títol + link "Veure tots els projectes" */}
        <div className="flex justify-between items-end mb-16 md:mb-24 px-4 md:px-[3vw] lg:px-[4vw]">
          <h2 className="font-heading text-heading-h1 uppercase text-text-main leading-none m-0">
            Treballs
          </h2>

          <TransitionLink
            href="/works"
            className="font-sans text-lg hidden md:block text-text-secondary hover:text-accent transition-colors duration-300 pb-4 border-b border-text-secondary/30 hover:border-accent"
          >
            Veure tots els projectes →
          </TransitionLink>
        </div>

        {/* Grid interactiu + custom cursor */}
        <WorksTeaserInteractive projects={projects} />
      </div>
    </section>
  );
}
