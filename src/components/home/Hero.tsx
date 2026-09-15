"use client";

import { Fragment, useEffect, useState } from "react";
import { ArrowDown, DribbbleLogo, LinkedinLogo, BehanceLogo } from "@phosphor-icons/react";
import { onIntroRevealed } from "@/lib/introSignal";
import HeroTitle from "@/components/home/HeroTitle";
import HeroField from "@/components/home/HeroField";
import LanguageSelector from "@/components/common/LanguageSelector";
import ThemeToggle from "@/components/common/ThemeToggle";

/**
 * Hero — secció d'entrada de la home.
 *
 * MARGES — graella de disposició del DS (docs/graella-disposicio-2026-09-14.md,
 * estils Figma Graella/1…5): 24 · 48 · 72 · 96 · 144 segons breakpoint. El
 * contingut i la barra inferior comparteixen la MATEIXA escala; abans la barra
 * anava a 32 al mòbil i totes dues saltaven de 48 a 96 de cop a lg.
 *
 * Substitueix l'escena cercle→franja de vídeo (ShowcaseVideo) mentre el
 * showreel no està produït. El que ocupava el cercle ara és [[HeroField]]:
 * una retícula que reacciona al punter amb LA MATEIXA física que el lockup,
 * de manera que titular i superfície són un sol sistema i no dos efectes.
 *
 * BARRA INFERIOR — Figma "Navbar Bottom" (desktop 11325:8844, mòbil
 * 11760:96251). Fins ara n'hi havia DUES d'excloents perquè el desktop era una
 * cosa distinta (sense línia superior, sense controls, alineada a la dreta) i
 * el mòbil una altra. La proposta de desktop les fa convergir: 96px d'alçada,
 * línia a dalt I a baix, controls (tema + idioma) a l'esquerra i xarxes a la
 * dreta, a totes dues mides. Per això aquí n'hi ha UNA de sola; l'única
 * diferència real és la llista de disciplines, que per sota de md no hi cap i
 * es tallava.
 *
 * Com que la barra ja porta tema + idioma a QUALSEVOL amplada, els
 * SiteControls flotants es repleguen a la home sencera (abans només per sota
 * de md) — veure la nota a SiteControls.
 *
 * MÒBIL (< 768px) — Figma "Section Hero" mobile (node 11325:9090). La versió
 * mòbil NO és la de desktop encongida: el camp deixa de ser una capa absoluta
 * i passa a ser una franja de 200px del flux, entre el contingut i la barra.
 */

const SOCIALS = [
  { Icon: DribbbleLogo, label: "Dribbble", href: "https://dribbble.com/mariuscomas" },
  { Icon: LinkedinLogo, label: "LinkedIn", href: "https://www.linkedin.com/in/mariuscomas/" },
  { Icon: BehanceLogo, label: "Behance", href: "https://www.behance.net/MariusComas" },
];

/** Figma desktop (11325:8844) — noms complets, cada un un ítem amb "·" al mig. */
const DISCIPLINES = [
  "Product Design",
  "Branding & Identity Design",
  "Mobile App Design",
  "UI/UX Design Audit",
  "Website Design",
  "Landing Page Design",
];

/**
 * La llista completa fa ~970px en una línia i la barra no li'n pot cedir tants
 * fins a 2xl (1536px) — mesurat, no estimat. Per sota s'ensenya aquesta, que
 * és el mateix contingut resumit i cap de sobres.
 */
const DISCIPLINES_SHORT = ["Product Design", "UI/UX", "Front-end"];

/**
 * Llista de disciplines de la barra — Body/SM, separadors "·" com a ítems
 * propis (Figma: flex amb gap 12, no una cadena amb espais).
 *
 * El `display` NO va aquí sinó a `className`: `flex` i `hidden` són totes dues
 * utilities i qui guanya depèn de l'ordre del full generat, no de l'ordre de
 * l'atribut. Deixant-lo fora, cada instància diu `hidden lg:flex` sense ambigüitat.
 */
