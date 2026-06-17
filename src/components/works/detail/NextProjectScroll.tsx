"use client";

import { useRef, useState, useEffect } from "react";
import { WorkNextProject } from "@/types/works";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  nextProject: WorkNextProject;
}

// Temps que l'usuari ha de mantenir-se al final abans de redirigir al següent projecte.
// Inspirat en wearemotto.com: després d'arribar al fons cal un petit "dwell" perquè la
// transició no sembli un salt automàtic.
const DWELL_DURATION_MS = 2200;

// Llindar de scrollYProgress a partir del qual comença a comptar el temps d'espera.
// 0.995 vol dir "pràcticament al final" (deixem un petit marge per evitar falsos positius
// en navegadors amb scroll inercial).
const DWELL_TRIGGER = 0.995;

// El scroll omple la barra fins a aquest %; la resta es completa durant el dwell.
const SCROLL_FILL_RATIO = 0.7;

export default function NextProjectScroll({ nextProject }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

  // La barra de progrés anirà omplint-se a mesura que l'usuari baixa i el component entra en pantalla.
  // Quan el final del component toqui el final de la pantalla (és a dir, s'ha vist tot), valdrà 1.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"],
  });

  // Suavitzem el progrés de scroll perquè la barra no faci salts amb la inèrcia del trackpad.
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    mass: 0.2,
  });

  // Progrés del temporitzador d'espera (0 -> 1) que s'activa quan ja som al fons.
  const dwellProgress = useMotionValue(0);
  const dwellStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Composició final de la barra: el scroll omple el primer tram, el dwell completa la resta.
  const scrollPortion = useTransform(smoothScroll, (v) =>
    Math.min(SCROLL_FILL_RATIO, Math.max(0, v) * SCROLL_FILL_RATIO)
  );
  const dwellPortion = useTransform(dwellProgress, (v) => v * (1 - SCROLL_FILL_RATIO));
  const progressBarWidth = useTransform(
    [scrollPortion, dwellPortion],
    ([a, b]: number[]) => `${(a + b) * 100}%`
  );

  const cancelDwell = () => {
    dwellStartRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    rafRef.current = null;
    navTimerRef.current = null;
    dwellProgress.set(0);
  };

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (navigating) return;

    if (latest >= DWELL_TRIGGER) {
      // Si ja estem comptant, no reiniciem.
      if (dwellStartRef.current !== null) return;

      dwellStartRef.current = performance.now();

      const tick = (now: number) => {
        if (dwellStartRef.current === null) return;
        const elapsed = now - dwellStartRef.current;
        const t = Math.min(1, elapsed / DWELL_DURATION_MS);
        dwellProgress.set(t);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);

      navTimerRef.current = setTimeout(() => {
        setNavigating(true);
        router.push(`/works/${nextProject.slug}`);
      }, DWELL_DURATION_MS);
    } else {
      // L'usuari ha tornat enrere: cancel·lem el countdown i resetem el dwell.
      if (dwellStartRef.current !== null) cancelDwell();
    }
  });

  useEffect(() => {
    return () => cancelDwell();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mata el "rubber-band" (rebot) del navegador mentre estem en aquesta vista.
  // Així, en arribar al final amb inèrcia del trackpad, la pàgina no fa el botet típic
  // que feia que la barra de progrés tremolés i semblés que tot saltava.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overscrollBehaviorY;
    const prevBody = body.style.overscrollBehaviorY;
    html.style.overscrollBehaviorY = "none";
    body.style.overscrollBehaviorY = "none";
    return () => {
      html.style.overscrollBehaviorY = prevHtml;
      body.style.overscrollBehaviorY = prevBody;
    };
  }, []);

  return (
    <section 
      ref={containerRef} 
      className="relative w-full bg-surface-base pt-16 md:pt-32 pb-16 md:pb-32 flex flex-col justify-center overflow-hidden border-t border-text-main/10"
    >
      <div className="w-full">
        {/* Top Content: Grid for layout (Text a l'esquerra, Progress bar a la dreta) */}
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 md:px-12 lg:px-24 mb-16 md:mb-24">
          
          <h2 className="text-xl md:text-3xl text-text-main font-sans font-light leading-snug w-full md:w-1/2">
            Continua desplaçant-te per <br className="hidden md:block" /> veure el següent cas pràctic.
          </h2>
          
          <div className="w-full md:w-1/3 flex justify-end mt-8 md:mt-0 opacity-80">
            <div className="w-full h-[2px] bg-text-main/10 relative rounded-full overflow-hidden max-w-sm">
              <motion.div 
                style={{ width: progressBarWidth }}
                className="absolute top-0 left-0 h-full bg-text-main origin-left"
              />
            </div>
          </div>

        </div>

        {/* Marquee Next Project Title */}
        <Link 
          href={`/works/${nextProject.slug}`} 
          className="relative block left-1/2 right-1/2 ml-[-50vw] mr-[-50vw] w-screen overflow-hidden group cursor-pointer"
        >
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: 40,
            }}
            className="text-display-h1 font-heading uppercase flex items-center gap-8 lg:gap-8 w-max px-6 md:px-12 lg:px-24 shrink-0 py-2 transform-gpu will-change-transform group-hover:text-text-secondary transition-colors"
          >
            {/* Set 1 */}
            <span className="text-text-main">{nextProject.title}</span>
            <span className="text-transparent [-webkit-text-stroke:2px_var(--color-text-main)]">{nextProject.title}</span>
            <span className="text-transparent [-webkit-text-stroke:2px_var(--color-text-main)]">{nextProject.title}</span>

            {/* Set 2 (for seamless loop) */}
            <span className="text-text-main">{nextProject.title}</span>
            <span className="text-transparent [-webkit-text-stroke:2px_var(--color-text-main)]">{nextProject.title}</span>
            <span className="text-transparent [-webkit-text-stroke:2px_var(--color-text-main)]">{nextProject.title}</span>
          </motion.div>
        </Link>
      </div>
    </section>
  );
}
