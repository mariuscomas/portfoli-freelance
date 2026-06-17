import localFont from "next/font/local";
import { cookies } from "next/headers";
import SiteShell from "@/components/layout/SiteShell";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TransitionProvider } from "@/context/TransitionContext";
import PageTransition from "@/components/common/PageTransition";
import { buildMetadata } from "@/lib/seo";
import "./globals.css";

const grtsk = localFont({
  src: [
    {
      path: "../../public/fonts/6849da698cb78e39e8121634_Grtsk-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/6849da698cb78e39e8121633_Grtsk-Regular.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

const grtskHeading = localFont({
  src: [
    {
      path: "../../public/fonts/6849da698cb78e39e8121635_Grtsk-LightGiga.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/6849da698cb78e39e8121638_Grtsk-Giga.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/6849da698cb78e39e8121636_Grtsk-SemiBoldGiga.ttf",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-heading",
  display: "swap",
});

const fkMono = localFont({
  src: "../../public/fonts/6849da698cb78e39e8121637_FKGroteskMono-Medium.ttf",
  variable: "--font-mono",
  display: "swap",
  weight: "500",
});

// Metadata per defecte. Cada pàgina pot sobreescriure-la amb el seu propi
// `export const metadata = buildMetadata({...})`. El title aquí no apareix
// mai sol — Next el combina amb el title de la pàgina actual.
export const metadata = buildMetadata({
  title: "Digital Product Designer",
  description:
    "Portfoli professional de Màrius Comas — Digital Product Designer especialitzat en UI/UX. Estratègia, producte i sistemes per a startups i corporacions.",
  path: "/",
});

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
      className={`${grtsk.variable} ${grtskHeading.variable} ${fkMono.variable} ${initialTheme} h-[100dvh] antialiased`}
      style={{ colorScheme: initialTheme }}
      suppressHydrationWarning
    >
      <body className="font-sans min-h-full flex flex-col bg-surface-base text-text-main">
        <ThemeProvider>
          <TransitionProvider>
            <PageTransition />
            <SiteShell>{children}</SiteShell>
          </TransitionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
