import type { NextConfig } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = SUPABASE_URL ? new URL(SUPABASE_URL).hostname : undefined;

const nextConfig: NextConfig = {
  /*
    Dev server des de l'iPhone (xarxa local). Next 16 bloqueja les peticions
    de dev (HMR, chunks) que no vénen de localhost; sense això la pàgina
    carrega però no s'hidrata. Només afecta `next dev`, no producció.
  */
  allowedDevOrigins: ["192.168.*.*"],

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
    // ⚑ 3840 hi és perquè un bloc de media a sang (1680 de caixa útil) en
    // demana 3360 en retina: sense aquest graó, Next el servia a 2560 i el
    // navegador l'escalava cap amunt.
    deviceSizes: [640, 768, 1024, 1280, 1536, 1920, 2560, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Qualities permesos per <Image quality={X}>. Next 16 obliga a llistar-los
    // explícitament. 75 és el default; 90 és el que fa servir el media del
    // work detail. ⚑ El 100 es va retirar el 15set26 després de mesurar-ho
    // sobre un export real: a 3360 px, q100 pesa 1303 KB i q90 460 KB, per
    // només 3,5 dB de PSNR de diferència (53,8 vs 50,3) — invisible, i 2,8×
    // el pes. Si algun dia cal tornar-hi, afegeix el graó aquí primer.
    qualities: [75, 90],
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
