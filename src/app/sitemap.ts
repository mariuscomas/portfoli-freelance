import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE } from "@/lib/seo";
import { t } from "@/lib/i18n";

/**
 * Sitemap dinàmic. Llegim els works publicats de Supabase i generem una
 * entrada per slug. Next el serveix a /sitemap.xml.
 *
 * Fem servir el client anònim, no el de `utils/supabase/server`: aquell crida
 * `cookies()`, que converteix la ruta en una API de temps de petició. Amb el
 * client anònim la ruta es pot generar al build i revalidar cada hora, que és
 * el que vol un sitemap. El sitemap no necessita sessió: només llegeix el que
 * ja és públic.
 *
 * /contacte no hi és: només redirigeix a la home.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = (
    [
      ["", 1, "monthly"],
      ["/works", 0.9, "monthly"],
      ["/serveis", 0.9, "monthly"],
      ["/serveis/web", 0.8, "monthly"],
      ["/serveis/landing", 0.8, "monthly"],
      ["/serveis/auditoria", 0.8, "monthly"],
      ["/colaboracio", 0.9, "monthly"],
      ["/about", 0.7, "yearly"],
      ["/privacitat", 0.3, "yearly"],
    ] as const
  ).map(([path, priority, changeFrequency]) => ({
    url: `${SITE.url}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );

  const { data: works } = await supabase
    .from("works")
    .select("slug, created_at")
    .eq("is_published", true);

  const workRoutes: MetadataRoute.Sitemap = (works || []).map((w) => ({
    url: `${SITE.url}/works/${t(w.slug)}`,
    lastModified: w.created_at ? new Date(w.created_at) : now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...workRoutes];
}
