"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";

const PlaceholderLogo = ({ name }: { name: string }) => (
  <div className="h-12 md:h-16 flex items-center mb-10 text-text-main">
    {/* A simple typographic placeholder that simulates a logo if no SVG is present */}
    {/* Mida DS (heading-h2); bold + tracking-tighter són overrides deliberats del mur de logos */}
    <span className="text-heading-h2 font-bold tracking-tighter">{name}</span>
  </div>
);

const clients = [
  { logo: "North", name: "The North Studio", desc: "El meu salt a l'automoció. Amb North Studio vaig dissenyar interfícies de cotxe colze a colze amb enginyeria — i sí, va ser tan divertit com sona." },
  { logo: "QUANTION", name: "Quantion", desc: "UI/UX Senior a Quantion, dissenyant per a la salut pública i l'insurtech. Burocràcia complexa, interfícies simples." },
  { logo: "CUPRA", name: "Cupra", desc: "Sí, el panell del teu pròxim Cupra potser el vaig dibuixar jo. Disseny HMI on cada píxel ha de funcionar a 200 km/h." },
  { logo: "santalucía", name: "Santalucía", desc: "Diversos productes per a Santalucía Impulsa: des d'un agrupador d'assegurances tipus Fintonic fins a un gestor d'herències amb IA." },
  { logo: "Alphanet", name: "Alphanet Solutions", desc: "UI/UX per a Alphanet: les tauletes que els cossos policials porten al cotxe i les pantalles de sala de control. Aquí un mal botó no és un bug, és un problema." },
  { logo: "Onabitz", name: "Onabitz", desc: "De tot una mica per a Onabitz com a UI/UX designer. Projectes variats, mateixa obsessió pel detall." },
  { logo: "Iternatura", name: "Iternatura", desc: "UI/UX per a Iternatura: apps de turisme que omplen de reptes interactius les rutes pel municipi." },
];

export default function Clients() {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Duplicació de la llista per a un bucle horitzontal sense costures
  const loopClients = [...clients, ...clients];

  // --- MECÀNICA C + D: auto-scroll lent + drag amb inèrcia ---
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const AUTO_SPEED = 0.4; // px per frame (auto-scroll lent)
    const FRICTION = 0.94;  // decaïment de la inèrcia
    const MIN_VELOCITY = 0.3;

    let raf = 0;
    let isDragging = false;
    let isHovering = false;
    let velocity = 0;
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let activePointer: number | null = null;

    // Respecta usuaris amb moviment reduït: sense auto-scroll
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const half = () => el.scrollWidth / 2;

    const wrap = () => {
      const h = half();
      if (h <= 0) return;
      if (el.scrollLeft >= h) el.scrollLeft -= h;
      else if (el.scrollLeft < 0) el.scrollLeft += h;
    };

    const tick = () => {
      if (!isDragging) {
        if (Math.abs(velocity) > MIN_VELOCITY) {
          // Inèrcia després de deixar anar el drag
          el.scrollLeft -= velocity;
          velocity *= FRICTION;
        } else if (!isHovering && !reduceMotion) {
          // Auto-scroll en repòs
          el.scrollLeft += AUTO_SPEED;
        }
        wrap();
      }
      raf = requestAnimationFrame(tick);
    };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      velocity = 0;
      startX = e.clientX;
      lastX = e.clientX;
      startScroll = el.scrollLeft;
      activePointer = e.pointerId;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      el.scrollLeft = startScroll - dx;
      velocity = e.clientX - lastX; // velocitat instantània per a la inèrcia
      lastX = e.clientX;
      wrap();
    };

    const endDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      el.style.cursor = 'grab';
      if (activePointer !== null) {
        try { el.releasePointerCapture(activePointer); } catch { /* noop */ }
        activePointer = null;
      }
    };

    const onEnter = () => { isHovering = true; };
    const onLeave = () => { isHovering = false; };

    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', endDrag);
      el.removeEventListener('pointercancel', endDrag);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <section className="w-full py-24 md:py-40">
      <div className="flex flex-col gap-16 md:gap-32 w-full relative">

        {/* Header Content */}
        <div className="px-4 md:px-[3vw] lg:px-[4vw] w-full flex justify-between items-end">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-heading-h1 uppercase text-text-main leading-none m-0"
          >
            Clients
          </motion.h2>
        </div>

        {/* Horizontal Slider Area — auto-scroll + drag amb inèrcia */}
        <div
          ref={scrollRef}
          className="w-full flex overflow-x-hidden hide-scrollbar select-none touch-pan-y pl-4 md:pl-[3vw] lg:pl-[4vw] gap-8 md:gap-16 pb-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loopClients.map((client, index) => (
            <div
              key={`${client.name}-${index}`}
              aria-hidden={index >= clients.length}
              className="flex flex-col items-start min-w-[300px] max-w-[300px] md:min-w-[400px] md:max-w-[400px] shrink-0 cursor-grab active:cursor-grabbing"
            >
              <PlaceholderLogo name={client.logo} />
              <h3 className="text-heading-h3 text-text-main mb-4">
                {client.name}
              </h3>
              <p className="text-body-md text-text-secondary leading-relaxed pr-6 md:pr-12">
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
