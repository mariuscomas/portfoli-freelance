import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WorkDetailLayout from "@/components/works/detail/WorkDetailLayout";
import type { WorkDetailData, WorkBlock, WorkMedia } from "@/types/works";
import { createClient } from "@/utils/supabase/server";
import { isAdmin } from "@/lib/supabase";
import { t, flattenI18n } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { stripHtml } from "@/lib/html-utils";

/**
 * /works/[slug]
 * ----------------
 * Detall d'un case study. Llegim el work per slug.ca de Supabase i
 * mapegem el JSONB `content` al tipus WorkDetailData que consumeix el
 * component públic.
 */

/**
 * Metadata dinàmica per case study individual. Quan algú comparteix un
 * link a LinkedIn/X, l'OG mostra el títol i descripció del projecte concret.
 */
export async function generateMetadata(
  {
    params,
    searchParams,
  }: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ preview?: string }>;
  }
): Promise<Metadata> {
  const { slug } = await params;
  const { preview } = await searchParams;
  const supabase = await createClient();

  const isPreview = preview === "draft" && (await isAdmin());

  // El slug viu dins d'un camp jsonb i18n; busquem tots els works publicats
  // (o tots si és preview admin) i filtrem en memòria. La col·lecció és
  // petita (10-30 entrades típiques), així que no val la pena fer una
  // query Postgres jsonb_path_query més complexa.
  let q = supabase
    .from("works")
    .select("title, short_description, slug, meta_title, meta_description, og_image_url, main_image_url, is_indexable");
  if (!isPreview) q = q.eq("is_published", true);
  const { data: works } = await q;

  const found = (works || []).find((w) => t(w.slug) === slug);
  if (!found) {
    return buildMetadata({
      title: "Projecte no trobat",
      noIndex: true,
      path: `/works/${slug}`,
    });
  }

  // ── Title resolution: meta_title override → title (fallback)
  const titleOverride = t(found.meta_title).trim();
  const baseTitle = titleOverride || t(found.title);

  // ── Description: meta_description override → short_description (stripped HTML)
  const descriptionOverride = t(found.meta_description).trim();
  const description =
    descriptionOverride ||
    stripHtml(t(found.short_description)) ||
    `Case study: ${baseTitle}`;

  // ── OG image: og_image_url override → main_image_url (fallback)
  const ogImage = (found.og_image_url || found.main_image_url || undefined) as string | undefined;

  // noIndex: preview OR admin marked is_indexable=false
  const explicitNoIndex = found.is_indexable === false;

  return buildMetadata({
    title: isPreview ? `${baseTitle} · Preview` : baseTitle,
    description,
    path: `/works/${slug}`,
    type: "article",
    image: ogImage,
    // Els previews mai s'han d'indexar a buscadors; tampoc els works
    // marcats com is_indexable=false (clients privats/NDAs).
    noIndex: isPreview || explicitNoIndex,
  });
}

interface RawContent {
  hero?: {
    title?: string;
    description?: string;
    backgroundMode?: 'color' | 'image';
    backgroundColor?: string;
    backgroundImage?: string;
    overlayOpacity?: number;
    textColor?: 'light' | 'dark';
  };
  blocks?: WorkBlock[];
  conclusion?: string;
  finalMedia?: WorkMedia[];
}

export default async function ProjectDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const supabase = await createClient();

  // Preview mode (?preview=draft) — permet veure works no publicats.
  // Requereix autenticació d'admin. Si no s'és admin, el flag no té cap
  // efecte i el work no apareix (fallback al notFound habitual).
  const isPreview = preview === "draft" && (await isAdmin());

  // Llegim els works ordenats per order_index per:
  //   1. Trobar el work amb el slug demanat
  //   2. Calcular el "next project" (el següent a la llista, o el primer si és l'últim)
  // En preview mode no apliquem el filtre is_published.
  let query = supabase
    .from("works")
    .select("*")
    .order("order_index", { ascending: true });
  if (!isPreview) {
    query = query.eq("is_published", true);
  }
  const { data: allWorks, error } = await query;

  if (error || !allWorks || allWorks.length === 0) {
    notFound();
  }

  const currentIndex = allWorks.findIndex((w) => t(w.slug) === slug);
  const work = allWorks[currentIndex];

  if (!work) {
    notFound();
  }

  // Següent projecte: cíclic en mode publicat. En preview agafem el primer
  // publicat per donar coherència visual quan navigues des d'un esborrany.
  const publishedWorks = isPreview
    ? allWorks.filter((w) => w.is_published)
    : allWorks;
  const nextWork =
    publishedWorks.length > 0
      ? publishedWorks[(publishedWorks.findIndex((w) => w.id === work.id) + 1) % publishedWorks.length] ?? publishedWorks[0]
      : work;

  // El camp `content` pot contenir objectes i18n a qualsevol profunditat
  // (legacy). Els aplanem a la versió CA d'una sola passada.
  const content = flattenI18n<RawContent>(work.content || {});

  const mappedData: WorkDetailData = {
    id: String(work.id),
    slug,
    hero: {
      title: content.hero?.title || t(work.title),
      // Hero description renderitza per paraules animades — necessita text pla.
      // Si el fallback (work.short_description) ve del RichTextEditor amb HTML,
      // el stripHtml() el converteix a text. content.hero.description ja és text pla.
      description: content.hero?.description || stripHtml(t(work.short_description)),
      // Retrocompat: si no s'ha desat 'backgroundMode' explícit però hi ha imatge,
      // assumim mode 'image'. Si no, 'color'.
      backgroundMode:
        content.hero?.backgroundMode === 'image' || content.hero?.backgroundMode === 'color'
          ? content.hero.backgroundMode
          : content.hero?.backgroundImage
            ? 'image'
            : 'color',
      backgroundColor: content.hero?.backgroundColor || work.hero_color || "#1A1A1A",
      backgroundImage: content.hero?.backgroundImage || undefined,
      overlayOpacity:
        typeof content.hero?.overlayOpacity === 'number'
          ? Math.max(0, Math.min(80, content.hero.overlayOpacity))
          : 0,
      textColor: content.hero?.textColor === 'dark' ? 'dark' : 'light',
    },
    blocks: Array.isArray(content.blocks) ? content.blocks : [],
    conclusion: content.conclusion || t(work.conclusion),
    finalMedia: Array.isArray(content.finalMedia) ? content.finalMedia : [],
    nextProject: {
      title: t(nextWork.title),
      slug: t(nextWork.slug),
    },
  };

  return (
    <main className="flex min-h-[100dvh] flex-col w-full overflow-x-hidden bg-surface-base">
      {isPreview && <PreviewBanner isPublished={Boolean(work.is_published)} workId={String(work.id)} />}
      <WorkDetailLayout data={mappedData} />
    </main>
  );
}

/**
 * Bàner sticky superior visible només en mode preview. Recorda a l'admin que
 * està veient una versió no pública i ofereix un retorn ràpid a l'editor.
 */
function PreviewBanner({ isPublished, workId }: { isPublished: boolean; workId: string }) {
  return (
    <div className="sticky top-0 z-50 w-full bg-text-main text-text-main-inverse">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-2 flex items-center justify-between gap-4 text-body-sm">
        <span className="font-medium tracking-wide">
          Preview · {isPublished ? "treball publicat" : "esborrany sense publicar"}
        </span>
        <a
          href={`/admin/works/${workId}`}
          className="underline underline-offset-4 hover:opacity-80 transition-opacity"
        >
          Tornar a l&apos;editor
        </a>
      </div>
    </div>
  );
}
