"use client";

import { useEffect, useState } from "react";
import { useTransition } from "@/context/TransitionContext";

export default function Template({ children }: { children: React.ReactNode }) {
  const { isTransitioning, hasStartedTransition } = useTransition();

  // Si estem en transició i ja havíem començat (navegació), esperem que s'acabi
  // Si és el muntatge inicial (refresh), mostrem el contingut immediatament
  const [shouldRender, setShouldRender] = useState(!isTransitioning || !hasStartedTransition);

  // Nota: el tancament de la cortina (finishTransition) el gestiona ara el
  // TransitionProvider observant el canvi de `pathname`, no aquest template.
  // Així funciona també per a rutes filles, on el template arrel no es re-munta.

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
