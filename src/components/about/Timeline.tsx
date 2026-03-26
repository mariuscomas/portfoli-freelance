"use client";

import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";

const timelineData = [
  { year: "2009", number: "01", title: "Els Fonaments Audiovisuals", description: "Grau Superior en Realització Audiovisual i Multimèdia (EMAV). Adquisició de bases sòlides en composició visual, ritme i narrativa multimèdia" },
  { year: "2011", number: "02", title: "El Salt al Disseny Digital", description: "Grau en Disseny Multimèdia (UOC). Transició del desenvolupament pur a l'especialització en Experiència d'Usuari (UX) i Disseny d'Interfícies (UI). Inici formal de la meva trajectòria com a dissenyador autònom." },
  { year: "2014", number: "03", title: "La Base Tècnica", description: "Freelance Web Designer & Developer. Execució de projectes end-to-end combinant disseny i programació. Aquesta experiència escrivint codi m'assegura dissenyar productes 100% viables i sense friccions per als desenvolupadors." },
  { year: "2018", number: "04", title: "Consolidació Independent", description: "Super Malter & Freelance Senior. Reconeixement com a perfil d'alt rendiment a la plataforma Malt , avalat per més de 60 projectes d'èxit, +7 anys d'experiència a la plataforma i la màxima qualificació per part dels clients (5/5)." },
  { year: "2020", number: "05", title: "Optimització i Conversió (Holaluz)", description: "Consultoria UI/UX i maquetació. Col·laboració estratègica amb l'energètica Holaluz centrada en el disseny i maquetació avançada de campanyes d'email. Execució de tests A/B per prendre decisions basades en dades, millorar la retenció de l'usuari i maximitzar les mètriques de conversió directes." },
  { year: "2021", number: "06", title: "Escalat i MVPs", description: "UI/UX Product Designer a Quantion. Lideratge en la definició, investigació i prototipatge de productes digitals (MVPs) altament escalables per al sector assegurador i l'administració pública" },
  { year: "2023", number: "07", title: "Innovació HMI i Automoció", description: "Senior UI/UX Product Designer a North Studio (Projecte Cupra). Disseny de les interfícies avançades de l'usuari (HMI) per a la pròxima generació de vehicles, col·laborant amb enginyeria per alinear els objectius d'innovació amb la funcionalitat pura." },
  { year: "2025", number: "08", title: "Present | Visió Global, Execució Local", description: "Product Designer des de l'Empordà. Aplicant més d'una dècada d'aprenentatge per ajudar marques exigents a dissenyar els ecosistemes digitals del demà." }
];

