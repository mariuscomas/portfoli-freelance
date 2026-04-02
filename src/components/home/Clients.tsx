"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";

const PlaceholderLogo = ({ name }: { name: string }) => (
  <div className="h-12 md:h-16 flex items-center mb-10 text-text-main">
    {/* A simple typographic placeholder that simulates a logo if no SVG is present */}
    <span className="font-heading font-bold text-3xl md:text-4xl tracking-tighter">{name}</span>
  </div>
);

const clients = [
  { logo: "North", name: "The North Studio", desc: "La meva història no comença amb un llapis, sinó amb línies de codi. Aquesta base tècnica em permet dissenyar productes." },
  { logo: "QUANTION", name: "Quantion", desc: "La meva història no comença amb un llapis, sinó amb línies de codi. Aquesta base tècnica em permet dissenyar productes." },
  { logo: "CUPRA", name: "Cupra", desc: "La meva història no comença amb un llapis, sinó amb línies de codi. Aquesta base tècnica em permet dissenyar productes." },
  { logo: "santalucía", name: "Santalucía", desc: "La meva història no comença amb un llapis, sinó amb línies de codi. Aquesta base tècnica em permet dissenyar productes." },
  { logo: "Alpha", name: "Alpha", desc: "La meva història no comença amb un llapis, sinó amb línies de codi. Aquesta base tècnica em permet dissenyar productes." },
];

export default function Clients() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full py-24 md:py-40 bg-surface-base">
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

          {/* Navigation Arrows */}
          <div className="flex gap-4 md:gap-6 pb-2 md:pb-6">
            <button
              onClick={scrollLeft}
              className="text-text-main hover:text-text-secondary transition-colors"
              aria-label="Anterior client"
            >
              <ArrowLeft size={32} weight="light" className="md:w-10 md:h-10 lg:w-12 lg:h-12" />
            </button>
            <button
              onClick={scrollRight}
              className="text-text-main hover:text-text-secondary transition-colors"
              aria-label="Següent client"
            >
              <ArrowRight size={32} weight="light" className="md:w-10 md:h-10 lg:w-12 lg:h-12" />
            </button>
          </div>
        </div>

        {/* Horizontal Slider Area */}
        <div
          ref={scrollRef}
          className="w-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pl-4 md:pl-[3vw] lg:pl-[4vw] pr-4 md:pr-[20vw] gap-8 md:gap-16 pb-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {clients.map((client, index) => (
            <motion.div
              key={`${client.name}-${index}`}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="flex flex-col items-start min-w-[300px] max-w-[300px] md:min-w-[400px] md:max-w-[400px] snap-start shrink-0 cursor-default"
            >
              <PlaceholderLogo name={client.logo} />
              <h3 className="font-sans font-bold text-xl md:text-2xl text-text-main mb-4">
                {client.name}
              </h3>
              <p className="font-sans text-base md:text-[17px] text-text-secondary leading-relaxed pr-6 md:pr-12">
                {client.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
      {/* Internal inline style per amagar la scrollbar a webkit */}
      <style dangerouslySetInnerHTML={{
        __html: `
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
`}} />
    </section>
  );
}
