"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useRef, useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLineUpRight } from "@phosphor-icons/react";
import MenuIcon from "@/components/common/MenuIcon";
import LogoSmall from "@/components/common/LogoSmall";
import Button from "@/components/ui/Button";
import { useContactModal } from "@/context/ContactModalContext";

/*
  <FullScreenMenu />
  ------------------
  Figma: Menu (12188:55011) · mestre Item Menu (12248:74947, Breakpoint × State).

  - Mòbil (< md): llista alineada a l'esquerra amb filet dashed (5/10) a
    dalt de cada fila,
    Display/S, fletxa a la dreta.
  - Tablet (md–lg) i desktop (lg+): llista centrada, número i fletxa penjats
    als costats de l'etiqueta (Display/L a tablet, Display/3XL a desktop),
    dins d'un scroll INFINIT (decisió de disseny, 22set26; tablet també des
    del mateix dia): la llista es repeteix i el scroll salta d'una còpia a
    l'altra sense que es noti.

  Color (22set26): cada enllaç té el seu token `nav/*`. Default en gris; el
  color surt al hover (només on hi ha cursor: `hover:` de Tailwind v4 ja va
  dins @media (hover:hover)) i a la pàgina actual, que a més porta un punt
  davant del número perquè no depengui només del color. Les xarxes queden en
  gris i només la fletxa porta el color de marca (`social/*`).
*/

type MenuLink = {
  label: string;
  href: string;
  /** Token de color de l'enllaç (nav/*) o de la fletxa (social/*). */
  color: string;
  isExternal?: boolean;
  /** Contacte no navega: obre la cortina de contacte. */
  isContact?: boolean;
};

const menuLinks: MenuLink[] = [
  { label: "Inici", href: "/", color: "var(--color-nav-inici)" },
  { label: "Treballs", href: "/works", color: "var(--color-nav-treballs)" },
  { label: "Serveis", href: "/serveis", color: "var(--color-nav-serveis)" },
  { label: "Col·laboració", href: "/colaboracio", color: "var(--color-nav-colaboracio)" },
  { label: "Qui soc", href: "/about", color: "var(--color-nav-qui-soc)" },
  { label: "Contacte", href: "/contacte", color: "var(--color-nav-contacte)", isContact: true },
  { label: "Behance", href: "https://www.behance.net/MariusComas", color: "var(--color-social-behance)", isExternal: true },
  { label: "Dribbble", href: "https://dribbble.com/mariuscomas", color: "var(--color-social-dribbble)", isExternal: true },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/mariuscomas/", color: "var(--color-social-linkedin)", isExternal: true },
];

/** Còpies de la llista al loop de desktop. La del mig és la real. */
const LOOP_COPIES = 5;
const LOOP_MIDDLE = Math.floor(LOOP_COPIES / 2);
/** Escala de la roda a les vores de la pantalla (el centre és 1). */
const WHEEL_MIN = 0.55;

/** Màscares de les franges d'esvaïment: opac al costat de la vora. */
const FADE_DOWN = "linear-gradient(to bottom, #000, transparent)";
const FADE_UP = "linear-gradient(to top, #000, transparent)";

/*
  Cercle d'obertura i tancament (22set26): neix i mor al centre del botó
  (List a l'obrir, X al tancar), no en un punt fix de la pantalla. El radi
  final és la distància a la cantonada més llunyana del viewport, perquè el
  cercle cobreixi just la pantalla i la corba no es malgasti fora.
*/
export type MenuCircle = { x: number; y: number; r: number };

export function circleFrom(el: Element): MenuCircle {
  const b = el.getBoundingClientRect();
  const x = b.left + b.width / 2;
  const y = b.top + b.height / 2;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const r = Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
  return { x, y, r };
}

/** Si no hi ha botó (p. ex. obert per codi): cantonada superior dreta. */
function fallbackCircle(): MenuCircle {
  if (typeof window === "undefined") return { x: 0, y: 0, r: 0 };
  const w = window.innerWidth;
  const h = window.innerHeight;
  return { x: w - 48, y: 48, r: Math.hypot(w, h) };
}

const circleVariants = {
  closed: (c: MenuCircle) => ({ clipPath: `circle(0px at ${c.x}px ${c.y}px)` }),
  open: (c: MenuCircle) => ({ clipPath: `circle(${c.r}px at ${c.x}px ${c.y}px)` }),
};

