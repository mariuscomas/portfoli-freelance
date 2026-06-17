import { ImageResponse } from "next/og";
import { SITE } from "@/lib/seo";

/**
 * og-image dinàmic per a la home i fallback global.
 *
 * Next la captura automàticament i la fa servir com a imatge OpenGraph
 * + Twitter quan no es passa imatge específica al `buildMetadata({image})`.
 *
 * Estètica: 100% coherent amb el portfolio — fons crema (Primaris/Surface)
 * + MÀRIUS. gran centrat + descripció a sota. Tot tipogràfic, sense
 * dependència d'imatges externes ni fonts custom (usem Inter de fallback
 * perquè @vercel/og no carrega .ttf locals fàcilment).
 */

export const runtime = "edge";
export const alt = SITE.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#efebe7", // primary/surface del DS
          padding: "80px",
          justifyContent: "space-between",
        }}
      >
        {/* Top label */}
        <div
          style={{
            display: "flex",
            color: "#444749",
            fontSize: 24,
            letterSpacing: 6,
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          Digital Product Designer · UI/UX
        </div>

        {/* Center wordmark */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div
            style={{
              display: "flex",
              fontSize: 220,
              color: "#0b0b0b",
              letterSpacing: -8,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            MÀRIUS<span style={{ color: "#13ec6d" }}>.</span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 36,
              color: "#444749",
              maxWidth: 900,
              lineHeight: 1.3,
            }}
          >
            Estratègia. Producte. Impacte.
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            display: "flex",
            color: "#444749",
            fontSize: 24,
            letterSpacing: 2,
            justifyContent: "flex-end",
          }}
        >
          {SITE.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    ),
    size
  );
}
