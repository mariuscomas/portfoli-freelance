"use client";

import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react";
import TransitionLink from "@/components/common/TransitionLink";
import RevealGroup from "@/components/common/RevealGroup";
import { LinkUnderline } from "@/components/ui/LinkUnderline";
import { useContactModal } from "@/context/ContactModalContext";

/**
 * Secció · Sobre mi de la home.
 *
 * Figma (Wireframes, 21set26): "Section · About"
 *   Desktop 12211:59442 · Tablet 12211:59691 · Mobile 12211:59925
 *
 * Capçalera nova: «Ei, sóc en Màrius.» + «Encantat de conèixer-te.» amb el
 * Link «Vols que parlem?» a la mateixa línia (obre el ContactModal). Substitueix
 * el «SOBRE MI» en majúscules. Un sol Link: el duplicat de la dreta del 16" es
 * va treure.
 *
 * És client només pel ContactModal; l'entrada és la del guió (21set26):
 * titular G1, subtítol G2; fotos amb clip-path + escala en relleu de 120 ms;
 * paràgraf i Link G2. Tres grups perquè a mòbil cada bloc arriba per separat.
 */

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as React.CSSProperties;

const PHOTOS = [
  {
    src: "/images/home_about_marius_03.png",
    alt: "Màrius Comas",
    // Mòbil: amplada sencera (354×319). Tablet: columna esquerra, dues files.
    // Desktop: una de tres (544×616).
    className:
      "col-span-2 aspect-[354/319] md:col-span-1 md:row-span-2 md:aspect-auto lg:row-span-1 lg:aspect-[544/616]",
  },
  {
    src: "/images/home_about_marius_02.png",
    alt: "Paisatge de l’Empordà a contrallum",
    className: "aspect-square md:aspect-[3/2] lg:aspect-[544/616]",
  },
  {
    src: "/images/home_about_marius_01.png",
    alt: "Paisatge de l’Empordà al capvespre",
    className: "aspect-square md:aspect-[3/2] lg:aspect-[544/616]",
  },
];

export default function AboutTeaser() {
  const { open: openContactModal } = useContactModal();

  return (
    <section className="flex w-full flex-col gap-12 border-t border-border-subtle py-section-s md:gap-16 md:py-section-m lg:gap-24 lg:py-section-xl">
      <RevealGroup as="header" className="flex flex-col gap-4 px-page">
        <h2 className="text-display-s-medium md:text-display-m-medium lg:text-display-l text-text-main">
          <span className="reveal-line">
            <span className="reveal-line-inner">Ei, sóc en Màrius.</span>
          </span>
        </h2>
        <div
          className="reveal-up flex flex-wrap items-baseline gap-x-2.5 gap-y-1"
          style={delay(80)}
        >
          <p className="text-body-xl lg:text-body-2xl text-text-main">Encantat de conèixer-te.</p>
          <LinkUnderline
            onClick={openContactModal}
            icon={<ArrowRight size={20} className="shrink-0" aria-hidden />}
          >
            Vols que parlem?
          </LinkUnderline>
        </div>
      </RevealGroup>

      <RevealGroup className="grid w-full grid-cols-2 gap-4 px-6 md:gap-6 lg:grid-cols-3">
        {PHOTOS.map((photo, i) => (
          <div
            key={photo.src}
            style={delay(i * 120)}
            className={`reveal-clip relative w-full overflow-hidden bg-surface-elevated grayscale transition-[filter] duration-500 hover:grayscale-0 ${photo.className}`}
          >
            <div className="reveal-clip-media absolute inset-0">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
          </div>
        ))}
      </RevealGroup>

      <RevealGroup className="grid w-full grid-cols-1 px-page md:grid-cols-12">
        <div className="flex flex-col gap-12 md:col-span-8 md:col-start-4 md:gap-16 lg:col-span-6 lg:col-start-6">
          <p className="reveal-up max-w-[580px] text-body-xl lg:text-body-2xl text-text-secondary">
            Orgullós de col·laborar i poder ajudar les empreses a aconseguir els
            seus objectius i millorar les experiències dels seus clients.
          </p>
          <div className="reveal-up" style={delay(80)}>
            {/* Figma: Buttons / Custom / Link. Navega → ArrowRight. */}
            <TransitionLink href="/about" className="group block w-fit">
              <LinkUnderline
                as="span"
                icon={
                  <ArrowRight
                    size={20}
                    className="shrink-0 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                }
              >
                Descobreix més sobre mi
              </LinkUnderline>
            </TransitionLink>
          </div>
        </div>
      </RevealGroup>
    </section>
  );
}
