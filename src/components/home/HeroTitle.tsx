"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

/**
 * HeroTitle — lockup interactiu del hero.
 *
 * Un sol sistema que s'adapta al tema (sincronitzat amb la proposta de Figma
 * "Hero · Proposta efecte de cursor"):
 *
 *  - Mode CLAR  → desplaçament magnètic per lletra + aberració cromàtica
 *                 (coral/teal) que segueix el cursor: l'"eco viu".
 *  - Mode FOSC  → efecte INVERS: el titular queda atenuat (repòs) i el cursor
 *                 fa de FOCUS — una finestra que revela el degradat de marca a
 *                 través de les lletres (background-clip:text).
 *  - Cursor personalitzat (anella + punt, mix-blend difference) que segueix amb
 *                 lag i creix sobre el text. Es desactiva en tàctil.
 *  - Eco estàtic de repòs amb fade (molt subtil) darrere el lockup.
 *  - TÀCTIL (sense cursor) → l'efecte té vida pròpia: el punt de referència es
 *                 passeja sol pel titular; en tocar/arrossegar el segueix.
 *  - prefers-reduced-motion → lockup estàtic, sense animació.
 *
 * PENDENT: mostrar el VÍDEO real (videoSrc) dins les lletres del focus. Retallar
 * un <video> amb forma de text (clip-path/SVG mask) és inestable cross-browser i
 * s'ha d'afinar en navegador; ara s'usa el degradat com a revelat (robust).
 */

type Props = {
  lines?: string[];
  /** Vídeo del showreel per al revelat en mode fosc (pendent de màscara SVG). */
  videoSrc?: string;
  className?: string;
};

const DEFAULT_LINES = ["Estratègia.", "Disseny.", "Impacte."];

// Aberració cromàtica — accents de marca (Figma "#02 Colors").
const AB_1 = "#f96057"; // coral
const AB_2 = "#1d9e75"; // teal

