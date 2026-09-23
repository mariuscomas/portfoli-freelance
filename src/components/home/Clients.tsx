"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import RevealGroup from "@/components/common/RevealGroup";
import TransitionLink from "@/components/common/TransitionLink";
import { Button } from "@/components/ui/Button";
import { LinkUnderline } from "@/components/ui/LinkUnderline";
import { CLIENT_LOGOS } from "@/lib/clients";

/**
 * Secció · Clients de la home.
 *
 * Figma (23set26, pàgina Wireframes → secció Home):
 *   Desktop 1728 → 12343:95216 · Laptop 1280 → 12343:95407
 *   iPad 834    → 12343:95599 · iPhone 402  → 12343:95836
 *
 * Redisseny del 23set26: el titular deixa de ser una línia a sobre del
 * carrusel i passa a ser una COLUMNA FIXA a l'esquerra (etiqueta, títol,
 * descripció i enllaç a Treballs), amb el carrusel a la dreta. La graella
 * de filets és el que lliga les dues columnes: vora superior sòlida (entre
 * seccions) i tota la resta dashed (dins de la secció) — dash-v/dash-h,
 * que pinten el patró 5/10 del DS; `border-dashed` del navegador no el
 * respecta.
 *
 * Les fletxes surten del mestre Buttons / Ghost / Square / Neutral
 * (11507:9312), que té Size 32 · 56 · 96. A mòbil el botó va sol a Size=56;
 * de md amunt OMPLE la cel·la de 96 que porta el filet (Size=96), perquè el
 * hover arribi de filet a filet: si el gris només cobrís els 56 centrals, la
 * zona que reacciona no coincidiria amb el requadre que es veu. El 96 no
 * porta radius ni vora, que el filet de la cel·la ja fa de límit i una vora
 * sòlida a sobre el doblaria. El salt de mida el decideix aquest component
 * (md:size-full), no el token, com amb la tipografia. Decidit 23set26.
 */

/* ------------------------------------------------------------
   Logotip de client.
   Els SVG viuen a public/logos/, exportats del Figma ja
   normalitzats. L'ALÇADA és la dimensió que normalitza (els
   logos s'igualen per alçada de caixa alta, no per amplada),
   així que fixem height i deixem l'amplada automàtica: així no
   es poden deformar mai. La caixa de 56px és l'slot del Figma.
   ------------------------------------------------------------ */
const ClientLogo = ({ src, name, height }: { src: string; name: string; height: number }) => (
  <div className="flex h-14 items-center">
    {/* eslint-disable-next-line @next/next/no-img-element -- SVG local de mida fixa; next/image no hi aporta res */}
    <img src={src} alt={name} height={height} style={{ height, width: "auto" }} />
  </div>
);

// Els logos i la seva alçada normalitzada surten de lib/clients (font única,
// compartida amb /colaboracio). Aquí només hi viu el relat de cada client.
const DESCRIPCIONS: Record<string, string> = {
  north: "El meu salt a l’automoció. Amb North Studio vaig dissenyar interfícies de cotxe colze a colze amb enginyeria. I sí, va ser tan divertit com sona.",
  quantion: "UI/UX Senior a Quantion, dissenyant per a la salut pública i l’insurtech. Burocràcia complexa, interfícies simples.",
  cupra: "Sí, el panell del teu pròxim Cupra potser el vaig dibuixar jo. Disseny HMI on cada píxel ha de funcionar a 200 km/h.",
  santalucia: "Diversos productes per a Santalucía Impulsa: des d’un agrupador d’assegurances tipus Fintonic fins a un gestor d’herències amb IA.",
  alphanet: "UI/UX per a Alphanet: les tauletes que els cossos policials porten al cotxe i les pantalles de sala de control. Aquí un mal botó no és un bug, és un problema.",
  onabitz: "De tot una mica per a Onabitz com a UI/UX designer. Projectes variats, mateixa obsessió pel detall.",
};

const clients = CLIENT_LOGOS.map((c) => ({ ...c, desc: DESCRIPCIONS[c.id] }));

