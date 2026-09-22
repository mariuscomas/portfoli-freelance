"use client";

import { useEffect, useRef } from "react";

/**
 * HeroField — retícula de punts que reacciona al punter amb LA MATEIXA física
 * que el lockup de [[HeroTitle]]: desplaçament radial cap enfora dins d'un
 * radi, escala i aberració cromàtica coral/teal. No és un efecte decoratiu al
 * costat del titular; és el mateix sistema aplicat a una superfície.
 *
 * Substitueix el cercle de vídeo mentre el showreel no està produït.
 *
 * Decisions que val la pena no desfer:
 *  - Les marques són <div> absoluts amb `transform`, no <canvas>: es poden
 *    tematitzar amb currentColor i hereten el mode fosc sense codi extra.
 *  - Les posicions de repòs són fixes (no es rellegeix el rect a cada frame):
 *    llegir-lo forçaria layout sincrònic i retornaria la posició JA desplaçada,
 *    de manera que la força es calcularia des del punt mogut i s'autolimitaria.
 *  - Les marques en repòs no es reescriuen (`rest`): amb el punter lluny el
 *    bucle costa pràcticament zero encara que hi hagi centenars de nodes.
 *  - La densitat s'esvaeix cap als marges perquè la retícula neixi i mori en
 *    comptes de tallar-se en sec contra el titular, la navbar o el peu.
 *  - Sense punter el sistema té vida pròpia (el punt de referència es passeja),
 *    així a tàctil el camp respira igualment.
 *  - prefers-reduced-motion → retícula estàtica, cap bucle.
 */

type Fade = { left?: number; right?: number; top?: number; bottom?: number };

type Props = {
  /** Separació de la retícula en px. Per defecte s'escull segons l'amplada. */
  gap?: number;
  /** Diàmetre de cada punt en px. */
  dot?: number;
  /** Desplaçament màxim, en px (el del lockup és 30 a desktop). */
  magnet?: number;
  /** Radi d'influència del punter, en px. */
  radius?: number;
  /** Marges on la densitat s'esvaeix. 0 = tall net (per a vores que sagnen). */
  fade?: Fade;
  /**
   * Classes del contenidor. HA DE portar el `position` (`absolute` o
   * `relative`): el host és el bloc de referència dels punts, que són
   * absoluts, però NO se'l posa ell mateix.
   *
   * Abans la base portava un `relative` fix i el `position` del caller
   * quedava com a segona declaració de la MATEIXA propietat: qui guanyava
   * depenia de l'ordre del full generat, no de l'ordre de l'atribut. A la
   * pràctica guanyava sempre la base, i els camps que es volien `absolute`
   * (desktop i tablet) es quedaven en flux amb alçada 0 — no dibuixaven ni un
   * punt. Emetent-ne només un, el caller mana sense ambigüitat.
   */
  className: string;
  /**
   * Màscara CSS (valor de mask-image) aplicada inline al host. Inline i no
   * com a classe arbitrària de Tailwind: la classe amb radial-gradient no
   * arribava a aplicar-se al host (provat a l'iPhone, 22set26).
   */
  mask?: string;
  /**
   * El·lipse (radis en px) ancorada a la cantonada inferior dreta que
   * coincideix amb la `mask`. Els punts de fora no es creen: la màscara els
   * faria invisibles igualment, però cadascun és un node del DOM animat. A
   * mòbil passava de ~1.000 punts a ~350 (22set26).
   */
  cornerEllipse?: { rx: number; ry: number };
};

type Dot = { bx: number; by: number; x: number; y: number; a: number; rest: boolean; op: number };

const smooth = (u: number) => {
  const c = u < 0 ? 0 : u > 1 ? 1 : u;
  return c * c * (3 - 2 * c);
};