export default function HeroTitle({
  lines = DEFAULT_LINES,
  videoSrc = "/videos/master-web.mp4",
  className = "",
}: Props) {
  const { resolvedTheme } = useTheme();
  const rootRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const lockupRef = useRef<HTMLHeadingElement>(null);
  const pointer = useRef({ x: -9999, y: -9999, active: false });
  const [reduced, setReduced] = useState(false);
  const [coarse, setCoarse] = useState(false);

  // prefers-reduced-motion + detecció de punter tàctil (coarse)
  useEffect(() => {
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cp = window.matchMedia("(pointer: coarse)");
    const update = () => {
      setReduced(rm.matches);
      setCoarse(cp.matches);
    };
    update();
    rm.addEventListener("change", update);
    cp.addEventListener("change", update);
    return () => {
      rm.removeEventListener("change", update);
      cp.removeEventListener("change", update);
    };
  }, []);

  // Seguiment del punter (ratolí o dit)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      pointer.current.x = e.clientX - r.left;
      pointer.current.y = e.clientY - r.top;
      pointer.current.active = true;
    };
    const onLeave = () => {
      pointer.current.active = false;
    };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerdown", onMove);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerup", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerdown", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerup", onLeave);
    };
  }, []);

  // Bucle d'animació
  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;

    const els = Array.from(
      root.querySelectorAll<HTMLSpanElement>("span[data-letter]")
    );
    const state = els.map(() => ({ x: 0, y: 0, s: 1, c: 0 }));

    // Posicions de REPÒS. Abans es llegia el rect de cada lletra a cada frame:
    // forçava layout sincrònic 60 cops/s i, pitjor, retornava la posició JA
    // DESPLAÇADA — la força es calculava des de la lletra moguda i
    // s'autolimitava sola, amb un comportament depenent del framerate.
    //
    // CLAU: el rect es mesura amb el desplaçament actual RESTAT (state[i]),
    // no posant els transforms a zero. Zerar-los enmig d'una interacció faria
    // saltar les lletres, i mesurar sense restar donaria una base contaminada.
    //
    // I es remesura més d'un cop a posta: el lockup viu dins d'un contenidor
    // amb l'animació d'entrada `.hero-enter` (translateY 24px → 0, 0,7s, i un
    // fallback amb 2,6s de delay quan hi ha IntroLoader). Mesurar només al
    // muntatge congelaria les bases amb el pare a mig camí i tot l'efecte
    // quedaria desplaçat verticalment respecte del cursor.

    // Escala de la física segons la mida REAL del lockup. El desplaçament de
    // 30px i el radi de 170 estan calibrats per als 112px de desktop; aplicats
    // tal qual als 40px del mòbil (Figma "Section Hero" mobile) el
    // desplaçament val 3/4 de l'alçada d'una lletra i les paraules es
    // trencaven literalment. Es reescala amb el font-size perquè l'efecte es
    // vegi igual de fort en proporció a qualsevol amplada.
    let k = 1;
    const measureScale = () => {
      const lk = lockupRef.current;
      const fs = lk ? parseFloat(getComputedStyle(lk).fontSize) : 112;
      k = Math.min(1, (Number.isFinite(fs) && fs > 0 ? fs : 112) / 112);
    };

    let bases: { x: number; y: number }[] = [];
    const measureBases = () => {
      measureScale();
      const rb0 = root.getBoundingClientRect();
      bases = els.map((el, i) => {
        const b = el.getBoundingClientRect();
        const s0 = state[i];
        return {
          x: b.left - rb0.left + b.width / 2 - s0.x,
          y: b.top - rb0.top + b.height / 2 - s0.y,
        };
      });
    };
    measureBases();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measureBases);
    }
    // Després de l'entrada (0,7s) i del fallback de l'IntroLoader (2,6s + 0,7s).
    const settleTimers = [800, 3500].map((ms) => window.setTimeout(measureBases, ms));
    const onResize = () => measureBases();
    window.addEventListener("resize", onResize);
    const dark = resolvedTheme === "dark";
    const cur = { x: 0, y: 0, vis: 0 };
    let raf = 0;

    const loop = (now: number) => {
      const rb = root.getBoundingClientRect();
      // Objectiu idle (sense cursor): es passeja sol pel titular.
      const ax = rb.width * 0.4 + Math.sin(now * 0.0006) * rb.width * 0.32;
      const ay = rb.height * 0.5 + Math.sin(now * 0.0012) * rb.height * 0.42;
      const usePointer = pointer.current.active;
      const tx = usePointer ? pointer.current.x : ax;
      const ty = usePointer ? pointer.current.y : ay;

      // Cursor personalitzat — només visible sobre la caixa de text de l'H1.
      if (cursorRef.current && !coarse) {
        let overText = false;
        const lk = lockupRef.current;
        if (lk && pointer.current.active) {
          const lb = lk.getBoundingClientRect();
          const hx = lb.left - rb.left;
          const hy = lb.top - rb.top;
          overText =
            pointer.current.x >= hx &&
            pointer.current.x <= hx + lb.width &&
            pointer.current.y >= hy &&
            pointer.current.y <= hy + lb.height;
        }
        const tgt = overText ? 1 : 0;
        if (pointer.current.active) {
          cur.x += (pointer.current.x - cur.x) * 0.22;
          cur.y += (pointer.current.y - cur.y) * 0.22;
        }
        cur.vis += (tgt - cur.vis) * 0.18;
        const c = cursorRef.current;
        c.style.transform = `translate(${cur.x.toFixed(1)}px, ${cur.y.toFixed(
          1
        )}px) scale(${(0.5 + cur.vis * 0.5).toFixed(3)})`;
        c.style.opacity = cur.vis.toFixed(3);
      }

      if (!dark) {
        // CLAR — magnètic + aberració
        for (let i = 0; i < els.length; i++) {
          const el = els[i];
          const bs = bases[i];
          if (!bs) continue;
          const dx = bs.x - tx;
          const dy = bs.y - ty;
          const d = Math.hypot(dx, dy);
          const R = 170 * k;
          let ox = 0,
            oy = 0,
            os = 1,
            oc = 0;
          if (d < R) {
            const f = 1 - d / R;
            const n = d < 0.001 ? 0.001 : d;
            ox = (dx / n) * f * 30 * k;
            oy = (dy / n) * f * 30 * k;
            os = 1 + f * 0.14;
            oc = f;
          }
          const s = state[i];
          s.x += (ox - s.x) * 0.15;
          s.y += (oy - s.y) * 0.15;
          s.s += (os - s.s) * 0.15;
          s.c += (oc - s.c) * 0.15;
          el.style.transform = `translate(${s.x.toFixed(2)}px, ${s.y.toFixed(
            2
          )}px) scale(${s.s.toFixed(3)})`;
          const sp = (s.c * 7 * k).toFixed(1);
          el.style.textShadow =
            s.c > 0.02
              ? `${sp}px 0 ${AB_1}, -${sp}px 0 ${AB_2}`
              : "none";
        }
        if (revealRef.current) revealRef.current.style.opacity = "0";
      } else {
        // FOSC — revelat amb finestra de cursor
        for (let i = 0; i < els.length; i++) {
          const el = els[i];
          const s = state[i];
          s.x += (0 - s.x) * 0.2;
          s.y += (0 - s.y) * 0.2;
          s.s += (1 - s.s) * 0.2;
          el.style.transform = `translate(${s.x.toFixed(2)}px, ${s.y.toFixed(
            2
          )}px) scale(${s.s.toFixed(3)})`;
          el.style.textShadow = "none";
        }
        const rev = revealRef.current;
        if (rev) {
          rev.style.opacity = "1";
          const lr = rev.getBoundingClientRect();
          const rx = tx - (lr.left - rb.left);
          const ry = ty - (lr.top - rb.top);
          const mask = `radial-gradient(circle ${Math.round(210 * k)}px at ${rx.toFixed(
            0
          )}px ${ry.toFixed(0)}px, #000 55%, transparent 100%)`;
          rev.style.setProperty("-webkit-mask-image", mask);
          rev.style.setProperty("mask-image", mask);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      settleTimers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("resize", onResize);
    };
  }, [reduced, resolvedTheme, coarse]);

  // Estil del DS, no valors en cru: `.text-display-h1` porta el clamp
  // (32 / 64 / 112), line-height 1 i letter-spacing −3px de Figma. Abans hi
  // havia `tracking-[-0.01em]` (−1,1px a 112), que feia el lockup ~82px més
  // ample del que marca el token — prou per menjar-se el marge amb el camp.
  const lockupCls = "text-display-h1";

  return (
    <div
      ref={rootRef}
      className={`relative select-none ${className}`}
      style={{ touchAction: "pan-y" }}
    >
      {/* Eco estàtic de repòs — molt subtil, amb fade cap a la dreta */}
      {!reduced && (
        <div
          aria-hidden
          /* max-md:hidden — l'eco és una peça d'amplada: la màscara el fon
             entre el 12% i el 58% del lockup, que a desktop cau en va i a
             402px cau JUSTAMENT damunt de la paraula següent. El Figma mòbil
             (11325:9090) té el lockup net, així que per sota de md no es
             renderitza. */
          className={`pointer-events-none absolute left-0 top-0 whitespace-nowrap max-md:hidden ${lockupCls}`}
          style={{
            opacity: resolvedTheme === "dark" ? 0.16 : 0.1,
            color: "var(--text-main)",
            WebkitMaskImage:
              "linear-gradient(to right, #000 0, #000 12%, transparent 58%)",
            maskImage:
              "linear-gradient(to right, #000 0, #000 12%, transparent 58%)",
          }}
        >
          {lines.map((line, i) => (
            <span key={i} className="block">
              {line}
              {line}
            </span>
          ))}
        </div>
      )}

      {/* Lockup base. Clar: visible + magnètic. Fosc: atenuat (estat de repòs)
          perquè el cursor faci de focus i l'encengui (efecte invers/revelat). */}
      <h1
        ref={lockupRef}
        aria-label={lines.join(" ")}
        className={`relative z-10 m-0 w-fit text-text-main ${lockupCls}`}
        style={{
          // A11Y: 0.32 donava 2.7:1 sobre --surface-base (#262522) — per sota
          // del 3:1 que demana AA per a text gran. 0.55 -> 5.17:1. El revelat
          // del cursor segueix sent el focus; només parteix d'un repòs llegible.
          opacity: resolvedTheme === "dark" && !reduced ? 0.55 : 1,
          transition: "opacity 0.5s ease",
          cursor: !reduced && !coarse ? "none" : undefined,
        }}
      >
        {lines.map((line, li) => (
          <span key={li} className="block">
            {[...line].map((ch, ci) => (
              <span
                key={ci}
                data-letter
                aria-hidden
                className="inline-block will-change-transform"
              >
                {ch}
              </span>
            ))}
          </span>
        ))}
      </h1>

      {/* Capa de revelat (mode fosc): el degradat de marca a través de les
          lletres (background-clip:text), limitat per la finestra del cursor
          (focus). Tècnica robusta i visible a tots els navegadors.
          NOTA: per mostrar el VÍDEO real dins les lletres cal afinar en
          navegador (clip-path/SVG mask de text és inestable cross-browser). */}
      {!reduced && resolvedTheme === "dark" && (
        <div
          ref={revealRef}
          aria-hidden
          data-video={videoSrc}
          className={`hero-reveal pointer-events-none absolute left-0 top-0 z-20 whitespace-nowrap ${lockupCls}`}
          style={{ opacity: 0 }}
        >
          {lines.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </div>
      )}

      {/* Cursor personalitzat — anella + punt, amb mix-blend-mode: difference
          (inverteix sobre clar i fosc). Segueix el punter amb lag i creix sobre
          el text. Només en punter fi (no tàctil) i sense reduced-motion. */}
      {!reduced && !coarse && (
        <div
          ref={cursorRef}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-30"
          style={{ opacity: 0, willChange: "transform, opacity" }}
        >
          <div
            style={{
              position: "absolute",
              transform: "translate(-50%, -50%)",
              width: 46,
              height: 46,
              borderRadius: 9999,
              border: "1.5px solid #fff",
              mixBlendMode: "difference",
            }}
          />
          <div
            style={{
              position: "absolute",
              transform: "translate(-50%, -50%)",
              width: 6,
              height: 6,
              borderRadius: 9999,
              background: "#fff",
              mixBlendMode: "difference",
            }}
          />
        </div>
      )}
    </div>
  );
}
