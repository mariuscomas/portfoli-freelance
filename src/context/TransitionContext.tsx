"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface TransitionContextType {
  isTransitioning: boolean;
  hasStartedTransition: boolean;
  colorIndex: number;
  triggerTransition: (href: string) => void;
  finishTransition: () => void;
  colors: string[];
}

const TRANSITION_COLORS = ["#9B9484", "#C8CFD1"];

const TransitionContext = createContext<TransitionContextType | undefined>(undefined);

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasStartedTransition, setHasStartedTransition] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);
  const router = useRouter();

  const triggerTransition = useCallback(
    (href: string) => {
      setIsTransitioning(true);
      setHasStartedTransition(true);

      // Canviem el color per la següent vegada
      setColorIndex((prev) => (prev + 1) % TRANSITION_COLORS.length);

      // Temps per cobrir la pantalla (amb 200vh i 1.2s de durada, 900ms és el pic de cobertura)
      setTimeout(() => {
        router.push(href);
      }, 900); 
    },
    [router]
  );

  const finishTransition = useCallback(() => {
    // Aquesta funció es crida des del template.tsx quan la nova pàgina es munta
    if (isTransitioning) {
      // Donem temps perquè el logo faci la seva fase de "drift" (flotat)
      setTimeout(() => {
        setIsTransitioning(false);
      }, 1000); 
    }
  }, [isTransitioning]);

  return (
    <TransitionContext.Provider
      value={{
        isTransitioning,
        hasStartedTransition,
        colorIndex,
        triggerTransition,
        finishTransition,
        colors: TRANSITION_COLORS,
      }}
    >
      {children}
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error("useTransition must be used within a TransitionProvider");
  }
  return context;
}
