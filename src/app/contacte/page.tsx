"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useContactModal } from "@/context/ContactModalContext";

/*
  /contacte
  ---------
  Ja no és una pàgina: el contacte és un modal full-screen (cortina) que
  s'obre des de qualsevol CTA. Mantenim la ruta per compatibilitat (SEO,
  enllaços externs antics, marcadors): obre el modal i redirigeix a la home.

  El ContactModalProvider viu a SiteShell (root layout), així que el modal
  sobreviu a la navegació client-side cap a "/".
*/

export default function ContactePage() {
  const router = useRouter();
  const { open } = useContactModal();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return; // Strict Mode: evitem doble tret
    fired.current = true;
    open();
    router.replace("/");
  }, [open, router]);

  // Fons neutre mentre dura el redirect (imperceptible).
  return <main className="min-h-[100dvh] bg-surface-base" aria-hidden="true" />;
}
