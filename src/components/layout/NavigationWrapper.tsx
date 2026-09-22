"use client";

import { useState, useEffect } from "react";
import Header from "./Header";
import FullScreenMenu, { circleFrom, type MenuCircle } from "./FullScreenMenu";
import { HeaderContrastProvider } from "@/context/HeaderContrastContext";

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Cercle d'obertura: centrat al botó que obre el menú (22set26).
  const [openCircle, setOpenCircle] = useState<MenuCircle | null>(null);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  // HeaderContrastProvider embolcalla TANT el Header com els {children}
  // perquè una pàgina (p.e. WorkDetailLayout) pugui declarar el contrast
  // del Header segons el seu hero, i el Header el llegeixi des del context.
  return (
    <HeaderContrastProvider>
      <Header
        onMenuClick={(e) => {
          setOpenCircle(circleFrom(e.currentTarget));
          setIsMenuOpen(true);
        }}
        isMenuOpen={isMenuOpen}
      />
      <FullScreenMenu
        isOpen={isMenuOpen}
        openCircle={openCircle}
        onClose={() => setIsMenuOpen(false)}
      />
      {/* Embolcall neutre, NO <main>: cada page.tsx públic ja declara el seu
          propi <main> amb el layout de la pàgina. Tenir-ne un aquí feia
          <main> dins de <main> a totes les rutes (axe: landmark-no-duplicate-main,
          landmark-main-is-top-level, landmark-unique). */}
      <div>{children}</div>
    </HeaderContrastProvider>
  );
}
