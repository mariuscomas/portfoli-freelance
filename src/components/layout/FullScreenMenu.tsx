"use client";

import { motion, AnimatePresence } from "framer-motion";
import TransitionLink from "@/components/common/TransitionLink";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

interface MenuLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

const menuLinks: MenuLink[] = [
  { label: "Home", href: "/" },
  { label: "Treballs", href: "/works" },
  { label: "Serveis", href: "/services" },
  { label: "Sobre Mi", href: "/about" },
  { label: "Behance", href: "https://behance.net", isExternal: true },
  { label: "LinkedIn", href: "https://linkedin.com", isExternal: true },
  { label: "Contacte", href: "#contacte" },
];

export default function FullScreenMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Tripliquem els enllaços per crear l'efecte de loop infinit al fer scroll
  const infiniteLinks = [...menuLinks, ...menuLinks, ...menuLinks, ...menuLinks, ...menuLinks];

  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      
      // Posicionem al mig de la llista al principi
      const singleSetHeight = container.scrollHeight / 5;
      container.scrollTop = singleSetHeight * 2;

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const currentSetHeight = scrollHeight / 5;

        // Si arribem a dalt (primer set), saltem al quart set
        if (scrollTop < currentSetHeight) {
          container.scrollTop = scrollTop + currentSetHeight * 2;
        }
        // Si arribem a baix (últim set), saltem al segon set
        else if (scrollTop + clientHeight > scrollHeight - currentSetHeight) {
          container.scrollTop = scrollTop - currentSetHeight * 2;
        }
      };

      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ clipPath: "circle(0% at 95% 5%)" }}
          animate={{ clipPath: "circle(150% at 95% 5%)" }}
          exit={{ clipPath: "circle(0% at 95% 5%)" }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[100] w-full h-[100dvh] bg-[#1a1a1a] text-[#e5e5e5] flex flex-col overflow-hidden"
        >
          {/* Top Bar - Align with Header.tsx padding and style */}
          <div className="fixed top-0 w-full flex justify-between items-center px-4 md:px-8 lg:px-24 py-6 md:py-8 z-[110] bg-transparent pointer-events-none">
            <TransitionLink href="/" onClick={onClose} className="text-3xl font-bold tracking-tighter text-white pointer-events-auto h-8 lg:h-12 flex items-center">
              M<span className="text-text-secondary">!</span>
            </TransitionLink>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-text-main text-text-main-inverse rounded-full font-sans font-medium text-[16px] hover:scale-105 transition-transform uppercase tracking-normal pointer-events-auto"
            >
              Cerrar
            </button>
          </div>

          {/* Menu Content */}
          <div className="flex-1 flex flex-col justify-center items-center w-full h-full pt-20">
            
            {/* MOBILE / TABLET VIEW (< lg) */}
            <div className="flex lg:hidden flex-col w-full h-full overflow-y-auto px-6 py-10">
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } }
                }}
                className="flex flex-col w-full"
              >
                {menuLinks.map((link, i) => {
                  const isActive = pathname === link.href;
                  return (
                    <motion.div
                      key={`${link.label}-${i}`}
                      variants={{
                        hidden: { opacity: 0, y: 30 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <TransitionLink
                        href={link.href}
                        onClick={onClose}
                        className={`block w-full py-6 border-b border-[#333] group transition-opacity ${
                          isActive ? "opacity-100" : "opacity-40"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-4xl md:text-6xl font-bold uppercase tracking-tighter transition-all group-hover:translate-x-2 duration-300 ${
                            isActive ? "text-white" : "text-[#e5e5e5]"
                          }`}>
                            {link.label}
                          </span>
                          {link.isExternal && <ArrowUpRight size={32} className="opacity-50" />}
                        </div>
                      </TransitionLink>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* DESKTOP VIEW (lg+) - Infinite Scrollable List */}
            <div 
              ref={scrollContainerRef}
              className="hidden lg:flex w-full h-full overflow-y-auto scrollbar-hide px-10 cursor-ns-resize"
            >
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.3 } }
                }}
                className="flex flex-col items-center w-full py-[10vh] gap-0"
              >
                {infiniteLinks.map((link, i) => {
                  const isActive = pathname === link.href;
                  return (
                    <motion.div
                      key={`${link.label}-${i}`}
                      variants={{
                        hidden: { opacity: 0, y: 30 },
                        visible: { opacity: 1, y: 0 }
                      }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full text-center"
                    >
                      <TransitionLink
                        href={link.href}
                        onClick={onClose}
                        className={`group relative inline-flex items-center gap-12 py-4 transition-all duration-500 ease-out hover:scale-105 ${
                          isActive ? "opacity-100" : "opacity-30 hover:opacity-100"
                        }`}
                      >
                        <span className={`font-sans text-[1.5vw] transition-opacity duration-300 ${
                          isActive ? "opacity-100 text-white" : "opacity-30 group-hover:opacity-100"
                        }`}>
                          {String((i % menuLinks.length) + 1).padStart(2, '0')}
                        </span>
                        <span className={`text-[9vw] font-bold uppercase leading-[0.85] tracking-tighter transition-all duration-500 ${
                          isActive ? "text-white scale-105" : "text-white/20 group-hover:text-white"
                        }`}>
                          {link.label}
                        </span>
                        {link.isExternal && (
                          <ArrowUpRight 
                            className="w-[5vw] h-[5vw] opacity-20 group-hover:opacity-100 transition-opacity duration-500" 
                          />
                        )}
                      </TransitionLink>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

          </div>

          {/* Bottom Bar (Optional Branding) */}
          <div className="fixed bottom-0 w-full p-10 hidden lg:flex justify-between items-end pointer-events-none opacity-20">
             <div className="text-sm font-sans uppercase tracking-[0.2em]">Barcelona / 2026</div>
             <div className="text-sm font-sans uppercase tracking-[0.2em]">MÀRIUS COMAS ROSA</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
