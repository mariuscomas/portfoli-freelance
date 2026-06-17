import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

/**
 * Robots.txt dinàmic. Next el serveix a /robots.txt.
 *
 * Excloem zones que no han d'indexar-se: l'admin (només jo) i les rutes
 * d'autenticació (callback amb codis temporals). La resta està obert.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/auth/"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
