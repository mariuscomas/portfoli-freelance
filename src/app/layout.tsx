import localFont from "next/font/local";
import { Bricolage_Grotesque, Hanken_Grotesk, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import SiteShell from "@/components/layout/SiteShell";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TransitionProvider } from "@/context/TransitionContext";
import PageTransition from "@/components/common/PageTransition";
import { buildMetadata } from "@/lib/seo";
import type { Viewport } from "next";
import "./globals.css";
import Analytics from "@/components/analytics/Analytics";
import CookieBanner from "@/components/common/CookieBanner";

// Cos (body, headings, botons, caption) → Hanken Grotesk
// Font del sistema sincronitzat amb Figma (variable font-family-body)
const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

// Display (heros, marquees) + Headings H1-H3 → Bricolage Grotesque
// Sincronitzat amb Figma (variable font-family-heading)
// 500 (Medium) és el weight dels Heading; 600 (SemiBold) el dels Display
const heading = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const fkMono = localFont({
  src: "../../public/fonts/6849da698cb78e39e8121637_FKGroteskMono-Medium.ttf",
  variable: "--font-mono",
  display: "swap",
  weight: "500",
});

// Caption & labels (metadades) → Geist Mono
// Família independent del body, sincronitzada amb Figma (variable font-family-caption)
const caption = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-caption",
  display: "swap",
});

// Metadata per defecte. Cada pàgina pot sobreescriure-la amb el seu propi
// `export const metadata = buildMetadata({...})`. El title aquí no apareix
// mai sol — Next el combina amb el title de la pàgina actual.
export const metadata = buildMetadata({
  title: "Digital Product Designer",
  description:
    "Portfoli professional de Màrius Comas, Digital Product Designer especialitzat en UI/UX. Estratègia, producte i sistemes per a startups i corporacions.",
  path: "/",
});

// Color de la UI del navegador (barra d'estat / d'adreces) = surface/base de
// cada mode. Segueix la preferència del SO, no el toggle del site: el color
// adaptat a cada situació (tema triat, menú obert) va a part (22set26).
// Safari d'iOS 26 pot ignorar-lo i tenyir segons el contingut de dalt.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f2" },
    { media: "(prefers-color-scheme: dark)", color: "#262522" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /*
    Lectura de la cookie `theme` al servidor — així podem aplicar la classe
    `dark` o `light` a <html> ja al primer paint sense FOUC i SENSE cap
    <script> inline que dispari el warning de Turbopack/Next 16.

    Si la cookie no existeix encara (primera visita), defaultem a `light`.
    L'usuari pot canviar-ho amb el ThemeToggle i la cookie es persisteix.
  */
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("theme")?.value;
  const initialTheme: "dark" | "light" =
    themeCookie === "dark" || themeCookie === "system" ? "dark" : "light";
  // Nota: per a "system" no podem saber al servidor la preferència del SO,
  // així que assumim light com a default. El ThemeProvider corregirà al client
  // si "system" hauria de ser dark; el flash possible només afecta usuaris
  // amb tema "system" + SO en dark, i és quasi imperceptible.

  return (
    <html
      lang="ca"
      className={`${sans.variable} ${heading.variable} ${fkMono.variable} ${caption.variable} ${initialTheme} h-[100dvh] antialiased`}
      style={{ colorScheme: initialTheme }}
      suppressHydrationWarning
    >
      <body className="font-sans min-h-full flex flex-col bg-surface-base text-text-main">
        <Analytics />
        <ThemeProvider>
          <TransitionProvider>
            <PageTransition />
            <SiteShell>{children}</SiteShell>
            <CookieBanner />
          </TransitionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
