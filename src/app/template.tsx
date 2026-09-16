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
    // Només ens interessa el cas "la transició acaba de tancar-se": muntem el
    // contingut 300 ms després perquè la cortina hagi començat a pujar i
    // l'animació de la pàgina nova es vegi amb aire.
    //
    // Al muntatge inicial (refresh) no cal fer res: l'estat inicial ja és true,
    // i escriure'l aquí seria un render de més (react-hooks/set-state-in-effect).
    if (isTransitioning || !hasStartedTransition) return;

    const timer = setTimeout(() => setShouldRender(true), 300);
    return () => clearTimeout(timer);
  }, [isTransitioning, hasStartedTransition]);

  return (
    <div className="w-full flex-grow flex flex-col min-h-[100dvh]">
      {shouldRender ? <>{children}</> : null}
    </div>
  );
}
