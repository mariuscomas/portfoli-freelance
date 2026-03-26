import localFont from "next/font/local";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
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

export const metadata: Metadata = {
  title: "Màrius - Portfoli Freelance",
  description: "Portfoli professional de Product & UI/UX Design",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ca" className={`${grtsk.variable} ${grtskHeading.variable} ${fkMono.variable} h-[100dvh] antialiased scroll-smooth`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
             __html: `!function(){try{var d=document.documentElement,c=d.classList;c.remove('light','dark');var e=localStorage.getItem('theme');if('system'===e||(!e&&window.matchMedia('(prefers-color-scheme: dark)').matches)){c.add('dark')}else if(e){c.add(e)}}catch(e){}}()`
          }}
        />
      </head>
      <body className="font-sans min-h-full flex flex-col bg-surface-base text-text-main">
        <ThemeProvider>
          <Header />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
