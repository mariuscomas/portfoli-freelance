"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight } from "@phosphor-icons/react";
import TransitionLink from "@/components/common/TransitionLink";
import { RESPONSE_SLA } from "@/lib/pricing";

/**
 * Confirmació del configurador amb efecte "focus": el centre és el dark normal
 * i tot el que queda fora del cursor s'enfosqueix amb un degradat cap als
 * extrems. Brush check real (public/images/check.svg) amb tilt 3D lligat al
 * cursor. Ocupa tot el viewport (portal) sobre el modal.
 *
 * Accessibilitat: el missatge d'èxit és llegible en tot moment (light-on-dark),
 * respecta prefers-reduced-motion (estat clar estàtic) i té fallback tàctil
 * (focus que deriva sol). Esc i el botó tancar criden onClose.
 */
export default function ConfirmationSpotlight({
  email,
  reference,
  callUrl,
  worksHref = "/works",
  promise = "amb un primer abast i una proposta concreta",
  onClose,
}: {
  email: string;
  reference: string | null;
  callUrl: string;
  worksHref?: string;
  /** Què rebrà en la resposta. Col·laboració: «amb disponibilitat i una tarifa tancada» (25set26). */
  promise?: string;
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const colRef = useRef<HTMLDivElement>(null);
  const checkRef = useRef<SVGSVGElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Esc → tanca
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const root = rootRef.current;
    const col = colRef.current;
    const check = checkRef.current;
    const ring = ringRef.current;
    const hint = hintRef.current;
    if (!root || !col || !check || !ring) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = matchMedia("(pointer: coarse)").matches;
    const setVar = (k: string, v: string) => root.style.setProperty(k, v);

    // focus inicial al tancar (accessibilitat) després de l'entrada
    closeRef.current?.focus({ preventScroll: true });

    // ---- entrada: brush wipe + stagger ----
    const reveals = Array.from(root.querySelectorAll<HTMLElement>(".reveal"));
    const timers: number[] = [];
    if (reduce) {
      check.style.clipPath = "none";
      reveals.forEach((el) => el.classList.add("in"));
    } else {
      timers.push(window.setTimeout(() => check.classList.add("drawn"), 200));
      reveals.forEach((el, i) =>
        timers.push(window.setTimeout(() => el.classList.add("in"), 480 + i * 110)),
      );
    }

    // ---- colors clar → fosc ----
    const A = { bg: [242, 242, 242], fg: [11, 11, 11], fg2: [68, 71, 73], bb: [26, 26, 26], bf: [255, 255, 255] };
    const B = { bg: [23, 23, 23], fg: [247, 247, 247], fg2: [190, 193, 196], bb: [244, 244, 244], bf: [11, 11, 11] };
    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
    const mix = (a: number[], b: number[], k: number) =>
      `rgb(${Math.round(lerp(a[0], b[0], k))},${Math.round(lerp(a[1], b[1], k))},${Math.round(lerp(a[2], b[2], k))})`;

    let mx = innerWidth / 2, my = innerHeight / 2;
    let t = 0;
    let tx = 0, ty = 0;
    const TILT = 18;
    let moved = false;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!moved) {
        moved = true;
        hint?.classList.remove("show");
      }
    };
    window.addEventListener("pointermove", onMove);

    let hintTimer = 0;
    if (!coarse) {
      hintTimer = window.setTimeout(() => {
        if (!moved) hint?.classList.add("show");
      }, 1400);
    } else {
      // mòbil: focus que deriva sol
      let a = 0;
      const drift = () => {
        a += 0.006;
        mx = innerWidth * (0.5 + 0.28 * Math.cos(a));
        my = innerHeight * (0.5 + 0.2 * Math.sin(a * 1.3));
        raf = requestAnimationFrame(drift);
      };
      // el drift comparteix el rAF amb frame(); l'iniciem via frame()
      void drift;
    }

    const frame = () => {
      const r = col.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const d = Math.hypot(mx - cx, my - cy);
      const inner = 130, outer = 560;
      let k = 1 - Math.min(Math.max((d - inner) / (outer - inner), 0), 1);
      k = k * k * (3 - 2 * k); // smoothstep
      const targetT = reduce ? 0 : k;
      t += (targetT - t) * 0.08;

      setVar("--t", t.toFixed(3));
      setVar("--mx", mx + "px");
      setVar("--my", my + "px");
      setVar("--spot-r", (90 + 120 * t).toFixed(1) + "px");

      if (!reduce && !coarse) {
        const tgx = (my / innerHeight - 0.5) * -TILT;
        const tgy = (mx / innerWidth - 0.5) * TILT;
        tx += (tgx - tx) * 0.08;
        ty += (tgy - ty) * 0.08;
        setVar("--tiltx", tx.toFixed(2) + "deg");
        setVar("--tilty", ty.toFixed(2) + "deg");
      }

      setVar("--bg", mix(A.bg, B.bg, t));
      setVar("--fg", mix(A.fg, B.fg, t));
      setVar("--fg2", mix(A.fg2, B.fg2, t));
      setVar("--btn-bg", mix(A.bb, B.bb, t));
      setVar("--btn-fg", mix(A.bf, B.bf, t));
      setVar("--bloom-op", (1 - t).toFixed(3));
      setVar("--sh", (4 * t * (1 - t)).toFixed(3));

      if (coarse) {
        // deriva del focus en tàctil
        const a2 = performance.now() / 1000;
        mx = innerWidth * (0.5 + 0.28 * Math.cos(a2 * 0.35));
        my = innerHeight * (0.5 + 0.2 * Math.sin(a2 * 0.45));
      }

      ring.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
      ring.classList.toggle("dim", t > 0.5);

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      timers.forEach(clearTimeout);
      clearTimeout(hintTimer);
    };
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={rootRef}
      className="cspot"
      role="dialog"
      aria-modal="true"
      aria-label="Sol·licitud enviada"
    >
      <style>{CSS}</style>

      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        className="cspot__close"
        aria-label="Tancar"
      >
        <X size={22} weight="regular" />
      </button>

      {/* brush check */}
      <div className="cspot__checkwrap" aria-hidden="true">
        <div className="cspot__bloom" />
        <svg ref={checkRef} className="cspot__check" viewBox="0 0 258 273" role="img" aria-label="Enviat">
          <path d={CHECK_PATH} />
        </svg>
      </div>

      {/* contingut sempre llegible */}
      <div className="cspot__content">
        <div className="col" ref={colRef}>
          {/* Figma: Display/S · 2XL Semi Bold (mòbil 11643-17747, desktop al
              mestre 11587-12626); XL a tablet, que el Figma no dibuixa.
              Substitueix el clamp(38→80) d'abans (21set26). */}
          {/* Mòbil i tauleta (<1024): la referència va d'eyebrow sobre el
              titular (Figma 12506-15510). A desktop va dins del paràgraf. */}
          {reference ? (
            <p className="cspot__eyebrow reveal text-caption-sm uppercase">
              Ref. #{reference}
            </p>
          ) : null}
          <h1 className="reveal text-display-s md:text-display-xl lg:text-display-2xl" role="status">
            Sol·licitud enviada.
          </h1>
          {/* Sense <br />: el salt el decideix l'amplada (regla de salts
              manuals, 24set26). */}
          <p className="cspot__lead reveal">
            <span className="cspot__sent">T’he enviat una còpia a {email}</span>{" "}
            {reference ? (
              <span className="cspot__refinline">
                <span className="ref">Ref. #{reference}</span> ·{" "}
              </span>
            ) : null}
            Responc en {RESPONSE_SLA} {promise}.
          </p>
          <a
            className="cspot__cta reveal"
            href={callUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Reservar una trucada de 20 min
            <ArrowRight size={18} weight="regular" aria-hidden="true" />
          </a>
          <div className="cspot__links">
            <TransitionLink href={worksHref} onClick={onClose} className="cspot__secondary reveal">
              Mentrestant, fes una ullada als treballs recents
              <ArrowRight size={20} weight="regular" aria-hidden="true" />
            </TransitionLink>
          </div>
        </div>
      </div>

      <div className="cspot__vignette" aria-hidden="true" />
      <p ref={hintRef} className="cspot__hint">
        Mou el ratolí per enfocar
      </p>
      <div ref={ringRef} className="cspot__ring" aria-hidden="true" />
    </div>,
    document.body,
  );
}

