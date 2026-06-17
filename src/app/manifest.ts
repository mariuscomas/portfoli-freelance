import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

/**
 * Manifest PWA. Permet "Afegir a la pantalla d'inici" a iOS/Android amb
 * el branding correcte. Next el serveix a /manifest.webmanifest.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#efebe7",
    theme_color: "#0b0b0b",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
