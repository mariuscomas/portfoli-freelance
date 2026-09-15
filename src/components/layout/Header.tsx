"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useReducedMotion } from "framer-motion";
import TransitionLink from "@/components/common/TransitionLink";
import Logo from "@/components/common/Logo";
import LogoSmall from "@/components/common/LogoSmall";
import { useScrollHide } from "@/hooks/useScrollHide";
import { useHeaderContrast } from "@/context/HeaderContrastContext";
import { useFooterReveal } from "@/context/FooterRevealContext";
import { useContactModal } from "@/context/ContactModalContext";

/*
  <Header />
  ----------
  Dos estats estil Motto:

   - EXPANDIT (scrollY ≤ 100): [ MARIUS wordmark ]   Treballs · Serveis · Sobre Mi   [ Comencem? ]
   - COMPACTE (scrollY > 100): [ M ]                                       [ Comencem? ] [ Menu ]

  Decisions tècniques per màxima fluïdesa:
  - TOT sempre muntat. No AnimatePresence (evita mount/unmount jank).
  - Animacions només d'opacity + transform (GPU). Cap animació de width.
  - Logos absolute-stacked amb wrapper d'amplada fixa → crossfade sense
    salts de layout.
  - Histeresi al threshold (enter 100 / exit 50) → si l'usuari scrolla
    a la vora dels 100px, no flickeja entre estats.
  - Mobile: sempre compacte (no hi caben links inline).

  Altres comportaments preservats:
  - Apareix al muntar qualsevol pàgina, inclosa la Home (~1s després).
  - AUTO-HIDE DIRECCIONAL (15set26, substitueix l'antic idle-hide de 5s):
    scroll avall per sota dels 100px → s'amaga; scroll amunt → torna.
    L'idle amagava la nav mentre l'usuari llegia quiet i a mòbil no hi ha
    mousemove per recuperar-la; el direccional és intencional i reversible
    amb el mateix gest. Vegeu useScrollHide per als llindars.
  - Excepcions que el tornen visible: focus de teclat dins del header
    (si no, fent Tab el focus aniria a parar a un header fora de pantalla,
    WCAG 2.4.11) i el tancament del menú o del modal de contacte.
  - Contrast del Header (light/dark/auto) declarat per la pàgina via HeaderContrastContext.
*/

const inlineNavLinks: { label: string; href: string }[] = [
  { label: "Treballs", href: "/works" },
  { label: "Serveis", href: "/serveis" },
  { label: "Col·laboració", href: "/colaboracio" },
  { label: "Qui soc", href: "/about" },
];

// Histeresi: 50px de "deadband" perquè el toggle no flickeji
const COMPACT_ENTER = 100; // scroll baixa cap a expandit només per sota
const COMPACT_EXIT = 50; // si ja és compacte, no torna a expandit fins aquí

// Timings — uns 250ms se senten ràpids però no abruptes; amb easing easeOutQuint
const ANIM_DURATION = 0.28;
const ANIM_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
// El layout shift Comencem ↔ Menu va més lent per donar més presència
// al desplaçament físic (és l'efecte més visible del scroll-to-compact).
const LAYOUT_SHIFT_DURATION = 0.5;
// La crossfade Logo ↔ LogoSmall també va més lenta (com a Motto): no
// és un mer aparèixer/desaparèixer, sinó un morph subtil amb scale.
const LOGO_TRANSITION_DURATION = 0.5;
// Entrada/sortida del header sencer per direcció d'scroll.
const HIDE_DURATION = 0.35;

