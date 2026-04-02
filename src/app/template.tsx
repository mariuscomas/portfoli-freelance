"use client";

import { useEffect, useState } from "react";
import { useTransition } from "@/context/TransitionContext";

export default function Template({ children }: { children: React.ReactNode }) {
  const { isTransitioning, hasStartedTransition, finishTransition } = useTransition();
  
  // Si estem en transició i ja havíem començat (navegació), esperem que s'acabi
  // Si és el muntatge inicial (refresh), mostrem el contingut immediatament
  const [shouldRender, setShouldRender] = useState(!isTransitioning || !hasStartedTransition);

  useEffect(() => {
    // Aquesta funció es crida cada vegada que el template es munta (navegació)
    finishTransition();
  }, [finishTransition]);

  useEffect(() => {
    // Quan la transició s'ha acabat (o si ja estava acabada), muntem el contingut
    // Afegim un petit marge extra (300ms) perquè la cortina hagi començat a pujar
    // i l'usuari pugui veure l'animació de la pàgina nova amb "aire"
    if (!isTransitioning) {
      if (hasStartedTransition) {
        const timer = setTimeout(() => {
          setShouldRender(true);
        }, 300);
        return () => clearTimeout(timer);
      } else {
        // Si és el muntatge inicial (refresh), no cal delay
        setShouldRender(true);
      }
    }
  }, [isTransitioning, hasStartedTransition]);

  return (
    <div className="w-full flex-grow flex flex-col min-h-[100dvh]">
      {shouldRender ? <>{children}</> : null}
    </div>
  );
}
