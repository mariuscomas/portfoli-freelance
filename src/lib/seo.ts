import type { Metadata } from "next";

/**
 * SEO helpers centralitzats per a totes les pàgines.
 * Una sola font de veritat per a OpenGraph, Twitter cards i metadades base.
 */

export const SITE = {
  name: "Màrius Freelance",
  shortName: "Màrius",
  description:
    "Digital Product Designer especialitzat en UI/UX. Disseny d'estratègia, producte i sistemes per a startups i corporacions.",
  // URL base que cal sobreescriure al deploy via NEXT_PUBLIC_SITE_URL.
  // Per defecte usem localhost en dev.
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  locale: "ca_ES",
  author: "Màrius Comas Rosa",
  twitterHandle: "@mariuscr23",
} as const;

interface BuildMetadataOptions {
  /** Títol específic de la pàgina. Es combinarà amb el nom del site. */
  title?: string;
  /** Descripció específica. Si no es passa, s'usa la del site. */
  description?: string;
  /** Path relatiu (e.g. "/works/padll"). Es resol contra SITE.url. */
  path?: string;
  /** URL absoluta a la imatge OG. Si no, s'usa /opengraph-image (auto). */
  image?: string;
  /** Si true, indica als crawlers de no indexar (admin, drafts, etc.). */
  noIndex?: boolean;
  /** Marcat com "article" en lloc de "website" (case studies, blog). */
  type?: "website" | "article";
}

/**
 * Construeix l'objecte Metadata complert per a una pàgina.
 *
 * Ús típic:
 *   export const metadata = buildMetadata({
 *     title: "Treballs",
 *     description: "...",
 *     path: "/works",
 *   });
 */
export function buildMetadata({
  title,
  description = SITE.description,
  path = "/",
  image,
  noIndex = false,
  type = "website",
}: BuildMetadataOptions = {}): Metadata {
  const fullTitle = title ? `${title} · ${SITE.shortName}` : SITE.name;
  const url = `${SITE.url}${path}`;
  const ogImage = image
    ? [{ url: image, width: 1200, height: 630, alt: fullTitle }]
    : undefined; // si no es passa, Next agafa src/app/opengraph-image.tsx

  return {
    metadataBase: new URL(SITE.url),
    title: fullTitle,
    description,
    authors: [{ name: SITE.author }],
    creator: SITE.author,
    publisher: SITE.author,
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" },
        },
    openGraph: {
      type,
      url,
      title: fullTitle,
      description,
      siteName: SITE.name,
      locale: SITE.locale,
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      creator: SITE.twitterHandle,
      images: ogImage,
    },
  };
}
