"use client";

import { useState, useEffect } from "react";
import Header from "./Header";
import FullScreenMenu from "./FullScreenMenu";
import { HeaderContrastProvider } from "@/context/HeaderContrastContext";

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      <Header onMenuClick={() => setIsMenuOpen(true)} />
      <FullScreenMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
      <main>{children}</main>
    </HeaderContrastProvider>
  );
}