export default function Header({
  onMenuClick,
  isMenuOpen = false,
}: {
  onMenuClick: () => void;
  isMenuOpen?: boolean;
}) {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [hasMounted, setHasMounted] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const { hidden: isScrollHidden, show } = useScrollHide(COMPACT_ENTER);
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const contrast = useHeaderContrast();
  const { revealed: isFooterRevealed } = useFooterReveal();
  const { open: openContactModal, isOpen: isContactOpen } = useContactModal();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsCompact((prev) => {
      // Histeresi — dos llindars diferents segons l'estat actual
      if (prev) return latest > COMPACT_EXIT;
      return latest > COMPACT_ENTER;
    });
  });

  // Inicialitzem abans del primer scroll event i marquem el muntatge
  useEffect(() => {
    setIsCompact(window.scrollY > COMPACT_ENTER);
    const t = setTimeout(() => setHasMounted(true), 1000);
    return () => clearTimeout(t);
  }, [pathname]);

  // En tancar el menú o el modal de contacte el header torna visible, encara
  // que abans estigués amagat: no volem deixar l'usuari sense nav just
  // després de tancar un overlay. Mentre són oberts l'scroll està bloquejat
  // (overflow:hidden al body), així que el direccional no dispara sol.
  const isOverlayOpen = isMenuOpen || isContactOpen;
  const wasOverlayOpen = useRef(isOverlayOpen);
  useEffect(() => {
    if (wasOverlayOpen.current && !isOverlayOpen) show();
    wasOverlayOpen.current = isOverlayOpen;
  }, [isOverlayOpen, show]);

  // El Header s'amaga també quan el footer s'està revelant (el bloc fosc
  // puja per sobre del contingut i el taparia).
  const isVisible =
    hasMounted && !isFooterRevealed && (!isScrollHidden || hasFocusWithin);

  // Amb reduced-motion el header no es desplaça: només es fon. Llavors sí
  // que cal tallar-li els clics, perquè invisible segueix ocupant la franja.
  const pe = isVisible ? "pointer-events-auto" : "pointer-events-none";

  // Tokens condicionals segons el contrast declarat per la pàgina.
  //  - underline: color de la línia base (estat active).
  //  - underlineHover: color de la línia que entra a hover (substitueix
  //    el verd accent original, que clashava sobre fons clars). En auto
  //    salta de secondary a main per donar contrast al hover. En fixed
  //    modes es manté el mateix color que la base (l'efecte ve donat per
  //    l'animació de slide-in, no del canvi de color).
  const c =
    contrast === "light"
      ? {
          link: "text-text-fixed-light hover:text-text-fixed-light/80",
          underline: "bg-text-fixed-light",
          underlineHover: "bg-text-fixed-light",
          button: "bg-text-fixed-light text-text-fixed-dark",
        }
      : contrast === "dark"
      ? {
          link: "text-text-fixed-dark hover:text-text-fixed-dark/80",
          underline: "bg-text-fixed-dark",
          underlineHover: "bg-text-fixed-dark",
          button: "bg-text-fixed-dark text-text-fixed-light",
        }
      : {
          // Hover classic: secondary → main (negre en light theme, blanc en
          // dark theme). Substitueix el text-accent que era massa cridaner
          // sobre fons clars.
          link: "text-text-secondary hover:text-text-main",
          underline: "bg-text-secondary",
          underlineHover: "bg-text-main",
          button: "bg-text-main text-text-main-inverse",
        };

  const logoColor =
    contrast === "light"
      ? "text-text-fixed-light"
      : contrast === "dark"
      ? "text-text-fixed-dark"
      : "text-text-main";

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        y: isVisible ? 0 : prefersReducedMotion ? 0 : "-100%",
      }}
      transition={{
        duration: hasMounted ? HIDE_DURATION : 0.6,
        ease: ANIM_EASE,
      }}
      onFocusCapture={() => setHasFocusWithin(true)}
      onBlurCapture={() => setHasFocusWithin(false)}
      className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 md:px-8 lg:px-24 py-6 md:py-8 pointer-events-none"
    >
      {/*
        Esquerra: Logo amb crossfade absolute-stacked.
        El wrapper té amplada fixa de 100px (suficient per al wordmark sencer)
        perquè el layout no salti al canviar entre Logo full i LogoSmall.
        Mobile: només LogoSmall, no es transicionará.
      */}
      <div className={`${pe} flex items-center ${logoColor} transition-colors duration-300`}>
        <TransitionLink href="/" aria-label="Inici" className="hover:opacity-80 transition-opacity">
          {/* Desktop (md+) — crossfade entre Logo i LogoSmall.
              Scale subtil (0.85 → 1) afegeix sensació de morph: el logo
              que entra "creix" cap a la seva posició mentre el que surt
              "encongeix" i es desvaneix. Combinat amb 500ms de durada,
              se sent més fluid que un crossfade pur d'opacity. */}
          <div className="hidden md:block relative w-[100px] h-7">
            <motion.span
              animate={{
                opacity: isCompact ? 0 : 1,
                scale: isCompact ? 0.85 : 1,
              }}
              transition={{ duration: LOGO_TRANSITION_DURATION, ease: ANIM_EASE }}
              className="absolute inset-0 flex items-center will-change-[opacity,transform]"
              aria-hidden={isCompact}
            >
              <Logo className="h-6 w-auto" />
            </motion.span>
            <motion.span
              animate={{
                opacity: isCompact ? 1 : 0,
                scale: isCompact ? 1 : 0.85,
              }}
              transition={{ duration: LOGO_TRANSITION_DURATION, ease: ANIM_EASE }}
              className="absolute inset-0 flex items-center will-change-[opacity,transform]"
              aria-hidden={!isCompact}
            >
              <LogoSmall className="h-6 w-auto" />
            </motion.span>
          </div>
          {/* Mobile (< md) — només LogoSmall */}
          <div className="block md:hidden">
            <LogoSmall className="h-6 w-auto" />
          </div>
        </TransitionLink>
      </div>

      {/*
        Centre: links inline sempre muntats (només visibles a lg+).
        Animar opacity + y; pointer-events lligat a isCompact perquè quan
        siguin invisibles no siguin clicables. Mantenir-los muntats permet
        que justify-between mantingui un layout estable.
      */}
      <motion.nav
        animate={{
          opacity: isCompact ? 0 : 1,
          y: isCompact ? -6 : 0,
        }}
        transition={{ duration: ANIM_DURATION, ease: ANIM_EASE }}
        style={{ pointerEvents: isCompact || !isVisible ? "none" : "auto" }}
        aria-label="Navegació principal"
        aria-hidden={isCompact}
        className="hidden lg:flex items-center gap-10 will-change-[opacity,transform]"
      >
        {inlineNavLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <TransitionLink
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`group relative font-sans text-[16px] lg:text-[18px] font-medium pb-[2px] overflow-hidden transition-colors duration-300 ${c.link}`}
            >
              {link.label}
              {/*
                Underline base (color del contrast) — INVISIBLE per defecte
                als links no-actius; només es mostra quan la pàgina és activa.
                Si és active i fem hover, retrocedeix per donar pas a l'accent.
              */}
              <span
                className={`absolute left-0 bottom-0 w-full h-[1.5px] origin-right transition-transform duration-300 ease-out ${c.underline}
                  ${isActive ? "scale-x-100 group-hover:scale-x-0" : "scale-x-0"}`}
              />
              {/*
                Underline accent — només a hover (entra des de l'esquerra,
                amb 100ms de retard perquè se sincronitzi amb la sortida del
                base quan és active).
              */}
              <span className={`absolute left-0 bottom-0 w-full h-[1.5px] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 delay-[0.1s] ${c.underlineHover}`} />
            </TransitionLink>
          );
        })}
      </motion.nav>

      {/*
        Dreta: Comencem? amb `layout` perquè es desplaci suaument cap a
        l'esquerra quan apareix el Menu (estil Motto). El Menu entra/surt
        amb AnimatePresence `mode="popLayout"` — l'element que surt es posa
        en `position: absolute` durant l'exit perquè el flex es reordeni
        immediatament i el `layout` del Comencem? animi el desplaçament en
        paral·lel amb el fade del Menu.
      */}
      <div className={`flex items-center gap-6 lg:gap-8 ${pe} h-10 lg:h-12`}>
        <motion.div
          layout
          transition={{ duration: LAYOUT_SHIFT_DURATION, ease: ANIM_EASE }}
          className="will-change-transform"
        >
          {/* Ja no navega a /contacte: obre el modal de contacte (cortina). */}
          <button
            type="button"
            onClick={openContactModal}
            className={`group relative hidden md:inline-block font-sans text-[14px] lg:text-[20px] font-medium pb-[2px] overflow-hidden whitespace-nowrap transition-colors duration-300 cursor-pointer ${c.link}`}
          >
            Comencem?
            <span className={`absolute left-0 bottom-0 w-full h-[1.5px] origin-right transition-transform duration-300 ease-out group-hover:scale-x-0 ${c.underline}`} />
            <span className={`absolute left-0 bottom-0 w-full h-[1.5px] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 delay-[0.1s] ${c.underlineHover}`} />
          </button>
        </motion.div>

        <AnimatePresence mode="popLayout" initial={false}>
          {isCompact && (
            <motion.button
              key="menu-btn"
              layout
              onClick={onMenuClick}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: LAYOUT_SHIFT_DURATION, ease: ANIM_EASE }}
              style={{ transformOrigin: "right center" }}
              className={`flex items-center justify-center px-5 lg:px-6 py-2 rounded-full font-sans font-medium text-[14px] lg:text-[16px] hover:scale-105 transition-colors duration-300 whitespace-nowrap will-change-[opacity,transform]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-text-main focus-visible:ring-offset-surface-base ${c.button}`}
              aria-label="Obrir Menú"
            >
              Menu
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
