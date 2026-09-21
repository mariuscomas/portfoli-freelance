"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LinkUnderline } from "@/components/ui/LinkUnderline";
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
      {/* Figma: Errors — 500 i 404 (node 12213:11753 / 11771 / 11789) */}
      <section className="flex flex-1 flex-col justify-center gap-12 px-page py-20">
        <p
          aria-hidden="true"
          className="text-display-l md:text-display-2xl lg:text-display-3xl uppercase text-error/15 whitespace-nowrap select-none"
        >
          500 · 500 · 500
        </p>

        <div className="flex flex-col gap-6 max-w-2xl">
          <span className="text-caption-eyebrow text-error">
            Error · {error.digest || "Inesperat"}
          </span>
          <h1 className="text-body-l-semibold md:text-display-2xs lg:text-display-m text-text-main">
            Alguna cosa no ha anat com tocava.
          </h1>
          <p className="text-body-l-light lg:text-body-xl-light text-text-secondary">
            Disculpa les molèsties. Pots provar de recarregar la pàgina o tornar a la home.
            Si el problema persisteix, escriu-me directament.
          </p>

          <div className="flex flex-col md:flex-row gap-6 pt-6">
            <LinkUnderline
              onClick={reset}
              icon={<ArrowClockwise size={20} weight="regular" className="shrink-0" aria-hidden />}
            >
              Tornar a provar
            </LinkUnderline>

            <Link href="/" className="group w-fit">
              <LinkUnderline
                as="span"
                icon={
                  <ArrowRight
                    size={20}
                    weight="regular"
                    className="shrink-0 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                }
              >
                Tornar a la home
              </LinkUnderline>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
