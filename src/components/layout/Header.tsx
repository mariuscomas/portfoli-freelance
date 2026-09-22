"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useReducedMotion } from "framer-motion";
import MenuIcon from "@/components/common/MenuIcon";
import TransitionLink from "@/components/common/TransitionLink";
import LogoSmall from "@/components/common/LogoSmall";
import { useScrollHide } from "@/hooks/useScrollHide";
import { useMediaQuery, BELOW_LG_QUERY } from "@/hooks/useMediaQuery";
import { useHeaderContrast } from "@/context/HeaderContrastContext";
import { useFooterReveal } from "@/context/FooterRevealContext";
import { useContactModal } from "@/context/ContactModalContext";
import Button from "@/components/ui/Button";

/*
  <Header />
  ----------
  Dos estats estil Motto:

   - EXPANDIT (scrollY ≤ 100): [ M. ]   Treballs · Serveis · Col·laboració · Qui soc   [ Comencem? ]
   - COMPACTE (scrollY > 100): [ M. ]                                       [ Comencem? ] [ Menú ]

  22set26 — alineat amb el mestre Figma Navbar (12188:54178):
  - Logo: només la M. (el wordmark ja no hi és, tampoc a l'expandit);
    glif de 32 a mòbil i 20 de md amunt.
  - Marge lateral = page-margin (px-page), el mateix que la graella.
  - Mòbil: el Menú és un botó rodó de 48 amb la icona MenuIcon (barres, geometria de Phosphor List);
    de md amunt segueix la pastilla «Menú».
  - «Comencem?» Body/S - Medium a tauleta i Body/M - Medium a desktop.

  Decisions tècniques per màxima fluïdesa:
  - TOT sempre muntat. No AnimatePresence (evita mount/unmount jank).
  - Animacions només d'opacity + transform (GPU). Cap animació de width.
  - Histeresi al threshold (enter 100 / exit 50) → si l'usuari scrolla
    a la vora dels 100px, no flickeja entre estats.
  - Mobile: sempre compacte (no hi caben links inline).
  - EL BOTÓ MENU NO DEPÈN DE L'SCROLL PER SOTA DE lg (16set26): els links
    inline són `hidden lg:flex`, així que per sota d'aquest breakpoint el
    Menu és l'ÚNICA sortida de navegació. Lligar-lo a `isCompact` deixava
    mòbil i tauleta sense cap navegació a scroll 0. A lg+ es manté el patró
    Motto: apareix quan el header es compacta.

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
  - ALÇADA (15set26): 88 a mòbil i 96 de md amunt — la MATEIXA que la Navbar
    Bottom del hero, perquè el marc de dalt i el de baix pesin igual. Surt de
    py-6 (24×2) + el clúster dret (h-10 / md:h-12). Els 48 del clúster són la
    RESERVA del botó Menu de l'estat compacte: sense ells el header creixeria
    de cop en scroll. El token --header-h de globals.css mira aquests números
    i el hero l'usa per centrar-se; si canvien aquí, canvia'l allà.
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
// Entrada/sortida del header sencer per direcció d'scroll. Asimètric
// (15set26): la sortida va lenta perquè marxar sigui un gest suau i no una
// desaparició seca; el retorn va al doble de ràpid, coherent amb la
// tolerància asimètrica d'useScrollHide (costa amagar-lo, torna de seguida).
const HIDE_OUT_DURATION = 0.6;
const HIDE_IN_DURATION = 0.3;

export default function Header({
  onMenuClick,
  isMenuOpen = false,
}: {
  /** Rep l'esdeveniment: el menú neix del centre del botó que l'obre. */
  onMenuClick: (e: React.MouseEvent<HTMLElement>) => void;
  isMenuOpen?: boolean;
}) {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [hasMounted, setHasMounted] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const { hidden: isScrollHidden, show } = useScrollHide(COMPACT_ENTER);
  // Per sota de lg no hi ha links inline: el Menu hi ha de ser sempre.
  const isBelowLg = useMediaQuery(BELOW_LG_QUERY);
  // A lg+ el Menu és el relleu dels links inline quan es compacta; per sota
  // hi és sempre, perquè allà no hi ha cap més sortida de navegació.
  const showMenuButton = isCompact || isBelowLg;
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

  // Inicialitzem abans del primer scroll event i marquem el muntatge.
  //
  // La lectura de scrollY va dins d'un rAF i no al cos de l'efecte: un
  // setState sincrònic aquí força un segon render abans de pintar
  // (react-hooks/set-state-in-effect). No canvia el que es veu — useEffect ja
  // corre després del primer paint —, i en una recàrrega amb scroll restaurat
  // el header es compacta igualment dins del primer frame.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setIsCompact(window.scrollY > COMPACT_ENTER);
    });
    const t = setTimeout(() => setHasMounted(true), 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
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
          button: "!bg-text-fixed-light !text-text-fixed-dark",
        }
      : contrast === "dark"
      ? {
          link: "text-text-fixed-dark hover:text-text-fixed-dark/80",
          underline: "bg-text-fixed-dark",
          underlineHover: "bg-text-fixed-dark",
          button: "!bg-text-fixed-dark !text-text-fixed-light",
        }
      : {
          // Hover classic: secondary → main (negre en light theme, blanc en
          // dark theme). Substitueix el text-accent que era massa cridaner
          // sobre fons clars.
          link: "text-text-secondary hover:text-text-main",
          underline: "bg-text-secondary",
          underlineHover: "bg-text-main",
          button: "!bg-text-main !text-text-main-inverse",
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
        duration: hasMounted
          ? isVisible
            ? HIDE_IN_DURATION
            : HIDE_OUT_DURATION
          : 0.6,
        ease: ANIM_EASE,
      }}
      onFocusCapture={() => setHasFocusWithin(true)}
      onBlurCapture={() => setHasFocusWithin(false)}
      className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-page py-6 pointer-events-none"
    >
      {/*
        Esquerra: la M. sola a tots els breakpoints (Figma: 2025 / Logo Reduit;
        el wordmark queda amagat també a l'expandit, 22set26). El glif ocupa
        20 de la caixa 20×24 del SVG de LogoSmall: h-6 dona el glif de 20 de
        md amunt i h-[38.4px] el de 32 a mòbil.
      */}
      <div className={`${pe} flex items-center ${logoColor} transition-colors duration-300`}>
        <TransitionLink href="/" aria-label="Inici" className="hover:opacity-80 transition-opacity">
          <LogoSmall className="!h-[38.4px] md:!h-6 w-auto" />
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
        className="hidden lg:flex items-center gap-12 will-change-[opacity,transform]"
      >
        {inlineNavLinks.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <TransitionLink
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              className={`group relative text-body-m-medium pb-[2px] overflow-hidden transition-colors duration-300 ${c.link}`}
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
      <div className={`flex items-center gap-10 ${pe} h-10 md:h-12`}>
        <motion.div
          layout
          transition={{ duration: LAYOUT_SHIFT_DURATION, ease: ANIM_EASE }}
          className="will-change-transform"
        >
          {/* Ja no navega a /contacte: obre el modal de contacte (cortina). */}
          <button
            type="button"
            onClick={openContactModal}
            className={`group relative hidden md:inline-block text-body-s-medium lg:text-body-m-medium pb-[2px] overflow-hidden whitespace-nowrap transition-colors duration-300 cursor-pointer ${c.link}`}
          >
            Comencem?
            <span className={`absolute left-0 bottom-0 w-full h-[1.5px] origin-right transition-transform duration-300 ease-out group-hover:scale-x-0 ${c.underline}`} />
            <span className={`absolute left-0 bottom-0 w-full h-[1.5px] origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 delay-[0.1s] ${c.underlineHover}`} />
          </button>
        </motion.div>

        <AnimatePresence mode="popLayout" initial={false}>
          {showMenuButton && (
            <Button
              key="menu-btn"
              variant="solid"
              shape="pill"
              size="md"
              layout
              onClick={onMenuClick}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: LAYOUT_SHIFT_DURATION, ease: ANIM_EASE }}
              style={{ transformOrigin: "right center" }}
              /*
                Botó del DS (Figma: Buttons / Solid / Large amb modes MD + Pill).
                El color el sobreescriu `c.button` amb `!` perquè el contrast
                depèn del hero que hi ha a sota, no del tema.
                Text visible "Menú": WCAG 2.5.3 demana que el nom accessible
                ("Obrir Menú") contingui el text visible.
                Només de md amunt: a mòbil hi va el botó rodó de sota.
              */
              className={`max-md:hidden hover:scale-105 will-change-[opacity,transform] ${c.button}`}
              aria-label="Obrir Menú"
            >
              Menú
            </Button>
          )}
          {showMenuButton && (
            <Button
              key="menu-btn-mobile"
              variant="solid"
              shape="pill"
              size="icon"
              layout
              onClick={onMenuClick}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: LAYOUT_SHIFT_DURATION, ease: ANIM_EASE }}
              style={{ transformOrigin: "right center" }}
              /*
                Mòbil (22set26). Figma: Buttons / Solid / Square (LG + Pill) a
                48×48, radi Pill, icona de barres 32 (MenuIcon). Els 48 sobresurten 4 px per
                dalt i per baix del clúster h-10: el header es queda a 88 com
                al Figma i --header-h no canvia. Color: el mateix `c.button`
                que la pastilla, perquè segueixi el contrast del hero.
              */
              className={`md:hidden !size-12 hover:scale-105 will-change-[opacity,transform] ${c.button}`}
              aria-label="Obrir Menú"
              iconLeft={<MenuIcon open={false} />}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
