"use client";

import { motion } from "framer-motion";
import { ArrowUp, InstagramLogo, LinkedinLogo, TwitterLogo, BehanceLogo } from "@phosphor-icons/react";
import Logo from "@/components/common/Logo";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full bg-surface-elevated pt-20 pb-8 mt-20 md:pt-32">
      <div className="w-full px-4 md:px-[3vw] lg:px-[4vw] flex flex-col gap-16 md:gap-32">
        
        {/* Section A: Call to Action */}
        <div className="flex flex-col items-start gap-8 border-b border-text-main/10 pb-16 md:pb-24">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-heading text-6xl md:text-8xl lg:text-[140px] text-text-main uppercase leading-[0.85] max-w-5xl"
          >
            Estàs preparat per donar vida a les teves idees?
          </motion.h2>
          <motion.a
            href="/contacte" // Simulació
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-6 md:mt-12 px-8 py-5 md:px-12 md:py-6 bg-text-main text-bg-main font-sans font-medium text-xl md:text-2xl rounded-full hover:bg-text-secondary transition-all hover:scale-105"
          >
            Comencem un projecte
          </motion.a>
        </div>

        {/* Section B: Logo, Sitemap, Newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 pb-16 md:pb-24 border-b border-text-main/10">
          <div className="md:col-span-4 lg:col-span-5 flex flex-col gap-6">
            <Logo />
            <p className="font-sans text-text-secondary max-w-sm mt-4 text-lg">
              Disseny estratègic per a productes digitals que destaquen.
            </p>
          </div>
          
          <div className="md:col-span-3 lg:col-span-3 flex flex-col gap-6">
            <h4 className="font-sans text-text-main font-semibold uppercase tracking-widest text-sm">Sitemap</h4>
            <nav className="flex flex-col gap-4 font-sans text-lg text-text-secondary">
              <a href="#" className="hover:text-text-main transition-colors w-fit">Inici</a>
              <a href="#" className="hover:text-text-main transition-colors w-fit">Treballs</a>
              <a href="#" className="hover:text-text-main transition-colors w-fit">Serveis</a>
              <a href="#" className="hover:text-text-main transition-colors w-fit">Mètode</a>
              <a href="/about" className="hover:text-text-main transition-colors w-fit">Sobre mi</a>
            </nav>
          </div>

          <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-6">
            <h4 className="font-sans text-text-main font-semibold uppercase tracking-widest text-sm">Newsletter</h4>
            <p className="font-sans text-text-secondary text-lg">Rep el millor contingut sobre disseny i estratègia directament al teu correu.</p>
            <form className="flex flex-col gap-4 mt-2" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="correu@exemple.com"
                className="w-full bg-surface-highlight border border-text-main/20 rounded-xl px-6 py-4 text-text-main font-sans focus:outline-none focus:border-text-main focus:ring-1 focus:ring-text-main transition-all placeholder:text-text-secondary/50"
              />
              <button 
                type="submit"
                className="w-full bg-text-main text-bg-main font-sans font-medium py-4 rounded-xl hover:bg-text-secondary transition-colors"
              >
                Subscriu-me
              </button>
            </form>
          </div>
        </div>

        {/* Section C: Copyright, Socials, Back to Top */}
        <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-8 pt-4">
          <p className="font-sans text-text-secondary text-sm md:text-base">
            © {new Date().getFullYear()} Màrius. Tots els drets reservats.
          </p>
          
          <div className="flex gap-6 items-center">
            <a href="#" className="text-text-main opacity-60 hover:opacity-100 transition-opacity" aria-label="LinkedIn"><LinkedinLogo size={24} /></a>
            <a href="#" className="text-text-main opacity-60 hover:opacity-100 transition-opacity" aria-label="Twitter"><TwitterLogo size={24} /></a>
            <a href="#" className="text-text-main opacity-60 hover:opacity-100 transition-opacity" aria-label="Instagram"><InstagramLogo size={24} /></a>
            <a href="#" className="text-text-main opacity-60 hover:opacity-100 transition-opacity" aria-label="Behance"><BehanceLogo size={24} /></a>
          </div>

          <button 
            onClick={scrollToTop}
            className="flex items-center gap-2 text-text-main hover:text-text-secondary transition-colors font-sans text-sm uppercase font-semibold group"
            aria-label="Back to top"
          >
            Tornar a dalt
            <span className="p-2 border border-text-main/20 rounded-full group-hover:border-text-secondary transition-colors">
               <ArrowUp size={16} />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
