import type { NextConfig } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = SUPABASE_URL ? new URL(SUPABASE_URL).hostname : undefined;

const nextConfig: NextConfig = {
  /*
    Optimització d'imatges
    ----------------------
    Next.js converteix automàticament <Image> a AVIF/WebP segons el navegador.
    Aquí explicitem:
    - Formats que volem servir (AVIF prioritari, WebP fallback).
    - Patrons remots permesos. Sense això, <Image src="https://..."> peta
      perquè Next bloqueja hosts no allowlist'ats per evitar abús del seu
      servei d'optimització.
  */
  images: {
    formats: ["image/avif", "image/webp"],
    // Mides per defecte que Next pre-genera. Coincideixen amb els breakpoints
    // típics del portfolio (mobile, tablet, laptop, desktop, wide).
    deviceSizes: [640, 768, 1024, 1280, 1536, 1920, 2560],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Qualities permesos per <Image quality={X}>. Next 16 obliga a llistar-los
    // explícitament; 75 és el default i 100 el fem servir per a imatges
    // crítiques del work detail (work_detail_image_09.png, etc).
    qualities: [75, 100],
    remotePatterns: [
      // Supabase Storage (per quan afegim upload d'imatges al dashboard).
      // El hostname es resol dinàmicament de NEXT_PUBLIC_SUPABASE_URL.
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      // Imatges legacy migrades des d'Adobe Portfolio (alguns works antics
      // encara apunten a la seva CDN). Sense això, next/image les bloqueja i
      // la pàgina de detall peta.
      {
        protocol: "https" as const,
        hostname: "cdn.myportfolio.com",
      },
      // Si en algun moment fas servir Unsplash, Cloudinary, etc., afegeix-los aquí.
    ],
  },
};

export default nextConfig;
