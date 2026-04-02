"use client";

import { useState, useEffect } from "react";
import Header from "./Header";
import FullScreenMenu from "./FullScreenMenu";

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

  return (
    <>
      <Header onMenuClick={() => setIsMenuOpen(true)} />
      <FullScreenMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />
      <main>{children}</main>
    </>
  );
}