const CHECK_PATH =
  "M56.0074 272.947C56.0074 269.875 55.4166 268.339 54.235 268.339L46.082 272.238C46.082 270.584 45.1367 269.402 43.2462 268.693L40.4104 268.339C38.5198 268.339 36.1566 269.166 33.3208 270.82C32.8482 269.639 32.2574 268.457 31.5484 267.276C30.8395 266.094 30.2487 265.031 29.7761 264.085C26.7039 258.177 23.6318 251.679 20.5597 244.589C17.7238 237.263 15.0062 230.292 12.4067 223.675C10.0435 217.058 8.15297 211.859 6.73506 208.078C5.78979 205.006 4.72636 200.398 3.54477 194.253C2.36318 188.109 1.18159 180.311 0 170.858C2.5995 172.512 4.6082 173.339 6.02611 173.339C7.68033 173.339 9.2164 170.858 10.6343 165.895C11.3433 166.84 12.643 167.313 14.5336 167.313C15.9515 167.313 17.0149 166.84 17.7238 165.895L23.3955 157.388L29.7761 159.515H30.1305C30.6032 159.515 31.0758 159.278 31.5484 158.806C32.0211 158.333 32.73 157.86 33.6753 157.388C35.5659 156.206 36.9838 155.615 37.929 155.615L38.9925 155.97C44.9004 158.806 48.6815 164.005 50.3357 171.567C54.5894 189.527 58.8432 198.507 63.0969 198.507C67.3506 198.507 72.3133 194.017 77.9849 185.037C80.8207 180.547 83.6566 175.348 86.4924 169.44C89.5645 163.532 92.6366 156.915 95.7088 149.589C96.1814 152.425 96.654 153.843 97.1267 153.843C98.3083 153.843 100.317 150.889 103.153 144.981C106.225 139.073 111.069 130.92 117.686 120.522C121.467 114.142 126.194 106.934 131.865 98.899C137.773 90.8642 144.036 82.5931 150.653 74.0857C157.27 65.5782 163.65 57.5434 169.794 49.9812C176.175 42.4191 181.847 35.9203 186.809 30.485C191.772 25.0497 195.435 21.5049 197.798 19.8507C206.778 13.7064 213.868 7.79848 219.067 2.12686C218.83 3.78107 218.476 5.31714 218.003 6.73506C217.767 7.91665 217.649 8.74376 217.649 9.21639C217.649 10.1617 218.121 10.6343 219.067 10.6343L228.992 5.67162V7.08953C228.992 8.98008 229.465 9.92535 230.41 9.92535C231.119 9.92535 232.537 8.86192 234.664 6.73506C236.791 4.6082 237.972 3.07213 238.208 2.12686L237.5 7.08953L249.552 0L246.716 6.38059C250.497 3.78108 253.215 2.48133 254.869 2.48133C255.814 2.48133 256.523 3.07212 256.996 4.25371C257.468 5.19898 257.705 6.14426 257.705 7.08953C257.705 8.50743 257.114 10.1617 255.932 12.0522C254.751 13.9428 253.215 16.1878 251.324 18.7873C249.906 20.6778 247.543 23.5136 244.235 27.2947C241.162 30.8395 236.436 36.1566 230.056 43.2462C223.675 50.0994 215.167 59.6703 204.533 71.9588C201.697 75.0309 197.325 80.4662 191.418 88.2647C185.51 95.8269 178.775 104.689 171.212 114.851C163.886 124.776 156.561 134.819 149.235 144.981C141.909 155.143 135.41 164.359 129.739 172.63C124.067 180.665 120.05 186.691 117.686 190.709L95.7088 227.929C90.9824 235.963 87.0832 242.58 84.011 247.779C80.9389 252.742 78.5757 256.169 76.9215 258.059C73.3767 262.313 69.4775 266.094 65.2238 269.402L62.0335 267.63L59.1976 269.402L56.0074 272.947Z";

