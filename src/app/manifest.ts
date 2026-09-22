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
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