function DisciplineRow({ items, className }: { items: string[]; className: string }) {
  return (
    <p
      className={`flex-1 flex-wrap items-center justify-end gap-3 text-body-sm text-text-secondary ${className}`}
    >
      {items.map((item, i) => (
        <Fragment key={item}>
          {i > 0 && <span aria-hidden>·</span>}
          <span>{item}</span>
        </Fragment>
      ))}
    </p>
  );
}

export default function Hero({
  introPending = false,
}: {
  /** True quan l'IntroLoader es reproduirà: l'entrada espera el seu reveal. */
  introPending?: boolean;
}) {
  // Entrada sincronitzada amb el reveal de l'intro. Sense intro (sessió
  // repetida, altres contextos), entra directament des del SSR com sempre.
  const [entered, setEntered] = useState(!introPending);
  useEffect(() => {
    if (entered) return;
    return onIntroRevealed(() => setEntered(true));
  }, [entered]);

  return (
    <section className="relative z-10 flex h-[100dvh] w-full flex-col overflow-hidden bg-surface-base">
      {/* Camp reactiu — Figma col·loca el "Col" a la meitat dreta EXACTA del
          frame (x 864 de 1728) i li dona tota l'alçada del contingut: de dalt
          de tot fins a la línia superior de la barra. D'aquí `w-1/2` (i no una
          amplada fixa, que a 1920 deixava un buit a la dreta) i `bottom-24`
          (= els 96px de la barra). */}
      <HeroField
        className="pointer-events-none absolute right-0 top-0 bottom-24 hidden w-1/2 lg:block"
        gap={32}
        dot={3}
        magnet={30}
        radius={170}
        fade={{ left: 210, right: 0, top: 150, bottom: 150 }}
      />
      {/* pt-[var(--header-h)] — el Header és `fixed` i transparent, així que no
          descompta res del flux: sense aquest padding, `justify-center` centra
          el bloc a (100dvh − barra) i el titular queda MIG HEADER massa amunt
          (mesurat: 52px d'aire a dalt contra 161 a baix a ≥1280). Amb el
          padding, el bloc queda centrat entre el filet inferior del navbar i el
          superior de la barra, que és el que marca el Figma (Section · Hero
          11325:8842, Content amb padding-top = alçada del navbar). */}
      <div
        className={`relative z-10 flex flex-1 flex-col items-start justify-center pt-[var(--header-h)] px-6 md:px-12 lg:px-18 xl:px-24 3xl:px-36 ${
          entered ? "hero-enter" : "hero-enter-wait"
        }`}
      >
        <div className="w-full max-w-[744px]">
          {/* Lockup interactiu (magnètic + aberració) — veure HeroTitle.tsx */}
          <HeroTitle />

          {/*
            El desktop de Figma lliga el paràgraf a Body/XL (32/48) i en text
            /main, no a Body/LG en secundari: és la frase que sosté el lockup,
            no un peu. `font-normal` perquè el token del DS surt en Light (300)
            i el Figma el marca Regular (400) — divergència del DS que NO toco
            aquí per no arrossegar-la a tots els Body/XL del site.

            El `max-md:` porta els valors del Figma mòbil (18/27) allà on no
            són el token responsiu: al Figma aquest text no està lligat a
            body/* sinó escrit a mà, i el token (16/22 a 375px) es queda curt
            per a un hero.

            Nota tècnica: .text-body-* viuen a @layer components, i a Tailwind
            v4 les variants (md:) només s'apliquen a utilities. Per això
            l'override va en sentit invers (base = token, max-md = Figma) i no
            amb md:text-body-xl, que no generaria res.

            El paràgraf és clamp() i no 18px clavats: el Figma dibuixa a 402px,
            on la primera frase cap just en una línia; a 375px (iPhone SE/13
            mini) 18px la parteixen i el <br/> deixa un bloc de tres línies
            desigual. El clamp toca els 18px del disseny a 400px i cedeix uns
            píxels per sota per mantenir les dues línies previstes.

            Sense `max-w`: a 32px la primera frase fa uns 610px i els 520px
            d'abans la partien just on el <br/> ja preveu el salt. La columna
            del contingut (744px) ja fa de límit i deixa lliure la meitat dreta
            on viu el camp.

            Separacions: el Figma apila títol, paràgraf i link amb un gap únic
            de 48px (mt-12), no amb dos valors diferents.
          */}
          <p className="mt-6 text-body-xl font-normal text-text-main max-md:text-[clamp(1rem,4.5vw,1.125rem)] max-md:leading-[27px] md:mt-12">
            Dissenyo i construeixo productes digitals.
            <br />
            Un sol interlocutor, de principi a fi.
          </p>

          {/* Buttons/Link (24/28) — el mateix token a totes les amplades, que
              és com el defineix el Figma. El subratllat cau 6px sota la caixa
              de text (Figma: Border a bottom -6) i la fletxa fa 20px amb 10px
              de separació. */}
          <a
            href="#treballs"
            className="mt-6 inline-flex min-h-11 items-center gap-2.5 text-button-link text-text-main md:mt-12"
          >
            <span className="border-b border-text-main pb-1.5">Veure treballs</span>
            <ArrowDown size={20} weight="regular" aria-hidden />
          </a>
        </div>
      </div>

      {/* Sota lg el camp és una FRANJA DEL FLUX entre el contingut i la barra,
          no una capa absoluta: així no cal endevinar cap offset quan canvia
          l'alçada del viewport (barra d'adreces del navegador). El tablet feia
          banda absoluta a dalt (`top-24`, 220px) i s'ha alineat amb el Figma
          (Section Hero tablet 10756:7440, Camp de 260 sota el Content) i amb
          el mòbil: un sol patró per a tot el que no és desktop. Són dues
          instàncies i no una perquè gap/dot/radius són props de JS i no poden
          commutar per breakpoint. */}
      <HeroField
        className="pointer-events-none relative block h-[200px] w-full shrink-0 md:hidden"
        gap={20}
        dot={2.5}
        magnet={18}
        radius={120}
        fade={{ left: 70, right: 70, top: 70, bottom: 70 }}
      />
      <HeroField
        className="pointer-events-none relative hidden h-[260px] w-full shrink-0 md:block lg:hidden"
        gap={26}
        dot={2.75}
        magnet={24}
        radius={140}
        fade={{ left: 70, right: 70, top: 70, bottom: 70 }}
      />

      {/* Barra inferior — Figma "Navbar Bottom" (desktop 11325:8844, mòbil
          11760:96251): 96px, línia a dalt i a baix, controls a l'esquerra i
          xarxes a la dreta. Una de sola per a totes les amplades; el que canvia
          és la llista de disciplines, que per sota de md es tallava.

          Les xarxes van amb `ml-auto` perquè a mòbil, sense la llista pel mig,
          res no empeny cap a la dreta. Amb la llista visible (`flex-1`) l'auto
          ja no té espai a repartir i no fa res. */}
      <div className="relative z-10 flex h-24 w-full shrink-0 items-center gap-6 border-y border-border-subtle md:gap-8 3xl:gap-12 px-6 md:px-12 lg:px-18 xl:px-24 3xl:px-36">
        <ThemeToggle />
        <LanguageSelector variant="bare" />
        <DisciplineRow items={DISCIPLINES} className="hidden 2xl:flex" />
        <DisciplineRow items={DISCIPLINES_SHORT} className="hidden md:flex 2xl:hidden" />
        <ul className="ml-auto flex items-center gap-6">
          {SOCIALS.map(({ Icon, label, href }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                /* -m-1.5/p-1.5: l'àrea tàctil arriba a 44px sense moure els
                   32px visibles ni les separacions de 24 del Figma. */
                className="-m-1.5 block p-1.5 text-text-main transition-opacity hover:opacity-60"
              >
                <Icon size={32} weight="regular" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </div>

    </section>
  );
}