/** Retard d'entrada per a un fill d'un RevealGroup (guió 21set26). */
const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as React.CSSProperties;

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

  // Un pas = una card sencera, llegida del layout real (les cards són
  // contigües: el filet fa de separació, no hi ha gap).
  const step = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return 0;
    const first = el.firstElementChild as HTMLElement | null;
    if (!first) return el.clientWidth;
    const gap = parseFloat(window.getComputedStyle(el).columnGap || "0") || 0;
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
    <section
      id="clients"
      aria-labelledby="clients-titol"
      className="w-full border-t border-border-default"
    >
      <div className="flex flex-col md:flex-row md:items-stretch md:pl-page">
        {/* Columna esquerra: etiqueta, títol, descripció i enllaç a Treballs.
            A mòbil és una fila a sobre del carrusel i el filet passa a ser
            horitzontal. */}
        <RevealGroup
          as="header"
          className="flex flex-col justify-center gap-12 border-b dash-h-border-default px-page py-section-s md:min-w-0 md:flex-1 md:border-b-0 md:border-r md:dash-v-border-default md:px-0 md:pr-12 md:py-section-m lg:w-[464px] lg:flex-none"
        >
          <div className="flex flex-col gap-8">
            <p className="reveal-up text-caption-eyebrow text-text-secondary" style={delay(80)}>
              HAN CONFIAT EN MI
            </p>
            <div className="flex flex-col gap-4">
              <h2 id="clients-titol" className="text-display-l text-text-main">
                <span className="reveal-line"><span className="reveal-line-inner">Clients</span></span>
              </h2>
              <p className="reveal-up max-w-[420px] text-body-l text-text-secondary" style={delay(160)}>
                Des del primer dia, agraït d&rsquo;haver compartit experiències i
                aprenentatges al costat dels millors equips.
              </p>
            </div>
          </div>

          <div className="reveal-up" style={delay(240)}>
            <TransitionLink href="/works" className="group w-fit">
              <LinkUnderline
                as="span"
                size="md"
                icon={
                  <ArrowRight
                    size={20}
                    className="shrink-0 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                }
              >
                Mira tots els treballs
              </LinkUnderline>
            </TransitionLink>
          </div>
        </RevealGroup>

        {/* Columna dreta: control del carrusel + carrusel.
            A mòbil el control va SOTA les cards (order), com al Figma. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="order-2 flex items-center border-t dash-h-border-default md:order-1 md:border-t-0 md:border-b md:dash-h-border-default">
            <div className="hidden flex-1 md:block" />
            <div className="flex items-center gap-4 px-page py-6 md:gap-0 md:p-0">
              <div className="flex items-center justify-center md:size-24 md:border-l md:dash-v-border-default">
                <Button
                  variant="ghost"
                  size="icon"
                  shape="square"
                  className="md:size-full md:rounded-none"
                  aria-label="Clients anteriors"
                  disabled={!canPrev}
                  onClick={() => scrollByStep(-1)}
                >
                  <ArrowLeft size={32} weight="regular" aria-hidden="true" />
                </Button>
              </div>
              <div className="flex items-center justify-center md:size-24 md:border-l md:dash-v-border-default">
                <Button
                  variant="ghost"
                  size="icon"
                  shape="square"
                  className="md:size-full md:rounded-none"
                  aria-label="Clients següents"
                  disabled={!canNext}
                  onClick={() => scrollByStep(1)}
                >
                  <ArrowRight size={32} weight="regular" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>

          {/* Carrusel: scroll natiu (rodeta, gest, teclat) + les fletxes.
              overflow-x-auto i no -hidden: volem un scroll container de
              veritat. overscroll-none, no -contain (regla del projecte). */}
          <div
            ref={scrollRef}
            role="region"
            aria-label="Clients"
            tabIndex={0}
            onKeyDown={onKeyDown}
            className="hide-scrollbar order-1 flex min-h-0 flex-1 items-stretch overflow-x-auto overscroll-none md:order-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          >
            {clients.map((client) => (
              <div
                key={client.name}
                className="flex w-[320px] shrink-0 flex-col justify-center gap-6 border-r dash-v-border-default px-page py-12 md:w-[440px] md:p-12"
              >
                <ClientLogo src={client.src} name={client.name} height={client.h} />
                <p className="text-body-s text-text-main">{client.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* .hide-scrollbar i dash-* viuen a globals.css (utility layer) */}
    </section>
  );
}