const isActiveLink = (link: MenuLink, pathname: string) =>
  !link.isExternal && !link.isContact && pathname === link.href;

/* Color de text segons l'estat. Les xarxes no s'hi apunten: queden en gris. */
function labelColor(link: MenuLink, active: boolean) {
  if (link.isExternal) return "text-text-secondary";
  return active
    ? "text-[var(--link-color)]"
    : "text-text-secondary group-hover:text-[var(--link-color)] group-focus-visible:text-[var(--link-color)]";
}

type Layout = "mobile" | "centered";

function ItemInner({
  link,
  index,
  active,
  layout,
  labelClass,
  arrowSize,
  arrowClass = "",
}: {
  link: MenuLink;
  index: number;
  active: boolean;
  layout: Layout;
  labelClass: string;
  arrowSize: number;
  /** Classes de mida responsive de la fletxa (sobreescriuen arrowSize). */
  arrowClass?: string;
}) {
  const number = String(index + 1).padStart(2, "0");
  const color = labelColor(link, active);
  // Punt de la pàgina actual: 8 px, 8 px abans del número.
  const dot = active ? (
    <span aria-hidden className="absolute right-full top-1/2 mr-2 size-2 -translate-y-1/2 rounded-full bg-[var(--link-color)]" />
  ) : null;
  const arrow = link.isExternal ? (
    <ArrowLineUpRight aria-hidden size={arrowSize} weight="regular" className={`shrink-0 text-[var(--link-color)] ${arrowClass}`} />
  ) : null;

  if (layout === "mobile") {
    return (
      <span className="flex w-full items-center gap-4">
        <span className={`relative text-caption transition-colors duration-300 ${color}`}>
          {dot}
          {number}
        </span>
        <span className={`flex-1 ${labelClass} transition-colors duration-300 ${color}`}>{link.label}</span>
        {arrow}
      </span>
    );
  }

  // Centrat (tablet i desktop): número i fletxa penjats a 10 px de l'etiqueta
  // perquè l'etiqueta quedi centrada sola, com al Figma.
  return (
    // data-wheel: el loop escala aquest bloc segons la distància al centre
    // (roda). El número i la fletxa es contraescalen amb --wheel-inv perquè
    // mantinguin la mida i segueixin enganxats a la vora de l'etiqueta.
    <span data-wheel className="relative inline-flex origin-center items-center">
      <span className={`absolute right-full mr-2.5 origin-right text-caption transition-colors duration-300 [scale:var(--wheel-inv,1)] ${color}`}>
        {dot}
        {number}
      </span>
      <span className={`${labelClass} transition-colors duration-300 ${color}`}>{link.label}</span>
      {arrow && <span className="absolute left-full ml-2.5 flex origin-left [scale:var(--wheel-inv,1)]">{arrow}</span>}
    </span>
  );
}

