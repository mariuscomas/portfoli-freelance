"use client";

import { createContext, useContext, useState } from "react";

/**
 * FooterRevealContext
 * -------------------
 * Comunica al Header que el footer s'està revelant (el contingut llisca per
 * sota del footer fosc en arribar al final). El Header l'usa per fer fade-out
 * i no clashar amb el bloc fosc que el tapa.
 */
type FooterRevealValue = {
  revealed: boolean;
  setRevealed: (v: boolean) => void;
};

const FooterRevealContext = createContext<FooterRevealValue>({
  revealed: false,
  setRevealed: () => {},
});

export function FooterRevealProvider({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <FooterRevealContext.Provider value={{ revealed, setRevealed }}>
      {children}
    </FooterRevealContext.Provider>
  );
}

export function useFooterReveal() {
  return useContext(FooterRevealContext);
}
