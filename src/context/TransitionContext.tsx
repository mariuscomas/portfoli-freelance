"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

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

  // Ref espill de `isTransitioning` perquè `finishTransition` pugui llegir-lo
  // sense dependre'n. Així `finishTransition` manté una identitat ESTABLE i
  // només es dispara quan munta la pàgina NOVA (no quan la pàgina antiga
  // re-renderitza en començar la transició).
  const isTransitioningRef = useRef(false);

  const triggerTransition = useCallback(
    (href: string) => {
      setIsTransitioning(true);
      isTransitioningRef.current = true;
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
    // Llegim del ref (no de l'estat) per no recrear el callback i evitar que es
    // dispari abans d'hora. Es crida quan la ruta destí ja s'ha muntat.
    if (isTransitioningRef.current) {
      isTransitioningRef.current = false; // bloqueja dobles tancaments
      // Donem temps perquè el logo faci la seva fase de "drift" (flotat)
      setTimeout(() => {
        setIsTransitioning(false);
      }, 1000);
    }
  }, []);

  // Tanquem la cortina quan el `pathname` canvia de veritat — és a dir, quan la
  // pàgina destí ja s'ha muntat. Lligar-ho al pathname (i no al muntatge del
  // template) ho fa robust per a QUALSEVOL navegació, incloses les rutes filles
  // (p.e. /works → /works/[slug]), on el template arrel NO es re-munta.
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      finishTransition();
    }
  }, [pathname, finishTransition]);

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
