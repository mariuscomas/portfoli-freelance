"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";

/* ------------------------------------------------------------
   Logotip de client.
   Els SVG viuen a public/logos/, exportats del Figma ja
   normalitzats. L'ALÇADA és la dimensió que normalitza (els
   logos s'igualen per alçada de caixa alta, no per amplada),
   així que fixem height i deixem l'amplada automàtica: així no
   es poden deformar mai.
   La caixa de 56px és l'slot del Figma (160×56, contingut a
   l'esquerra i centrat vertical).
   El nom del client ja NO surt com a línia pròpia a la card
   — decisió 15set26 —, així que l'alt del logo és l'únic lloc
   on s'anuncia de qui parla.
   ------------------------------------------------------------ */
const ClientLogo = ({ src, name, height }: { src: string; name: string; height: number }) => (
  <div className="mb-6 flex h-14 items-center">
    {/* eslint-disable-next-line @next/next/no-img-element -- SVG local de mida fixa; next/image no hi aporta res */}
    <img src={src} alt={name} height={height} style={{ height, width: "auto" }} />
  </div>
);

// `h` = alçada normalitzada al Figma (slot 160×56, igualat per caixa alta)
const clients = [
  { src: "/logos/north.svg",      h: 30, name: "The North Studio", desc: "El meu salt a l'automoció. Amb North Studio vaig dissenyar interfícies de cotxe colze a colze amb enginyeria — i sí, va ser tan divertit com sona." },
  { src: "/logos/quantion.svg",   h: 34, name: "Quantion", desc: "UI/UX Senior a Quantion, dissenyant per a la salut pública i l'insurtech. Burocràcia complexa, interfícies simples." },
  { src: "/logos/cupra.svg",      h: 52, name: "Cupra", desc: "Sí, el panell del teu pròxim Cupra potser el vaig dibuixar jo. Disseny HMI on cada píxel ha de funcionar a 200 km/h." },
  { src: "/logos/santalucia.svg", h: 32, name: "Santalucía Impulsa", desc: "Diversos productes per a Santalucía Impulsa: des d'un agrupador d'assegurances tipus Fintonic fins a un gestor d'herències amb IA." },
  { src: "/logos/alphanet.svg",   h: 18, name: "Alphanet Solutions", desc: "UI/UX per a Alphanet: les tauletes que els cossos policials porten al cotxe i les pantalles de sala de control. Aquí un mal botó no és un bug, és un problema." },
  { src: "/logos/onabitz.svg",    h: 30, name: "Onabitz", desc: "De tot una mica per a Onabitz com a UI/UX designer. Projectes variats, mateixa obsessió pel detall." },
];

export default function Clients() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  // Estat dels dos extrems: alimenta el `disabled` de les fletxes
  const syncEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 1);
    setCanNext(el.scrollLeft < max - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    syncEdges();
    el.addEventListener("scroll", syncEdges, { passive: true });
    window.addEventListener("resize", syncEdges);
    return () => {
      el.removeEventListener("scroll", syncEdges);
      window.removeEventListener("resize", syncEdges);
    };
  }, [syncEdges]);

  // Un pas = una card + el gap viu, llegit del layout real
  const step = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return 0;
    const first = el.firstElementChild as HTMLElement | null;
    if (!first) return el.clientWidth;
    const styles = window.getComputedStyle(el);
    const gap = parseFloat(styles.columnGap || "0") || 0;
    return first.offsetWidth + gap;
  }, []);

  const scrollByStep = useCallback(
    (dir: 1 | -1) => {
      const el = scrollRef.current;
      if (!el) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollBy({ left: dir * step(), behavior: reduce ? "auto" : "smooth" });
    },
    [step]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") { e.preventDefault(); scrollByStep(1); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); scrollByStep(-1); }
  };

  return (
    <section className="w-full py-24 md:py-40">
      <div className="relative flex w-full flex-col gap-16 md:gap-32">

        {/* Header: títol + control del carrusel */}
        <div className="flex w-full items-center justify-between gap-6 px-4 md:gap-12 md:px-[3vw] lg:px-[4vw]">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="m-0 font-heading text-heading-h1 leading-none text-text-main"
          >
            Clients
          </motion.h2>

          <div className="flex shrink-0 items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              shape="square"
              aria-label="Clients anteriors"
              disabled={!canPrev}
              onClick={() => scrollByStep(-1)}
            >
              <ArrowLeft size={32} weight="regular" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              shape="square"
              aria-label="Clients següents"
              disabled={!canNext}
              onClick={() => scrollByStep(1)}
            >
              <ArrowRight size={32} weight="regular" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Carrusel: scroll natiu (rodeta, gest, teclat) + les fletxes de dalt.
            overflow-x-auto i no -hidden: volem un scroll container de veritat. */}
        <div
          ref={scrollRef}
          role="region"
          aria-label="Clients"
          tabIndex={0}
          onKeyDown={onKeyDown}
          className="hide-scrollbar flex w-full gap-12 overflow-x-auto pb-8 pl-4 md:gap-16 md:pl-[3vw] lg:gap-24 lg:pl-[4vw] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          {clients.map((client) => (
            <div
              key={client.name}
              className="flex w-[300px] shrink-0 flex-col items-start"
            >
              <ClientLogo src={client.src} name={client.name} height={client.h} />
              <p className="text-body-md leading-relaxed text-text-secondary">
                {client.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
      {/* La classe .hide-scrollbar viu a globals.css (utility layer) */}
    </section>
  );
}
