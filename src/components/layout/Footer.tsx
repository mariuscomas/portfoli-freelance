"use client";

import { motion } from "framer-motion";
import { ArrowUp, ArrowRight, LinkedinLogo, BehanceLogo, Globe } from "@phosphor-icons/react";
import Link from "next/link";
import LogoSmall from "@/components/common/LogoSmall";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full flex flex-col mt-20 md:mt-32">

      {/* BLOC 1: PRE-FOOTER (Call to Action Clara) */}
      <div className="w-full bg-surface-base px-6 md:px-12 lg:px-24 py-20 md:py-32 flex flex-col items-start gap-8 md:gap-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-sans font-light text-5xl md:text-7xl lg:text-[90px] xl:text-[48px] text-text-main leading-[1.05] tracking-tight max-w-[1200px]"
        >
          Estas preparat per donar<br className="hidden md:block" /> vida a les teves ideas?
        </motion.h2>

        <motion.a
          href="/contacte"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-sans font-medium text-lg md:text-xl text-text-main border-b border-text-main pb-1 hover:text-text-secondary hover:border-text-secondary transition-colors mt-2 md:mt-6"
        >
          Reserva una trucada
        </motion.a>
      </div>

      {/* BLOC 2: MAIN FOOTER (Fosc Inferior) */}
      <div className="w-full bg-surface-card-inverse text-text-main-inverse px-6 md:px-12 lg:px-24 pt-20 md:pt-32 pb-8 flex flex-col gap-16 md:gap-24">

        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 pb-16 md:pb-24 border-b border-text-main-inverse/20">

          {/* Col 1: Bio & Sitemap */}
          <div className="flex flex-col items-start justify-between gap-12 lg:pr-12 text-lg">
            {/* Logo Scroll Simplificat */}
            <div className="text-text-main-inverse w-auto">
              <LogoSmall className="h-14 lg:h-20 w-auto" />
            </div>

            <p className="font-sans text-text-secondary-inverse font-medium text-lg md:text-xl leading-relaxed tracking-tight max-w-[280px]">
              Digital Product Designer <br className="hidden md:block" /> specializing in UI/UX.
            </p>

            {/* Sitemap Horizontal List */}
            <nav className="flex flex-wrap items-center gap-x-6 md:gap-x-8 gap-y-4 pt-4">
              {['Home', 'Treballs', 'Serveis', 'Sobre Mi'].map((item) => {
                let href = "/";
                if (item === "Treballs") href = "/works";
                else if (item === "Serveis") href = "/serveis";
                else if (item === "Sobre Mi") href = "/about";

                return (
                  <Link
                    href={href}
                    key={item}
                    className="font-sans font-medium text-text-main-inverse hover:text-text-secondary-inverse transition-colors"
                  >
                    {item}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Col 2: Newsletter */}
          <div className="flex flex-col justify-end gap-10 md:max-w-xl lg:max-w-md lg:ml-auto w-full">
            <p className="font-sans text-text-main-inverse text-lg md:text-[22px] font-medium leading-snug tracking-tight">
              Rep informació valuosa sobre disseny, experiencies i estrategia directament a la teva safata d'entrada.
            </p>

            <form className="relative flex items-center w-full group mt-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="El teu email aquí"
                className="w-full bg-transparent border-b border-text-secondary-inverse/40 py-4 pr-12 text-text-main-inverse font-sans text-2xl md:text-[28px] focus:outline-none focus:border-text-main-inverse transition-colors placeholder:text-text-secondary-inverse/40"
              />
              <button
                type="submit"
                className="absolute right-0 bottom-3 text-text-main-inverse opacity-60 group-hover:opacity-100 hover:text-text-secondary-inverse hover:translate-x-1 transition-all p-2 border-b border-transparent"
                aria-label="Submit email"
              >
                <ArrowRight size={28} weight="regular" />
              </button>
            </form>

            <p className="font-sans text-xs md:text-[13px] text-text-secondary-inverse/70 leading-relaxed" style={{ textWrap: "balance" }}>
              En registrar-vos per rebre correus electrònics de Motto, accepteu la nostra Política de privacitat. Tractem la vostra informació de manera responsable. Cancel·leu la subscripció quan vulgueu.
            </p>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Socials */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0 pb-4">

          <div className="flex items-center font-sans text-text-secondary-inverse text-[15px] font-medium w-full md:w-auto justify-center md:justify-start">
            <span>© 2009-{new Date().getFullYear()} Màrius Freelance</span>
          </div>

          {/* Socials Centered */}
          <div className="flex gap-8 items-center text-text-secondary-inverse w-full md:w-auto justify-center md:absolute md:left-1/2 md:-translate-x-1/2">
            <a href="#" className="hover:text-text-main-inverse hover:scale-110 transition-all" aria-label="Globe"><Globe size={24} /></a>
            <a href="#" className="hover:text-text-main-inverse hover:scale-110 transition-all" aria-label="LinkedIn"><LinkedinLogo size={24} /></a>
            <a href="#" className="hover:text-text-main-inverse hover:scale-110 transition-all" aria-label="Behance"><BehanceLogo size={24} /></a>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center justify-center gap-3 text-text-secondary-inverse hover:text-text-main-inverse transition-colors font-sans text-[15px] font-medium group w-full md:w-auto"
            aria-label="Back to top"
          >
            Back to top <ArrowUp size={16} className="group-hover:-translate-y-1 transition-transform" />
          </button>

        </div>
      </div>
    </footer>
  );
}