export default function HeroField({
  gap,
  dot = 3,
  magnet = 30,
  radius = 210,
  fade,
  mask,
  cornerEllipse,
  className,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  // Desestructurem a primitives: si `fade` entra a les dependències de
  // l'efecte, el literal per defecte crea un objecte nou a cada render i la
  // retícula sencera es reconstrueix contínuament.
  const fadeL = fade?.left ?? 210;
  const fadeR = fade?.right ?? 0;
  const fadeT = fade?.top ?? 150;
  const fadeB = fade?.bottom ?? 150;
  const ellRx = cornerEllipse?.rx ?? 0;
  const ellRy = cornerEllipse?.ry ?? 0;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dots: Dot[] = [];
    let nodes: HTMLDivElement[] = [];
    let raf = 0;
    const pointer = { x: 0, y: 0, on: false };

    const build = () => {
      const r = host.getBoundingClientRect();
      const CW = r.width;
      const CH = r.height;
      if (CW < 2 || CH < 2) return;
      const g = gap ?? (CW < 480 ? 20 : CW < 900 ? 26 : 32);
      const fl = fadeL, fr = fadeR, ft = fadeT, fb = fadeB;

      host.textContent = "";
      dots = [];
      nodes = [];
      const ox = (CW % g) / 2;
      const oy = (CH % g) / 2;
      for (let y = oy; y <= CH; y += g) {
        for (let x = ox; x <= CW; x += g) {
          const fx = Math.min(fl ? smooth(x / fl) : 1, fr ? smooth((CW - x) / fr) : 1);
          const fy = Math.min(ft ? smooth(y / ft) : 1, fb ? smooth((CH - y) / fb) : 1);
          const w = fx * fy;
          if (w < 0.03) continue;
          if (ellRx && ellRy && Math.hypot((CW - x) / ellRx, (CH - y) / ellRy) > 0.97) continue;
          const op = w * 0.22;
          const el = document.createElement("div");
          el.style.cssText =
            `position:absolute;left:0;top:0;width:${dot}px;height:${dot}px;` +
            "border-radius:9999px;background:currentColor";
          // Sense will-change: amb un per punt, cada punt era una capa de
          // composició (centenars a l'iPhone) i l'entrada anava a batzegades.
          el.style.transform = `translate(${x - dot / 2}px,${y - dot / 2}px)`;
          el.style.opacity = String(op);
          host.appendChild(el);
          dots.push({ bx: x, by: y, x: 0, y: 0, a: 0, rest: false, op });
          nodes.push(el);
        }
      }
    };

    build();
    const ro = new ResizeObserver(() => build());
    ro.observe(host);

    if (reduced) {
      return () => ro.disconnect();
    }

    // El punter es llegeix a nivell de finestra i es converteix a coordenades
    // locals: així el camp reacciona encara que el cursor sigui damunt del
    // titular, i els dos sistemes es mouen alhora.
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.on = true;
    };
    const onLeave = () => {
      pointer.on = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("pointerup", onLeave, { passive: true });
    // En tàctil, quan el gest passa a ser scroll, Safari envia pointercancel i
    // no pointerup: sense això el camp es quedava amb el dit "a sobre" i els
    // punts no tornaven a lloc (iPhone, 22set26).
    window.addEventListener("pointercancel", onLeave, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    // Sense cursor el camp queda quiet — mateixa regla que el lockup
    // (HeroTitle): els dos sistemes nomes reaccionen al punter.
    const OFF = -1e5;
    const loop = () => {
      // El rect del host ja no cal a cada frame: nomes servia per als objectius
      // sinusoidals del vagareig. Un getBoundingClientRect menys per frame.
      const tx = pointer.on ? pointer.x : OFF;
      const ty = pointer.on ? pointer.y : OFF;

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const dx = d.bx - tx;
        const dy = d.by - ty;
        const dist = Math.hypot(dx, dy);
        let ox = 0;
        let oy = 0;
        let oa = 0;
        if (dist < radius) {
          const f = 1 - dist / radius;
          const n = dist < 0.001 ? 0.001 : dist;
          ox = (dx / n) * f * magnet * 0.8;
          oy = (dy / n) * f * magnet * 0.8;
          oa = f;
        }
        d.x += (ox - d.x) * 0.12;
        d.y += (oy - d.y) * 0.12;
        d.a += (oa - d.a) * 0.12;

        const settled = Math.abs(d.x) < 0.05 && Math.abs(d.y) < 0.05 && d.a < 0.005;
        if (settled && d.rest) continue;
        d.rest = settled;

        const n = nodes[i];
        n.style.transform =
          `translate(${(d.bx - dot / 2 + d.x).toFixed(1)}px,` +
          `${(d.by - dot / 2 + d.y).toFixed(1)}px) scale(${(1 + d.a * 0.9).toFixed(2)})`;
        n.style.opacity = (d.op + d.a * 0.46).toFixed(3);
        // Mateixa aberració que les lletres, perquè els dos sistemes es tanquin.
        const sp = d.a * 1.6;
        n.style.boxShadow =
          d.a > 0.03
            ? `${sp.toFixed(1)}px 0 0 #f96057, -${sp.toFixed(1)}px 0 0 #1d9e75`
            : "none";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("pointerup", onLeave);
      window.removeEventListener("pointercancel", onLeave);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [gap, dot, magnet, radius, fadeL, fadeR, fadeT, fadeB, ellRx, ellRy]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={`pointer-events-none text-text-main ${className}`}
      style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
    />
  );
}
