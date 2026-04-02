import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import TransitionLink from "@/components/common/TransitionLink";
import Logo from "@/components/common/Logo";
import LogoSmall from "@/components/common/LogoSmall";
import { useIdle } from "@/hooks/useIdle";

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const { isIdle, hasInteracted } = useIdle(5000);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 400) { // Augmentat el threshold a 400px per a més "aire"
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  });

  const isVisible = hasInteracted && !isIdle;

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{
          opacity: isVisible ? 1 : 0,
          y: isVisible ? 0 : -20
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 md:px-8 lg:px-24 py-6 md:py-8 pointer-events-none"
      >

        {/* Esquerra (Logo Initial vs Logo Small) */}
        <div className="relative pointer-events-auto h-8 lg:h-12 flex items-center">
          <TransitionLink href="/" aria-label="Inici" className="hover:opacity-80 transition-opacity">
            {/* Desktop: Logo Inicial (Grand) */}
            <motion.div
              animate={{
                opacity: isScrolled ? 0 : 1,
                x: isScrolled ? -20 : 0
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className={`hidden lg:block ${isScrolled ? "pointer-events-none" : ""}`}
            >
              <Logo />
            </motion.div>

            {/* Desktop: Logo Small (Apareix al fer scroll) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: isScrolled ? 1 : 0,
                x: isScrolled ? 0 : -20
              }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
                delay: isScrolled ? 0.3 : 0
              }}
              className={`hidden lg:absolute top-0 left-0 ${!isScrolled ? "pointer-events-none" : ""}`}
            >
              <LogoSmall className="h-6 w-auto" />
            </motion.div>

            {/* Mobile: Logo Small (Sempre visible) */}
            <div className="lg:hidden">
              <LogoSmall className="h-6 w-auto" />
            </div>
          </TransitionLink>
        </div>

        {/* Centre (Navegació Absoluta - Fades out on scroll) */}
        <motion.nav
          animate={{
            opacity: isScrolled ? 0 : 1,
            y: isScrolled ? -10 : 0
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-6 lg:gap-12 pointer-events-auto ${isScrolled ? "pointer-events-none" : ""}`}
        >
          {["Treballs", "Serveis", "Sobre Mi"].map((item) => {
            let hrefItem = `/${item.toLowerCase().replace('è', 'e')}`;
            if (item === "Treballs") hrefItem = "/works";
            if (item === "Sobre Mi") hrefItem = "/about";

            const isActive = pathname === hrefItem;

            return (
              <TransitionLink
                key={item}
                href={hrefItem}
                className={`group relative font-sans text-[14px] lg:text-[20px] font-medium pb-[2px] transition-colors overflow-hidden whitespace-nowrap ${
                  isActive ? "text-text-main" : "text-text-secondary hover:text-text-main"
                }`}
              >
                {item}
                {/* Underline effect like "Comencem?" - with dynamism on active state */}
                <span className={`absolute left-0 bottom-0 w-full h-[1.5px] bg-text-main origin-right transition-transform duration-300 ease-out ${
                  isActive ? "scale-x-100 group-hover:scale-x-0" : "scale-x-0"
                }`} />
                <span className={`absolute left-0 bottom-0 w-full h-[1.5px] bg-text-main origin-left transition-transform duration-300 ease-out ${
                  isActive ? "scale-x-0 group-hover:scale-x-100 delay-[0.1s]" : "scale-x-0 group-hover:scale-x-100"
                }`} />
              </TransitionLink>
            );
          })}
        </motion.nav>

        {/* Dreta (Comencem? + Menu Button) */}
        <div className="relative flex items-center pointer-events-auto h-10 lg:h-12 gap-24">
          {/* CTA: Comencem? - Es desplaça a l'esquerra quan apareix el menú */}
          <motion.div
            animate={{
              x: isScrolled ? (window.innerWidth < 1024 ? 0 : -124) : 0
            }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            <TransitionLink
              href="#contacte"
              className="group relative hidden md:inline-block font-sans text-[14px] lg:text-[20px] font-medium text-text-secondary pb-[2px] overflow-hidden whitespace-nowrap"
            >
              Comencem?
              <span className="absolute left-0 bottom-0 w-full h-[1.5px] bg-text-secondary origin-right transition-transform duration-300 ease-out group-hover:scale-x-0" />
              <span className="absolute left-0 bottom-0 w-full h-[1.5px] bg-text-secondary origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 delay-[0.1s]" />
            </TransitionLink>
          </motion.div>

          {/* Botó Menú Desktop (lg+): Apareix a la dreta del Comencem? */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{
              opacity: isScrolled ? 1 : 0,
              x: isScrolled ? 0 : 20,
              pointerEvents: isScrolled ? "auto" : "none"
            }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              delay: isScrolled ? 0.3 : 0
            }}
            onClick={onMenuClick}
            className="absolute right-0 hidden lg:flex items-center gap-2 px-6 py-2 bg-text-main text-text-main-inverse rounded-full font-sans font-medium text-[16px] hover:scale-105 transition-transform"
          >
            Menu
          </motion.button>

          {/* Botó Menú Mòbil/Tablet (< lg): Sempre visible i amb estil de píndola */}
          <button
            onClick={onMenuClick}
            className="flex lg:hidden items-center justify-center px-5 py-2 bg-text-main text-text-main-inverse rounded-full font-sans font-medium text-[16px]"
            aria-label="Obrir Menú"
          >
            Menu
          </button>
        </div>

      </motion.header>
    </>
  );
}