export default function FullScreenMenu({
  isOpen,
  onClose: onCloseProp,
  openCircle,
}: {
  isOpen: boolean;
  onClose: () => void;
  openCircle?: MenuCircle | null;
}) {
  const pathname = usePathname();
  const { open: openContactModal } = useContactModal();
  const prefersReducedMotion = useReducedMotion();
  const loop = !prefersReducedMotion;

  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRefs = useRef<(HTMLElement | null)[]>([]);

  /*
    Tancament: el cercle es replega cap a la X visible (la de mòbil o la de
    md+). Va per `custom` d'AnimatePresence perquè l'element que surt ja no
    rep props noves i així sí que li arriba el centre actualitzat.
  */
  const [closeCircle, setCloseCircle] = useState<MenuCircle | null>(null);
  const onClose = () => {
    const btn = closeRefs.current.find((b) => b && b.offsetWidth > 0);
    setCloseCircle(btn ? circleFrom(btn) : null);
    onCloseProp();
  };
  const circle = (isOpen ? openCircle : (closeCircle ?? openCircle)) ?? fallbackCircle();

  /*
    Navegació des del menú (22set26): el menú fa de cortina. En clicar, el
    menú es queda obert, es navega de seguida i, quan la ruta destí ja s'ha
    muntat (canvia el pathname), el cercle es replega i destapa la pàgina
    nova. Abans es tancava en clicar i deixava veure la pàgina actual durant
    el replegament. No passa per la cortina de colors de les transicions:
    duplicaria la que ja fa el cercle.
  */
  const router = useRouter();
  const pendingHref = useRef<string | null>(null);
  const navigate = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Cmd/Ctrl/Maj/clic del mig: el navegador obre pestanya nova, no toquem res.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (href === pathname) {
      onClose();
      return;
    }
    pendingHref.current = href;
    router.push(href);
  };
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });
  useEffect(() => {
    if (pendingHref.current && pathname === pendingHref.current) {
      pendingHref.current = null;
      onCloseRef.current();
    }
  }, [pathname]);
  const setRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleContactClick = () => {
    onClose();
    openContactModal();
  };

  const renderItem = (
    link: MenuLink,
    i: number,
    opts: { layout: Layout; labelClass: string; arrowSize: number; arrowClass?: string; rowClass: string; focusable: boolean },
  ) => {
    const active = isActiveLink(link, pathname);
    const inner = (
      <ItemInner link={link} index={i} active={active} layout={opts.layout} labelClass={opts.labelClass} arrowSize={opts.arrowSize} arrowClass={opts.arrowClass} />
    );
    const common = {
      style: { "--link-color": link.color } as React.CSSProperties,
      className: `group block w-full outline-none ${opts.rowClass}`,
      tabIndex: opts.focusable ? undefined : -1,
    };
    if (link.isContact) {
      return (
        <button type="button" onClick={handleContactClick} {...common} className={`${common.className} cursor-pointer text-left`}>
          {inner}
        </button>
      );
    }
    if (link.isExternal) {
      return (
        <a href={link.href} target="_blank" rel="noopener noreferrer" {...common}>
          {inner}
          <span className="sr-only"> (s&apos;obre en una pestanya nova)</span>
        </a>
      );
    }
    return (
      <Link href={link.href} onClick={navigate(link.href)} aria-current={active ? "page" : undefined} {...common}>
        {inner}
      </Link>
    );
  };

  /*
    Loop de desktop. L'alçada d'UNA còpia es mesura com la distància entre
    l'inici de dues còpies consecutives, no com scrollHeight / N: el padding
    del contenidor no entra al compte i el salt no es desplaça.
  */
  useLayoutEffect(() => {
    if (!isOpen || !loop) return;
    const container = scrollRef.current;
    const a = setRefs.current[LOOP_MIDDLE];
    const b = setRefs.current[LOOP_MIDDLE + 1];
    if (!container || !a || !b) return;
    // «Inici» de la còpia real, centrat a la pantalla: és on la roda el fa
    // gran (22set26). offsetTop no depèn del transform de l'entrada.
    const first = a.querySelector<HTMLElement>("li");
    if (!first) return;
    container.scrollTop = first.offsetTop + first.offsetHeight / 2 - container.clientHeight / 2;
  }, [isOpen, loop]);

  useEffect(() => {
    if (!isOpen || !loop) return;
    const container = scrollRef.current;
    if (!container) return;
    const handleScroll = () => {
      const first = setRefs.current[0];
      const second = setRefs.current[1];
      if (!first || !second) return;
      const setHeight = second.offsetTop - first.offsetTop;
      const { scrollTop, clientHeight, scrollHeight } = container;
      if (scrollTop < setHeight) {
        container.scrollTop = scrollTop + setHeight * 2;
      } else if (scrollTop + clientHeight > scrollHeight - setHeight) {
        container.scrollTop = scrollTop - setHeight * 2;
      }
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [isOpen, loop]);

  /*
    Roda (22set26, prototip): l'ítem del centre de la pantalla es queda a la
    mida del seu estil i els altres s'encongeixen cap als extrems, fins al
    WHEEL_MIN a la vora. Corba quadràtica: es manté gran a prop del centre i
    cau més de pressa a les vores. Només transform (sense reflow), recalculat
    en un rAF per scroll i resize. La mida surt de la posició a la pantalla,
    així que el salt entre còpies del loop no es nota.
  */
  useEffect(() => {
    if (!isOpen || !loop) return;
    const container = scrollRef.current;
    if (!container) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const box = container.getBoundingClientRect();
      if (box.height === 0) return; // amagat (mòbil)
      const center = box.top + box.height / 2;
      const half = box.height / 2;
      container.querySelectorAll<HTMLElement>("[data-wheel]").forEach((el) => {
        const r = el.getBoundingClientRect();
        // Fora de pantalla: no cal tocar-lo.
        if (r.bottom < box.top - half || r.top > box.bottom + half) return;
        const d = Math.min(1, Math.abs(r.top + r.height / 2 - center) / half);
        const scale = 1 - (1 - WHEEL_MIN) * d * d;
        el.style.transform = `scale(${scale})`;
        el.style.setProperty("--wheel-inv", String(1 / scale));
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    schedule();
    container.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [isOpen, loop]);

  /*
    Entrada escalonada: cada fila puja 30 px i apareix, 50 ms després de
    l'anterior, quan el cercle d'obertura ja és a mig camí (0,3 s). A
    desktop totes les còpies fan el mateix recorregut per índex, així la
    fila que treu el cap per sota entra alhora que la seva germana.
    Amb prefers-reduced-motion, res.
  */
  const enter = (i: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 30 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay: 0.3 + i * 0.05, ease: [0.16, 1, 0.3, 1] as const },
        };

  /*
    Entrada de mòbil (22set26, patró Motto): cada fila puja des de sota dins
    d'una màscara (overflow-hidden) i el seu filet es dibuixa d'esquerra a
    dreta, tots dos amb 1,25 s d'ease expo i 75 ms d'esglaó. El filet es
    revela amb clip-path i no amb scaleX perquè és dashed: escalar-lo
    estiraria els guions mentre dura l'animació. Sense animació de sortida
    per ítem: el cercle ja tanca el menú sencer.
  */
  const mobileEase = [0.16, 1, 0.3, 1] as const;
  const mobileTiming = (i: number) => ({ duration: 1.25, delay: 0.3 + i * 0.075, ease: mobileEase });
  const mobileRise = (i: number) =>
    prefersReducedMotion
      ? {}
      : { initial: { y: "100%" }, animate: { y: "0%" }, transition: mobileTiming(i) };
  const mobileRule = (i: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { clipPath: "inset(0 100% 0 0)" },
          animate: { clipPath: "inset(0 0% 0 0)" },
          transition: mobileTiming(i),
        };

  const copies = loop ? LOOP_COPIES : 1;
  const realCopy = loop ? LOOP_MIDDLE : 0;

  return (
    <AnimatePresence custom={circle}>
      {isOpen && (
        <motion.div
          custom={circle}
          variants={circleVariants}
          initial="closed"
          animate="open"
          exit="closed"
          transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="dark fixed inset-0 z-[100] h-[100dvh] w-full overflow-hidden bg-surface-base text-text-main"
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
        >
          {/*
            Barra superior: la mateixa geometria que el Header.
            - Mòbil i tablet: fons surface-base al 90% amb desenfocament, perquè
              la llista hi passa per sota del botó. A tablet, filet sòlid a
              baix (a mòbil no: la primera fila ja porta el seu filet dashed). Figma: Navbar Top ·
              Menu=True, Background 90% + background blur 10 (el radi de Figma
              equival a blur(5px) a CSS).
            - Desktop: sense fons. El loop s'esvaeix a dalt i a baix amb les
              dues franges de sota (22set26).
          */}
          {loop && (
            <>
              {/*
                Franges d'esvaïment del loop (lg+). Fons al 90% + desenfocament,
                retallats amb una màscara lineal: així s'esvaeixen tots dos, el
                color i el blur. Un backdrop-filter sense màscara deixaria un
                límit dur on acaba la franja. Figma: Background de Navbar Top
                (Desktop · Menu=True) i de Navbar Bottom, degradat 100→0 al 90%.
              */}
              <div
                aria-hidden
                className="pointer-events-none fixed inset-x-0 top-0 z-[105] hidden h-24 bg-surface-base/90 backdrop-blur-[5px] lg:block"
                style={{ maskImage: FADE_DOWN, WebkitMaskImage: FADE_DOWN }}
              />
              <div
                aria-hidden
                className="pointer-events-none fixed inset-x-0 bottom-0 z-[105] hidden h-24 bg-surface-base/90 backdrop-blur-[5px] lg:block"
                style={{ maskImage: FADE_UP, WebkitMaskImage: FADE_UP }}
              />
            </>
          )}
          <div
            className={`pointer-events-none fixed top-0 z-[110] flex w-full items-center justify-between bg-surface-base/90 px-page py-6 backdrop-blur-[5px] md:max-lg:border-b md:max-lg:border-border-subtle ${loop ? "lg:bg-transparent lg:backdrop-blur-none" : ""}`}
          >
            <Link href="/" onClick={navigate("/")} aria-label="Inici" className="pointer-events-auto text-text-main transition-opacity hover:opacity-80">
              <LogoSmall className="!h-[38.4px] w-auto md:!h-6" />
            </Link>
            <div className="pointer-events-auto flex h-10 items-center md:h-12">
              {/* Figma: Buttons / Solid / Large (MD + Pill) a md+; Solid / Square LG + Pill a mòbil. */}
              <Button
                ref={(el: HTMLElement | null) => {
                  closeRefs.current[0] = el;
                }}
                variant="solid"
                shape="pill"
                size="md"
                onClick={onClose}
                className="max-md:hidden"
              >
                Tancar
              </Button>
              <Button
                ref={(el: HTMLElement | null) => {
                  closeRefs.current[1] = el;
                }}
                variant="solid"
                shape="pill"
                size="icon"
                onClick={onClose}
                className="!size-12 md:hidden"
                aria-label="Tancar"
                // Morph barres → X mentre el cercle s'obre, i al revés en tancar.
                iconLeft={<MenuIcon />}
              />
            </div>
          </div>

          {/* MÒBIL (< md) */}
          <nav aria-label="Menú" className="h-full overflow-y-auto overscroll-none pt-[var(--header-h)] pb-[max(2rem,env(safe-area-inset-bottom))] md:hidden">
            <ul>
              {menuLinks.map((link, i) => (
                <li key={link.label} className="relative">
                  <motion.span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 border-t dash-h-border-subtle" {...mobileRule(i)} />
                  <span className="block overflow-hidden">
                    <motion.span className="block" {...mobileRise(i)}>
                      {renderItem(link, i, {
                        layout: "mobile",
                        labelClass: "text-display-s",
                        arrowSize: 32,
                        rowClass: "px-page py-5",
                        focusable: true,
                      })}
                    </motion.span>
                  </span>
                </li>
              ))}
            </ul>
          </nav>

          {/*
            TABLET I DESKTOP (md+): scroll infinit (tablet des del 22set26).
            Tablet: Display/L i fletxa de 40, amb la barra superior i la fila
            inferior sòlides al 90% i els seus filets. Desktop: Display/3XL i
            fletxa de 48, sense barres, amb les franges d'esvaïment.
          */}
          <div
            ref={scrollRef}
            className={`scrollbar-hide hidden h-full overflow-y-auto overscroll-none md:block ${loop ? "" : "pt-[var(--header-h)] pb-24"}`}
          >
            {Array.from({ length: copies }, (_, c) => {
              const isReal = c === realCopy;
              return (
                <div
                  key={c}
                  ref={(el) => {
                    setRefs.current[c] = el;
                  }}
                  // Les còpies són decoració: fora del lector de pantalla i del Tab.
                  aria-hidden={isReal ? undefined : true}
                  inert={isReal ? undefined : true}
                >
                  <nav aria-label={isReal ? "Menú" : undefined}>
                    <ul className="flex flex-col items-center">
                      {menuLinks.map((link, i) => (
                        <motion.li key={link.label} {...enter(i)}>
                          {renderItem(link, i, {
                            layout: "centered",
                            labelClass: "text-display-l lg:text-display-3xl",
                            arrowSize: 40,
                            arrowClass: "lg:size-12",
                            rowClass: "px-6 py-5 text-center",
                            focusable: isReal,
                          })}
                        </motion.li>
                      ))}
                    </ul>
                  </nav>
                </div>
              );
            })}
          </div>

          {/*
            Fila inferior (md+). Figma: Navbar Bottom, Caption/Default.
            A tablet, filet sòlid a dalt (i la barra superior, a baix): hi ha
            tres zones (barra, llista, peu) i entre zones el filet és sòlid.
            A desktop no n'hi ha: el loop s'esvaeix amb les franges.
          */}
          <div className="pointer-events-none fixed bottom-0 z-[110] hidden h-24 w-full items-center justify-between px-page text-caption text-text-secondary md:flex md:max-lg:border-t md:max-lg:border-border-subtle md:max-lg:bg-surface-base/90 md:max-lg:backdrop-blur-[5px]">
            <span>Empordà / 2026</span>
            <span>mariusfreelance.com</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
