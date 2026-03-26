"use client";

import { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import LogoSmall from "@/components/common/LogoSmall";

export default function Header() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  });

  return (
    <>
      <header className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-4 md:px-8 lg:px-10 py-6 md:py-8">

        {/* Esquerra (Logo) */}
        <Link href="/" aria-label="Inici" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>

        {/* Centre (Navegació Absoluta per simetria perfecta) */}
        <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-6 lg:gap-12">
          {["Treballs", "Serveis", "Sobre Mi"].map((item) => {
            let hrefItem = `/${item.toLowerCase().replace('è', 'e')}`;
            if (item === "Treballs") hrefItem = "/works";
            if (item === "Sobre Mi") hrefItem = "/about";

            return (
              <Link
                key={item}
                href={hrefItem}
                className="font-sans text-[14px] lg:text-[20px] font-medium text-text-main hover:text-text-secondary transition-colors"
              >
                {item}
              </Link>
            );
          })}
        </nav>

        {/* Dreta (Accions inicials flotants) */}
        <div className="flex items-center gap-6 lg:gap-10">
          <Link
            href="#contacte"
            className="group relative hidden md:inline-block font-sans text-[14px] lg:text-[24px] font-medium text-text-secondary pb-[2px] overflow-hidden"
          >
            Comencem?
            {/* Underline permanent que desapareix cap a la dreta i torna per l'esquerra al fer hover */}
            <span className="absolute left-0 bottom-0 w-full h-[1.5px] bg-text-secondary origin-right transition-transform duration-300 ease-out group-hover:scale-x-0" />
            <span className="absolute left-0 bottom-0 w-full h-[1.5px] bg-text-secondary origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 delay-[0.1s]" />
          </Link>
        </div>

      </header>

      {/* Capçalera Flotant "Fixed" que apareix nomes en Scroll (Logo Petit + Botó Menú) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{
          opacity: isScrolled ? 1 : 0,
          y: isScrolled ? 0 : -20,
          pointerEvents: isScrolled ? "auto" : "none"
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-[100] flex justify-between items-start px-4 md:px-8 lg:px-10 pt-6 md:pt-8 pointer-events-none"
      >
        <Link href="/" aria-label="Inici" className="hover:opacity-80 transition-opacity text-text-main pointer-events-auto">
          <LogoSmall />
        </Link>

        {/* Botó Menu tipus Pill (WeAreMotto Style 10596:3192) */}
        <button
          className="group flex items-center justify-between gap-3 px-5 py-2.5 bg-surface-base/80 backdrop-blur-md text-text-main font-sans font-medium text-sm tracking-wide rounded-full border border-text-main/10 hover:border-text-main/30 hover:shadow-sm transition-all shrink-0 pointer-events-auto shadow-[0px_4px_30px_rgba(0,0,0,0.05)]"
        >
          <span>Menu</span>
          <span className="p-1.5 bg-text-main/5 group-hover:bg-text-main/10 rounded-full transition-colors flex flex-col justify-center items-center gap-[3px] w-6 h-6">
            <span className="w-3 h-[1.5px] bg-text-main block rounded-full" />
            <span className="w-3 h-[1.5px] bg-text-main block rounded-full" />
          </span>
        </button>
      </motion.div>
    </>
  );
}
