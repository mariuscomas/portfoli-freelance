"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowClockwise, ArrowRight } from "@phosphor-icons/react";

/**
 * /500 — Error inesperat
 *
 * Es mostra quan un Server Component o Server Action llança una excepció
 * no controlada. Next ens passa l'error i una funció `reset()` per intentar
 * tornar a renderitzar.
 *
 * En producció Next oculta els detalls de l'error (només mostra digest).
 * En dev mostra el stack trace al overlay; aquesta UI és el "fallback estètic".
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log perquè aparegui a la consola del navegador (debugging)
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <main className="flex min-h-[100dvh] flex-col w-full bg-surface-base">
      <section className="flex flex-1 flex-col justify-center px-6 md:px-12 lg:px-24 py-20">

        <div className="relative overflow-hidden pointer-events-none -mx-6 md:-mx-12 lg:-mx-24 mb-12">
          <p
            aria-hidden="true"
            className="font-heading font-semibold uppercase text-error/15 whitespace-nowrap leading-none select-none"
            style={{ fontSize: "clamp(8rem, 30vw, 26rem)", letterSpacing: "-0.05em" }}
          >
            500 · 500 · 500
          </p>
        </div>

        <div className="flex flex-col gap-6 max-w-2xl">
          <span className="font-sans uppercase tracking-[0.15em] text-body-sm text-error">
            Error · {error.digest || "Inesperat"}
          </span>
          <h1 className="text-display-h4 text-text-main">
            Alguna cosa no ha anat com tocava.
          </h1>
          <p className="text-body-2xl text-text-secondary leading-relaxed">
            Disculpa les molèsties. Pots provar de recarregar la pàgina o tornar a la home.
            Si el problema persisteix, escriu-me directament.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 mt-6">
            <button
              type="button"
              onClick={reset}
              className="group inline-flex items-center gap-3 text-text-main hover:text-accent transition-colors duration-300 text-body-lg font-medium w-fit pb-2 border-b border-text-main hover:border-accent cursor-pointer"
            >
              <ArrowClockwise size={20} weight="regular" className="group-hover:rotate-180 transition-transform duration-500" />
              Tornar a provar
            </button>

            <Link
              href="/"
              className="group inline-flex items-center gap-3 text-text-secondary hover:text-accent transition-colors duration-300 text-body-lg font-medium w-fit pb-2 border-b border-text-secondary/40 hover:border-accent"
            >
              Tornar a la home
              <ArrowRight size={20} weight="regular" className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
