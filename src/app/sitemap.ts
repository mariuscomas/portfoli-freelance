import type { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";
import { SITE } from "@/lib/seo";
import { t } from "@/lib/i18n";

/**
 * Sitemap dinàmic. Llegim works i serveis publicats de Supabase i
 * generem una entrada per cada slug. Next genera /sitemap.xml.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Rutes estàtiques principals
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${SITE.url}/works`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE.url}/serveis`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE.url}/about`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.7 },
    { url: `${SITE.url}/contacte`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.8 },
  ];

  // Rutes dinàmiques (case studies)
  const { data: works } = await supabase
    .from("works")
    .select("slug, created_at")
    .eq("is_published", true);

  const workRoutes: MetadataRoute.Sitemap = (works || []).map((w) => ({
    url: `${SITE.url}/works/${t(w.slug)}`,
    lastModified: w.created_at ? new Date(w.created_at) : new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...workRoutes];
}