const CSS = `
.cspot{
  position:fixed; inset:0; z-index:120; overflow:hidden;
  --bg:#f2f2f2; --fg:#0b0b0b; --fg2:#444749; --btn-bg:#1a1a1a; --btn-fg:#fff;
  --t:0; --mx:50vw; --my:50vh; --sh:0; --spot-r:180px; --bloom-op:1;
  background:var(--bg); color:var(--fg);
  font-family:var(--font-sans, system-ui, sans-serif);
  cursor:none; display:grid; place-items:center;
}
.cspot__close{
  position:absolute; top:22px; right:24px; z-index:7;
  width:44px; height:44px; display:inline-flex; align-items:center; justify-content:center;
  border:0; background:transparent; color:var(--fg); border-radius:9999px; cursor:none;
  opacity:.7; transition:opacity .2s ease;
}
.cspot__close:hover{ opacity:1; }
.cspot__close:focus-visible{ outline:2px solid var(--fg); outline-offset:2px; }

.cspot__checkwrap{
  position:absolute; right:12vw; top:43%; transform:translateY(-50%);
  width:min(44vw,520px); aspect-ratio:258/273; display:grid; place-items:center;
  pointer-events:none; perspective:1000px;
}
.cspot__bloom{
  position:absolute; width:160%; aspect-ratio:1; border-radius:50%;
  background:radial-gradient(circle, rgba(255,255,255,.9) 0%, rgba(255,255,255,0) 62%);
  opacity:var(--bloom-op); filter:blur(6px);
}
.cspot__check{ width:100%; height:100%; overflow:visible; position:relative;
  transform:rotateX(var(--tiltx,0deg)) rotateY(var(--tilty,0deg));
  transform-style:preserve-3d; will-change:transform;
  clip-path:inset(0 100% 0 0); }
.cspot__check.drawn{ clip-path:inset(0 0 0 0);
  transition:clip-path .72s cubic-bezier(.65,0,.35,1); }
.cspot__check path{ fill:var(--fg); }

.cspot__content{ position:relative; z-index:3; width:min(92vw,1180px); padding:0 6vw;
  display:flex; align-items:center; }
.cspot .col{ max-width:560px; }
.cspot h1{
  /* Tipus: utilities del JSX (Display/S · XL · 2XL). Aquí no, que aquest
     CSS no té @layer i guanyaria a les utilities. */
  color:var(--fg);
  white-space:nowrap; text-shadow:0 0 calc(18px*var(--sh)) var(--bg);
}
.cspot__lead{
  margin-top:22px; max-width:46ch;
  font-weight:400; font-size:20px; line-height:28px; letter-spacing:0; color:var(--fg2);
  text-shadow:0 0 calc(14px*var(--sh)) var(--bg);
}
.cspot__lead .ref{ color:var(--fg); font-weight:500; }

.cspot__cta{
  margin-top:34px; text-decoration:none;
  display:inline-flex; align-items:center; gap:10px;
  background:var(--btn-bg); color:var(--btn-fg);
  font-weight:500; font-size:17px; padding:16px 26px; border-radius:16px; cursor:none;
  box-shadow:0 10px 30px rgba(0,0,0,calc(.18 + .22*var(--t)));
  transition:transform .25s cubic-bezier(.2,.8,.2,1);
}
.cspot__cta:hover{ transform:translateY(-2px); }
.cspot__cta:focus-visible{ outline:2px solid var(--fg); outline-offset:3px; }

.cspot__links{ margin-top:30px; display:flex; flex-direction:column; gap:14px; }
.cspot__secondary{
  display:inline-flex; align-items:center; gap:10px;
  color:var(--fg2); text-decoration:none; font-size:15px; width:fit-content; cursor:none;
  text-shadow:0 0 calc(14px*var(--sh)) var(--bg);
}
.cspot__secondary svg{ transition:transform .25s ease; }
.cspot__secondary:hover svg{ transform:translateX(5px); }
.cspot__secondary:focus-visible{ outline:2px solid var(--fg); outline-offset:3px; border-radius:4px; }

.cspot__vignette{
  position:absolute; inset:0; pointer-events:none; z-index:5; opacity:var(--t);
  background:radial-gradient(circle at var(--mx) var(--my),
    rgba(0,0,0,0) 0,
    rgba(0,0,0,0) var(--spot-r,220px),
    rgba(0,0,0,.82) calc(var(--spot-r,220px) + 70px),
    rgba(0,0,0,.9) calc(var(--spot-r,220px) + 320px),
    rgba(0,0,0,.96) 100%);
}
.cspot__ring{
  position:fixed; z-index:6; pointer-events:none; left:0; top:0;
  width:26px; height:26px; border-radius:50%; transform:translate(-50%,-50%);
  border:1.5px solid color-mix(in srgb, var(--fg) 55%, transparent);
  transition:width .25s ease, height .25s ease, border-color .25s ease; will-change:transform;
}
.cspot__ring.dim{ width:54px; height:54px; border-color:rgba(255,248,236,.6); }

.cspot__hint{
  position:fixed; left:50%; bottom:34px; transform:translateX(-50%); z-index:6;
  font-size:12.5px; letter-spacing:.04em; color:var(--fg2); opacity:0;
  transition:opacity .6s ease; pointer-events:none; text-transform:uppercase;
}
.cspot__hint.show{ opacity:.6; }

.cspot .reveal{ opacity:0; transform:translateY(14px); }
.cspot .reveal.in{ opacity:1; transform:none; transition:opacity .7s ease, transform .7s cubic-bezier(.2,.8,.2,1); }

.cspot__eyebrow{ display:none; }

/* Mòbil i tauleta (<1024, el mateix tall que l'assistent del configurador).
   Figma: mòbil 12506-15510, tauleta 12506-15528. Text a l'esquerra, check a
   dalt a la dreta sense rebaixar, i la trucada a tota l'amplada al peu, a
   l'abast del polze. Substitueix el centrat amb el check al 50% (24set26). */
@media (max-width:1023px){
  .cspot{ display:flex; }
  .cspot__content{
    width:100%; min-height:100%; flex-direction:column; align-items:stretch;
    padding:calc(env(safe-area-inset-top) + 174px) 24px calc(env(safe-area-inset-bottom) + 48px);
  }
  .cspot .col{ max-width:none; flex:1; display:flex; flex-direction:column; }
  .cspot__eyebrow{ display:block; margin-bottom:12px; color:var(--fg); }
  .cspot__refinline{ display:none; }
  .cspot h1{ white-space:normal; }
  .cspot__lead{ max-width:none; margin-top:12px; font-size:16px; line-height:24px; }
  .cspot__sent{ display:block; margin-bottom:12px; }
  .cspot__checkwrap{ right:59px; top:calc(env(safe-area-inset-top) + 18px); transform:none; width:107px; }
  .cspot__close{ top:calc(env(safe-area-inset-top) + 16px); right:16px; }
  .cspot__cta{
    margin-top:auto; width:100%; justify-content:center; min-height:64px;
    border-radius:9999px; font-size:18px;
  }
  .cspot__links{ margin-top:24px; align-items:center; }
  .cspot__secondary{ text-align:center; }
}
@media (min-width:768px) and (max-width:1023px){
  .cspot__content{ padding-left:48px; padding-right:48px; }
  .cspot__close{ top:24px; right:48px; }
  /* El check a l'esquerra del botó de tancar, amb 24 de marge. */
  .cspot__checkwrap{ right:116px; }
  .cspot__cta{ width:fit-content; }
  .cspot__links{ align-items:flex-start; }
  .cspot__secondary{ text-align:left; }
}
@media (prefers-reduced-motion: reduce){
  .cspot .reveal{ opacity:1 !important; transform:none !important; transition:none !important; }
  .cspot{ cursor:auto; }
  .cspot__ring, .cspot__hint{ display:none; }
}
`;
