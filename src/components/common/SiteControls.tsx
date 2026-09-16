"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import LanguageSelector, {
  LANGUAGE_SELECTOR_ENABLED,
} from "@/components/common/LanguageSelector";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useFooterReveal } from "@/context/FooterRevealContext";
import { useHeroOwnsControls } from "@/context/HeroControlsContext";

/**
 * SiteControls — controls d'utilitat globals (idioma + tema).
 *
 * Fixos a baix a l'esquerra a TOTES les pàgines públiques (es renderitza des
 * de SiteShell, així que admin/auth en queden fora). Abans vivien dins del
 * Hero i només existien a la home: qualsevol entrada directa a una altra
 * pàgina no tenia manera de canviar idioma ni tema.
 *
 * - Tot i ser `fixed`, es comporten com a part de la barra inferior del hero:
 *   quan comença l'scroll fan una sortida lateral suau (lliscament cap a
 *   l'esquerra + fade + blur) i reapareixen en tornar a dalt. La sortida és
 *   lateral (no cap avall) per no creuar-se amb el contingut que puja en fer
 *   scroll. S'aplica a totes les pàgines públiques (muntat a SiteShell).
 * - Alineació vertical: `bottom-12` = el `pb-12` del SharedPageHero, és a dir
 *   la mateixa línia (48px) on el Figma posa el `Footer` del hero. L'alçada
 *   fixa de 52px que hi havia aquí era el residu d'una pastilla retirada i
 *   pujava el toggle 12px per sobre d'aquesta línia.
 * - Aquesta còpia FLOTANT és el pla B. Al Figma el botó de mode és fill del
 *   `Footer` del hero (mestre Section Hero 10670:2687), i quan un hero el pinta
 *   a la seva fila (<SiteControls inline />) aquesta es retira — veure
 *   HeroControlsContext. Cal perquè el hero acaba per sobre del fons del
 *   viewport (min-h-[calc(100vh-40px)]) i un element fix mai hi cau alineat.
 * - Fade-out quan el footer es revela (useFooterReveal), igual que el Header,
 *   per no flotar per sobre del bloc fosc.
 * - z-40: per sota del Header (z-50) i del menú full-screen (z-[100]) dins
 *   del stacking context de la cortina.
 * - EXCEPCIÓ a la home, a QUALSEVOL amplada: el hero d'allà té una barra
 *   pròpia de 96px que, per disseny (Figma 11325:8844 desktop, 11760:96251
 *   mòbil), ja porta tema i idioma a dins. Flotar-hi a sobre els duplicaria i,
 *   a més, `bottom-12` cau justament dins d'aquella barra. No s'hi perd res:
 *   aquests controls només es veuen a dalt de tot (a partir de 80px d'scroll
 *   fan la sortida lateral), exactament on la barra del hero és visible. A la
 *   resta de pàgines no canvia res.
 * - L'alineació horitzontal segueix el ritme de padding del SharedPageHero
 *   (px-6 / md:px-12 / lg:px-16 / xl:px-24) perquè quedin a la mateixa
 *   columna que el contingut del hero a totes les pàgines.
 */

/** Píxels d'scroll a partir dels quals els controls fan la sortida. */
const SCROLL_HIDE_THRESHOLD = 80;

export default function SiteControls({ inline = false }: { inline?: boolean } = {}) {
  const { revealed } = useFooterReveal();
  const heroOwnsControls = useHeroOwnsControls();
  const pathname = usePathname();
  // Veure la nota de la capçalera: a la home els controls viuen dins de la
  // barra del hero, no flotant.
  const heroIsHome = pathname === "/";

  // Sortida en scroll — histèresi lleugera per evitar parpelleig al llindar.
  const { scrollY } = useScroll();
  const [scrolledAway, setScrolledAway] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolledAway((prev) =>
      prev ? y > SCROLL_HIDE_THRESHOLD * 0.5 : y > SCROLL_HIDE_THRESHOLD
    );
  });

  // El delay de 0.9s només s'aplica a l'entrada inicial (acompanya el final
  // del títol del Hero a la home). Els canvis posteriors (footer reveal)
  // responen a l'instant.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setEntered(true), 1600);
    return () => clearTimeout(id);
  }, []);

  const hidden = revealed || scrolledAway;

  // Variant INLINE — va dins de la fila inferior del hero, en flux normal.
  // Sense motion propi: l'entrada la fa la fila del SharedPageHero i la
  // sortida, el scroll de la pàgina. No cal ni sortida lateral ni fade de
  // footer, que existeixen només perquè la còpia flotant és `fixed`.
  if (inline) {
    return (
      <div className="flex items-center gap-4">
        <LanguageSelector />
        <div className={LANGUAGE_SELECTOR_ENABLED ? "ml-2" : undefined}>
          <ThemeToggle />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={
        hidden
          ? { opacity: 0, x: -40, y: 0, scale: 0.96, filter: "blur(4px)" }
          : { opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }
      }
      transition={{
        duration: hidden ? 0.45 : 0.6,
        ease: [0.16, 1, 0.3, 1],
        delay: entered ? 0 : 0.9,
      }}
      className={`fixed bottom-12 left-6 md:left-12 lg:left-16 xl:left-24 z-40 items-center gap-4 ${
        heroIsHome || heroOwnsControls ? "hidden" : "flex"
      } ${hidden ? "pointer-events-none" : ""}`}
    >
      <LanguageSelector />
      {/* L'ml-2 només té sentit quan el selector d'idioma hi és; sense ell
          desplaçaria el tema respecte de la columna del hero. */}
      <div className={LANGUAGE_SELECTOR_ENABLED ? "ml-2" : undefined}>
        <ThemeToggle />
      </div>
    </motion.div>
  );
}