export default function Timeline() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const isDraggingThumb = useRef(false);

  // --- LÒGICA DE SINCRONITZACIÓ (SCROLL DE TARGETES -> MOU MARCA) ---
  const handleScroll = () => {
    if (isDraggingThumb.current || !sliderRef.current || !trackRef.current || !thumbRef.current) return;

    // Calculem el percentatge de desplaçament de l'scroll horitzontal
    const maxScroll = sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
    const percentage = maxScroll > 0 ? sliderRef.current.scrollLeft / maxScroll : 0;

    // Apliquem aquest percentatge al desplaçament de la marca (Scrubber)
    const maxTranslate = trackRef.current.clientWidth - thumbRef.current.clientWidth;
    const thumbX = percentage * maxTranslate;
    thumbRef.current.style.transform = `translateX(${thumbX}px)`;
  };

  // --- LÒGICA D'ARROSSEGAMENT (MOU MARCA -> SCROLL DE TARGETES) ---
  const handleThumbMouseDown = (_e: React.MouseEvent | React.TouchEvent) => {
    isDraggingThumb.current = true;
    document.body.style.userSelect = 'none'; // Evita que es seleccioni text mentre arrossegues
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingThumb.current || !trackRef.current || !sliderRef.current || !thumbRef.current) return;

      let clientX = 0;
      if ('touches' in e) {
        clientX = e.touches[0].clientX; // Suport per a dispositius mòbils (tàctil)
      } else {
        clientX = (e as MouseEvent).clientX; // Suport per a ratolí
      }

      const trackRect = trackRef.current.getBoundingClientRect();
      const thumbWidth = thumbRef.current.clientWidth;

      // Centrem la marca al cursor del ratolí dins dels límits del track
      let newX = clientX - trackRect.left - (thumbWidth / 2);
      const maxTranslate = trackRect.width - thumbWidth;
      newX = Math.max(0, Math.min(newX, maxTranslate));

      // 1. Movem la marca manualment
      thumbRef.current.style.transform = `translateX(${newX}px)`;

      // 2. Apliquem el canvi percentual a l'scroll de les targetes
      const percentage = newX / maxTranslate;
      const maxScroll = sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
      sliderRef.current.scrollLeft = percentage * maxScroll;
    };

    const handleEnd = () => {
      isDraggingThumb.current = false;
      document.body.style.userSelect = '';
    };

    // Afegim els esdeveniments a la finestra global per no perdre el control si el cursor surt de la marca
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, []);

  return (
    <section className="w-full pt-20 md:pt-32 pb-0 bg-surface-base overflow-hidden border-t border-surface-border flex flex-col">

      {/* --- ZONA 1: CONTINGUT HORITZONTAL --- */}
      <div
        ref={sliderRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto hide-scrollbar pl-6 md:pl-12 lg:pl-16 pr-[10vw] items-stretch mb-8"
      >
        {timelineData.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: index * 0.08 }}
            className="shrink-0 w-[85vw] md:w-[26rem] lg:w-[35rem] flex flex-col h-auto pr-12 md:pr-16"
          >
            <p className="text-display-h2 md:text-display-2xl tracking-tighter text-text-main leading-none mb-10">{item.number}</p>
            <h3 className="text-heading-h3">{item.title}</h3>
            <p className="text-body-md text-text-main font-medium leading-relaxed mt-4">{item.description}</p>

            {/* Ara l'any queda perfectament net a sota de cada targeta */}
            <div className="mt-auto pt-16">
              <span className="text-body-md font-bold tracking-widest text-text-main block">
                {item.year}
              </span>
            </div>
          </motion.div>
        ))}

        {/* TARGETA DE COMING SOON AL FINAL */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="shrink-0 w-[50vw] md:w-[30vw] flex flex-col justify-center items-center"
        >
          <span className="text-body-sm font-semibold uppercase tracking-widest text-text-muted">
            COMING SOON
          </span>
        </motion.div>
      </div>

      {/* --- ZONA 2: TIMELINE INTERACTIU (SCRUBBER INFERIOR) --- */}
      <div
        className="relative w-full h-16 bg-surface-base overflow-hidden flex items-center mt-auto border-t border-text-main/10"
        ref={trackRef}
      >
        {/* Línia Central */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-text-main/10 -translate-y-1/2 pointer-events-none" />

        {/* Ticks/Marques distribuïdes (Decoració) */}
        <div className="absolute inset-0 flex justify-between items-end px-8 md:px-16 pointer-events-none opacity-40">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="w-[1px] h-3 bg-text-main/30" />
          ))}
        </div>

        {/* Marca Draggable (< | >) */}
        <div
          ref={thumbRef}
          onMouseDown={handleThumbMouseDown}
          onTouchStart={handleThumbMouseDown}
          className="absolute top-0 h-full flex items-center justify-center cursor-grab active:cursor-grabbing z-10 text-text-main"
          style={{ touchAction: 'none' }} // Crucial perquè no interfereixi amb l'scroll vertical natiu al mòbil
        >
          {/* Fons sòlid per tapar la línia central mentre passa per sobre */}
          <div className="bg-surface-base px-2">
            <svg width="41" height="32" viewBox="0 0 41 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.3997 20.4232L7.97656 16L12.3997 11.5769L12.8853 12.0625L8.94781 16L12.8853 19.9375L12.3997 20.4232Z" fill="currentColor" />
              <line x1="19.8984" y1="32" x2="19.8984" y2="0" stroke="currentColor" />
              <path d="M31.8516 16L27.9141 12.0625L28.3997 11.5769L32.8228 16L28.3997 20.4232L27.9141 19.9375L31.8516 16Z" fill="currentColor" />
            </svg>
          </div>
        </div>

      </div>
    </section>
  );
}