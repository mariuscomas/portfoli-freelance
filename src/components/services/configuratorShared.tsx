"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useId } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion, useSpring, useTransform, useAnimationControls, useDragControls } from "framer-motion";
import { X, CaretDown, Check, Question } from "@phosphor-icons/react";
import { DISCIPLINES, DISCIPLINE_ORDER, type Discipline } from "@/lib/pricing";
import Button from "@/components/ui/Button";

/* ============================================================
   Primitius compartits pels configuradors (productes i col·laboració)
   ============================================================ */

/** "3.000 €" amb espai dur (la xifra i el € no es parteixen a final de línia)
 *  i signe menys tipogràfic per als descomptes («−90 €», com l'etiqueta
 *  «(−10%)» del pack). Decidit 24set26. */
export const formatEuro = (n: number) =>
  `${n < 0 ? "\u2212" : ""}${Math.abs(n).toLocaleString("ca-ES", { maximumFractionDigits: 0 })}\u00A0€`;

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Detecció de client sense setState-in-effect. */
const emptySubscribe = () => () => {};
export function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/**
 * Media query reactiu. Segur en client (el modal només es munta en client via
 * useIsClient), llegeix matchMedia a l'inicialitzador per evitar flaix.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

/**
 * Total animat: el número corre amb una spring cap al valor nou. Amb
 * prefers-reduced-motion salta directe. L'anunci per a SR viu fora (sr-only).
 */
export function AnimatedTotal({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const spring = useSpring(value, { stiffness: 260, damping: 32 });
  const display = useTransform(spring, (v) => formatEuro(Math.round(v)));
  useEffect(() => {
    if (reduce) spring.jump(value);
    else spring.set(value);
  }, [value, reduce, spring]);
  return <motion.span>{display}</motion.span>;
}

/** Classe compartida per als chips de selecció. */
export const chipClass = (active: boolean) =>
  `inline-flex min-h-11 items-center justify-center rounded-full border px-5 text-body-xs-light md:text-body-s-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base ${
    active
      ? "border-primary-main bg-primary-main text-text-main-inverse"
      : "border-border-default bg-surface-card text-text-secondary hover:border-text-main hover:text-text-main"
  }`;

/* ============================================================
   Curtain — cortina full-screen (portal + animació + a11y + header)
   ============================================================ */
export function Curtain({
  isOpen,
  onClose,
  title,
  stepLabel,
  focusKey,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  stepLabel?: string | null;
  /** Canvia'l per re-enfocar el [data-autofocus] (p. ex. la fase). */
  focusKey?: string | number;
  children: React.ReactNode;
}) {
  const isClient = useIsClient();
  const reduce = useReducedMotion();
  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="curtain"
          initial={reduce ? { opacity: 0 } : { y: "-100%" }}
          animate={reduce ? { opacity: 1 } : { y: 0 }}
          exit={reduce ? { opacity: 0 } : { y: "-100%" }}
          transition={{ duration: reduce ? 0.2 : 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[110] h-[100dvh] w-full bg-surface-base text-text-main"
        >
          <CurtainShell title={title} stepLabel={stepLabel} onClose={onClose} focusKey={focusKey}>
            {children}
          </CurtainShell>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function CurtainShell({
  title,
  stepLabel,
  onClose,
  focusKey,
  children,
}: {
  title: string;
  stepLabel?: string | null;
  onClose: () => void;
  focusKey?: string | number;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const isFirstFocus = useRef(true);

  useEffect(() => {
    const restoreFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
      restoreFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        dialogRef.current?.focus();
        return;
      }
      dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [focusKey]);

  const handleTrap = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const root = dialogRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === root)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="configurator-title"
      onKeyDown={handleTrap}
      className="flex h-full w-full flex-col focus:outline-none"
    >
      <header className="flex shrink-0 items-center justify-between gap-6 border-b border-border-subtle px-6 py-6 md:px-12 lg:px-24">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="-m-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-main transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
            aria-label="Tancar"
          >
            <X size={28} weight="regular" />
          </button>
          <h2 id="configurator-title" className="text-body-s-semibold md:text-body-l-semibold lg:text-display-xs text-text-main">
            {title}
          </h2>
        </div>
        {stepLabel && <p className="hidden text-caption text-text-secondary lg:block">{stepLabel}</p>}
      </header>
      {children}
    </div>
  );
}

/* ============================================================
   Files, stepper i switch
   ============================================================ */
/* ------------------------------------------------------------
   Ajuda per extra. Dos patrons, un sol copy (pricing.ts → CONFIG_EXTRAS.help):
   · desktop  → toggletip (clic fixa, hover i focus revelen, Esc i clic fora
     tanquen). La bombolla va en PORTAL perquè el `?` viu dins d'un contenidor
     amb overflow-clip i el modal té scroll propi.
   · mòbil    → desplegable inline: tota la caixa d'info és el trigger tàctil i
     el `?` només fa d'afordança. Obrir-ne un tanca l'anterior.
   Figma: component "Tooltip" (280 · Body/XS · Soft Shadow) i frame
   "Extres — mòbil (inline)".
   ------------------------------------------------------------ */

const HELP_EVENT = "configurator:help";
const announceHelp = (id: string) => {
  window.dispatchEvent(new CustomEvent(HELP_EVENT, { detail: id }));
};

/** Tanca aquesta ajuda quan se n'obre una altra: només una oberta alhora. */
function useCloseOnOtherHelp(id: string, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onOther = (e: Event) => {
      if ((e as CustomEvent).detail !== id) close();
    };
    window.addEventListener(HELP_EVENT, onOther);
    return () => window.removeEventListener(HELP_EVENT, onOther);
  }, [id, open, close]);
}

const HELP_W = 280;
const HELP_GAP = 12;

function HelpBubble({ text, anchor }: { text: string; anchor: DOMRect }) {
  // Si no hi cap a sobre, cau a sota i la fletxa canvia de costat.
  const below = anchor.top < 160;
  const left = Math.min(
    Math.max(12, anchor.left + anchor.width / 2 - HELP_W / 2),
    window.innerWidth - HELP_W - 12
  );
  const arrowLeft = anchor.left + anchor.width / 2 - left - 6;
  return (
    <div
      role="status"
      className="pointer-events-none fixed z-[120]"
      style={{
        left,
        top: below ? anchor.bottom + HELP_GAP : anchor.top - HELP_GAP,
        width: HELP_W,
        transform: below ? undefined : "translateY(-100%)",
      }}
    >
      <div className="relative rounded-xl border border-border-subtle bg-surface-card px-4 py-3 text-body-2xs md:text-body-xs text-text-main shadow-soft">
        {text}
        <span
          aria-hidden="true"
          style={{ left: arrowLeft }}
          className={`absolute h-3 w-3 rotate-45 bg-surface-card ${
            below ? "-top-1.5 border-l border-t" : "-bottom-1.5 border-r border-b"
          } border-border-subtle`}
        />
      </div>
    </div>
  );
}

/** Trigger `?` de 32 amb hit-area de 44 (pseudo-element, no infla la fila). */
export function HelpToggle({ label, text }: { label: string; text: string }) {
  const id = useId();
  const isClient = useIsClient();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const open = pinned || hovered;

  const measure = () => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
  };
  const closeAll = () => {
    setPinned(false);
    setHovered(false);
  };
  useCloseOnOtherHelp(id, open, closeAll);

  useEffect(() => {
    if (!open) return;
    const reposition = () => measure();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    const onDown = (e: PointerEvent) => {
      if (!btnRef.current?.contains(e.target as Node)) closeAll();
    };
    // capture:true → també els scrolls del contenidor del modal, no només el de window
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const reveal = () => {
    measure();
    setHovered(true);
    announceHelp(id);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={`Què inclou: ${label}`}
        aria-expanded={open}
        onClick={() => {
          const next = !pinned;
          setPinned(next);
          if (next) {
            measure();
            announceHelp(id);
          }
        }}
        onMouseEnter={reveal}
        onMouseLeave={() => setHovered(false)}
        onFocus={reveal}
        onBlur={() => setHovered(false)}
        className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base after:absolute after:left-1/2 after:top-1/2 after:h-11 after:w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']"
      >
        <Question size={16} weight="light" />
      </button>
      {isClient && open && rect
        ? createPortal(<HelpBubble text={text} anchor={rect} />, document.body)
        : null}
    </>
  );
}

export function ConfigRow({
  label,
  caption,
  captionId,
  help,
  children,
}: {
  label: string;
  caption: string;
  /** Id de la caption, per lligar-la a un control deshabilitat (aria-describedby). */
  captionId?: string;
  /** Text d'ajuda de l'extra. Sense això no surt cap `?`. */
  help?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  useCloseOnOtherHelp(id, open, close);

  const info = (
    <>
      <span className="flex items-center gap-1">
        <span className="text-body-s md:text-body-m lg:text-body-l text-text-main">{label}</span>
        {help && !isMobile ? <HelpToggle label={label} text={help} /> : null}
        {help && isMobile ? (
          <Question size={16} weight="light" aria-hidden="true" className="shrink-0 text-text-secondary" />
        ) : null}
      </span>
      <span id={captionId} className="text-caption-sm uppercase text-text-secondary">{caption}</span>
    </>
  );

  return (
    <div className="border-b border-border-subtle py-6">
      <div className="flex items-center gap-6">
        {help && isMobile ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${id}-help`}
            onClick={() => {
              const next = !open;
              setOpen(next);
              if (next) announceHelp(id);
            }}
            className="flex min-w-0 flex-1 flex-col items-start gap-2 text-left"
          >
            {info}
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col gap-2">{info}</div>
        )}
        {children}
      </div>
      {help && isMobile ? (
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              id={`${id}-help`}
              initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <p className="pt-3 text-body-2xs md:text-body-xs text-text-secondary">{help}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : null}
    </div>
  );
}

const STEP_BTN =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-subtle text-body-s md:text-body-m lg:text-body-l text-text-main transition-colors hover:border-text-main disabled:opacity-30 disabled:hover:border-border-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base";

export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`Treu una unitat de ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={STEP_BTN}
      >
        −
      </button>
      <span aria-live="polite" className="w-7 text-center text-body-xs-light md:text-body-s-light text-text-main tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Afegeix una unitat de ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={STEP_BTN}
      >
        +
      </button>
    </div>
  );
}

export function Switch({
  label,
  checked,
  onChange,
  disabled = false,
  describedBy,
  onBlockedClick,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Mòdul que depèn d'un altre que no està actiu (variant Disabled del
   *  mestre Switch, 24set26): pista `border-subtle`, pom `surface-card`. */
  disabled?: boolean;
  /** Id del text que explica per què està deshabilitat. */
  describedBy?: string;
  /** Amb `disabled`: el botó queda aria-disabled (no `disabled`) i el clic
   *  obre la confirmació de dependència en lloc de no fer res (24set26). */
  onBlockedClick?: () => void;
}) {
  const blocked = disabled && !!onBlockedClick;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-describedby={describedBy}
      aria-disabled={blocked ? true : undefined}
      disabled={disabled && !blocked}
      onClick={() => (blocked ? onBlockedClick?.() : onChange(!checked))}
      className="inline-flex min-h-11 shrink-0 items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base disabled:cursor-not-allowed aria-disabled:cursor-pointer"
    >
      <span
        aria-hidden="true"
        className={`relative h-7 w-[52px] rounded-full transition-colors duration-200 ${
          disabled
            ? "bg-border-subtle"
            : checked
              ? "bg-primary-main"
              : "bg-surface-card ring-1 ring-inset ring-text-secondary/70"
        }`}
      >
        <span
          className={`absolute top-[2px] h-6 w-6 rounded-full transition-[left,background-color] duration-200 ${
            disabled
              ? "left-[2px] bg-surface-card"
              : checked
                ? "left-[26px] bg-surface-card shadow-sm"
                : "left-[2px] bg-text-secondary/70"
          }`}
        />
      </span>
    </button>
  );
}

/* ============================================================
   Accordió, radiogroup i grup col·lapsable del resum
   ============================================================ */
export function Accordion({
  title,
  level = "h3",
  defaultOpen = true,
  indent = false,
  children,
}: {
  title: string;
  level?: "h3" | "h4";
  defaultOpen?: boolean;
  indent?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();
  const headClass = level === "h3" ? "text-display-2xs-medium lg:text-display-xs-medium" : "text-body-s";
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-4 border-b border-border-subtle py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
      >
        <span className={`flex-1 ${headClass} text-text-main`}>{title}</span>
        <CaretDown
          size={16}
          weight="regular"
          className={`shrink-0 text-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className={`flex flex-col ${indent ? "pl-6" : ""}`}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export interface RadioOption {
  id: string;
  label: string;
  detail?: string;
  meta?: string;
}

/** Llista vertical de selecció única (arquetip + detall + meta). */
export function RadioList({
  ariaLabel,
  options,
  value,
  onChange,
}: {
  ariaLabel: string;
  options: RadioOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-col gap-2 py-3">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={`flex items-center gap-3 rounded-base border px-3 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base ${
              active ? "border-primary-main bg-surface-card" : "border-transparent hover:bg-surface-card"
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                active ? "border-primary-main" : "border-border-default"
              }`}
            >
              {active && <span className="h-2 w-2 rounded-full bg-primary-main" />}
            </span>
            <span className="flex-1 text-body-xs-light md:text-body-s-light text-text-main">{o.label}</span>
            {o.detail && (
              <span className="hidden text-body-xs-light md:text-body-s-light text-text-secondary sm:block">{o.detail}</span>
            )}
            {o.meta && (
              <span className="shrink-0 text-caption text-text-secondary tabular-nums">{o.meta}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SummaryGroup({
  title,
  amount,
  lines,
  defaultOpen = true,
}: {
  title: string;
  amount: number;
  lines: { label: string; amount: number }[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();
  // M4c (24set26): la fila que acaba d'entrar o de canviar d'import es marca
  // un instant (fons surface-card que s'esvaeix). No al muntatge: el primer
  // pintat no és un canvi. Patró d'estat de renders previs, sense efecte.
  const firma = lines.map((l) => `${l.label}=${l.amount}`).join("|");
  const [prev, setPrev] = useState<{ firma: string; imports: Map<string, number> }>(() => ({
    firma,
    imports: new Map(lines.map((l) => [l.label, l.amount])),
  }));
  const [flash, setFlash] = useState<{ labels: Set<string>; n: number }>({ labels: new Set(), n: 0 });
  if (prev.firma !== firma) {
    const nous = new Set(lines.filter((l) => prev.imports.get(l.label) !== l.amount).map((l) => l.label));
    setPrev({ firma, imports: new Map(lines.map((l) => [l.label, l.amount])) });
    if (nous.size > 0) setFlash((f) => ({ labels: nous, n: f.n + 1 }));
  }
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-6 border-b border-border-subtle py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
      >
        <span className="flex flex-1 items-center gap-2">
          <span className="text-body-s text-text-main">{title}</span>
          <CaretDown
            size={16}
            weight="regular"
            className={`text-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </span>
        <span className="text-caption text-[length:1rem] leading-6 text-text-secondary tabular-nums">
          {formatEuro(amount)}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col pb-4 pl-6">
              {lines.map((l) => (
                <div
                  key={l.label}
                  className="relative flex items-center gap-6 border-b border-border-subtle py-3"
                >
                  {flash.labels.has(l.label) ? (
                    <motion.span
                      key={`flash-${flash.n}`}
                      aria-hidden="true"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: reduce ? 0 : 1.2, delay: reduce ? 0 : 0.3, ease: "easeOut" }}
                      className="pointer-events-none absolute inset-y-0 -left-3 right-0 bg-surface-card"
                    />
                  ) : null}
                  <span className="relative flex-1 text-body-xs-light md:text-body-s-light text-text-secondary">{l.label}</span>
                  <span className="relative text-caption text-text-secondary tabular-nums">
                    {formatEuro(l.amount)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   Camps de formulari compartits
   ============================================================ */
export function Field({
  label,
  required,
  error,
  ...props
}: { label: string; error?: string | null } & React.InputHTMLAttributes<HTMLInputElement>) {
  const errorId = useId();
  return (
    <label className="flex flex-col gap-2">
      <span className="text-label text-text-secondary">
        {label}
        {required && (
          <>
            {" "}
            <span aria-hidden="true">*</span>
            <span className="sr-only"> (obligatori)</span>
          </>
        )}
      </span>
      <input
        {...props}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="w-full border-b border-border-default bg-transparent py-3 font-sans text-body-l lg:text-body-xl text-text-main transition-colors placeholder:text-text-secondary/40 focus:border-text-main focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base disabled:opacity-50 aria-[invalid=true]:border-error"
      />
      {error && (
        <span id={errorId} role="alert" className="text-body-xs-light md:text-body-s-light text-error">
          {error}
        </span>
      )}
    </label>
  );
}

/**
 * <SelectField /> — desplegable natiu amb l'estil subratllat dels <Field/>.
 * El valor s'envia via FormData (name); l'estat intern només serveix per
 * atenuar el placeholder mentre no s'ha triat res.
 */
export function SelectField({
  label,
  name,
  options,
  placeholder,
  disabled,
  defaultValue = "",
}: {
  label: string;
  name: string;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <label className="flex flex-col gap-2">
      <span className="text-label text-text-secondary">{label}</span>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          className={`w-full appearance-none border-b border-border-default bg-transparent py-3 pr-8 font-sans text-body-l lg:text-body-xl transition-colors focus:border-text-main focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base disabled:opacity-50 ${
            value ? "text-text-main" : "text-text-secondary/40"
          }`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o} value={o} className="text-text-main">
              {o}
            </option>
          ))}
        </select>
        <CaretDown
          size={16}
          weight="regular"
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-text-secondary"
        />
      </div>
    </label>
  );
}

export function ChipGroup({
  label,
  options,
  selected,
  onSelect,
  disabled,
}: {
  label: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  const labelId = useId();
  const activeIdx = selected ? options.indexOf(selected) : -1;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    let next = idx;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (idx + 1) % options.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      next = (idx - 1 + options.length) % options.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = options.length - 1;
    onSelect(options[next]);
    const group = e.currentTarget.parentElement;
    group?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  };

  return (
    <div className="flex flex-col gap-3">
      <span id={labelId} className="text-label text-text-secondary">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {options.map((opt, idx) => {
          const active = selected === opt;
          const tabbable = !disabled && (active || (activeIdx === -1 && idx === 0));
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={tabbable ? 0 : -1}
              disabled={disabled}
              onClick={() => onSelect(opt)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`inline-flex min-h-11 items-center rounded-full border px-4 text-body-xs-light md:text-body-s-light transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base ${
                active
                  ? "border-primary-main bg-primary-main text-text-main-inverse"
                  : "border-border-default bg-surface-card text-text-secondary hover:border-text-main hover:text-text-main"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   DisciplineChips — 3 toggles independents (Disseny UX / UI / Desenvolupament).
   Tots encesos per defecte; l'usuari en treu. Mínim 1: l'últim actiu queda
   bloquejat (no es pot desmarcar). Estat ON = superfície de categoria (token
   per disciplina) + check; OFF = outline sobre card; el negre es reserva al CTA.
   ============================================================ */
/** Color per disciplina — variables CSS del DS (globals.css `--discipline-*`).
 *  S'apliquen via `style` (no via utility de Tailwind) perquè el color és
 *  dinàmic per categoria: la vora del chip i el cercle del badge en ON. */
const DISCIPLINE_VAR: Record<Discipline, string> = {
  ux: "var(--discipline-ux-surface)",
  ui: "var(--discipline-ui-surface)",
  dev: "var(--discipline-dev-surface)",
};
export function DisciplineChips({
  disciplines,
  onToggle,
  label = "Tipus de projecte",
  className = "",
}: {
  disciplines: Discipline[];
  onToggle: (d: Discipline) => void;
  /** Nom accessible del grup. La capçalera de /serveis el fa servir com a filtre. */
  label?: string;
  /** Alineació/espaiat extra del contenidor (p. ex. `justify-end` a /serveis). */
  className?: string;
}) {
  const onlyOne = disciplines.length === 1;
  return (
    <div role="group" aria-label={label} className={`flex flex-wrap gap-2 ${className}`}>
      {DISCIPLINE_ORDER.map((d) => {
        const active = disciplines.includes(d);
        return (
          <DisciplineChip
            key={d}
            discipline={d}
            active={active}
            locked={active && onlyOne} // no es pot treure l'últim actiu
            onToggle={onToggle}
          />
        );
      })}
    </div>
  );
}

/** Un chip de disciplina. Si es prem quan està bloquejat (últim actiu), en
 *  comptes de no fer res tremola per comunicar que l'acció no és possible. */
function DisciplineChip({
  discipline,
  active,
  locked,
  onToggle,
}: {
  discipline: Discipline;
  active: boolean;
  locked: boolean;
  onToggle: (d: Discipline) => void;
}) {
  const reduce = useReducedMotion();
  const controls = useAnimationControls();
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={active}
      aria-disabled={locked || undefined}
      animate={controls}
      onClick={() => {
        if (locked) {
          if (!reduce)
            controls.start({
              x: [0, -6, 6, -5, 5, -3, 3, 0],
              transition: { duration: 0.4, ease: "easeInOut" },
            });
          return;
        }
        onToggle(discipline);
      }}
      style={active ? { borderColor: DISCIPLINE_VAR[discipline] } : undefined}
      className={`relative inline-flex min-h-11 items-center gap-1 rounded-full border bg-surface-card text-body-xs-light md:text-body-s-light transition-[color,background-color,border-color,padding] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base ${
        active
          ? // seleccionat: badge a l'esquerra → padding esquerre reduït (Figma:
            // pl 12 / gap 4 / pr 16) per compensar el marge òptic del cercle
            "py-1.5 pr-4 pl-3 text-text-main"
          : "px-4 py-1.5 border-border-default text-text-secondary hover:border-text-main hover:text-text-main"
      } ${locked ? "cursor-default" : ""}`}
    >
      <AnimatePresence initial={false}>
        {active && (
          <motion.span
            key="badge"
            aria-hidden="true"
            className="inline-flex overflow-hidden"
            initial={reduce ? { opacity: 1 } : { width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { width: 0, opacity: 0 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 30 }}
          >
            <span
              className="flex size-6 items-center justify-center rounded-full"
              style={{ backgroundColor: DISCIPLINE_VAR[discipline] }}
            >
              <Check size={14} weight="bold" className="text-text-main" />
            </span>
          </motion.span>
        )}
      </AnimatePresence>
      <span>{DISCIPLINES[discipline].label}</span>
    </motion.button>
  );
}

/* ============================================================
   Full inferior (mòbil i tauleta) · mestre Figma `Sheet` 12501-11957
   ============================================================ */
/**
 * S'obre per sobre del contingut i per sota del peu, que queda visible (el
 * total i el CTA no es tapen). Fons `surface-scrim`; clic al fons, Esc i la X
 * el tanquen, i el focus torna a qui l'ha obert. No és modal: el peu queda
 * actiu a posta (es pot continuar sense tancar-lo). Pensat per anar DINS d'un
 * contenidor `relative` que ja sigui el peu: el full s'ancora a `bottom-full`.
 * Decidit 24set26 (wizard de 3 passos, el desglòs substitueix el pas Resum).
 */
export function Sheet({
  id,
  title,
  open,
  onClose,
  returnFocusRef,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onClose: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  // Lliscar cap avall per tancar (24set26). L'arrossegament només arrenca des
  // del tirador i la capçalera, perquè el cos del full pot fer scroll propi.
  const drag = useDragControls();

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    const ret = returnFocusRef?.current;
    return () => {
      window.removeEventListener("keydown", onKey, true);
      ret?.focus({ preventScroll: true });
    };
  }, [open, onClose, returnFocusRef]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="scrim"
            aria-hidden="true"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            className="fixed inset-0 z-0 bg-surface-scrim"
          />
          <motion.div
            key="sheet"
            id={id}
            role="dialog"
            aria-label={title}
            initial={{ y: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
            transition={{ duration: reduce ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
            drag={reduce ? false : "y"}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 500) onClose();
            }}
            className="absolute inset-x-0 bottom-full z-10 flex max-h-[calc(100dvh-10rem)] flex-col rounded-t-3xl bg-surface-base px-6 pb-8 md:px-12"
          >
            <div
              className="flex cursor-grab touch-none justify-center pt-3 pb-2 active:cursor-grabbing"
              aria-hidden="true"
              onPointerDown={(e) => drag.start(e)}
            >
              <span className="h-1 w-10 rounded-full bg-border-default" />
            </div>
            <div
              className="flex touch-none items-center justify-between pt-4 pb-6"
              onPointerDown={(e) => {
                // La X té el seu propi clic; la resta de la capçalera arrossega.
                if ((e.target as HTMLElement).closest("button")) return;
                drag.start(e);
              }}
            >
              <h2 className="text-display-2xs-medium md:text-display-xs-medium text-text-main">{title}</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Tanca el resum"
                className="flex h-11 w-11 items-center justify-center rounded-full text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto overscroll-none">{children}</div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

/* ============================================================
   Confirmació de dependència · mestre Figma `Popover · Dependència` 12523-24944
   ============================================================ */
/**
 * S'obre en tocar un mòdul bloquejat. Diu què cal i quant suma abans d'activar
 * res. `mode="popover"` (desktop): ancorat sota el switch, alineat a la dreta.
 * `mode="inline"` (mòbil/tauleta): desplegable sota la fila. Esc i «Cancel·la»
 * tanquen; el focus va a «Activa’ls tots dos».
 */
export function DependencyConfirm({
  mode,
  text,
  onConfirm,
  onCancel,
}: {
  mode: "popover" | "inline";
  text: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const reduce = useReducedMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  // onCancel arriba com a funció nova a cada render del pare: es llegeix d'una
  // ref perquè l'efecte (focus inicial i listeners) només corri en obrir-se.
  const cancelRef = useRef(onCancel);
  useEffect(() => {
    cancelRef.current = onCancel;
  }, [onCancel]);
  useEffect(() => {
    boxRef.current?.querySelector<HTMLElement>("[data-autofocus-confirm]")?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        cancelRef.current();
      }
    };
    // Clic o toc fora de la bombolla: cancel·la (no activa res). Decidit 24set26.
    // El listener s'enregistra al tick següent perquè el mateix clic que l'obre
    // no el tanqui.
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) cancelRef.current();
    };
    const t = window.setTimeout(() => window.addEventListener("pointerdown", onDown, true), 0);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("keydown", onKey, true);
    };
  }, []);

  const body = (
    <div
      ref={boxRef}
      role="alertdialog"
      aria-label="Cal activar un altre mòdul"
      className="rounded-xl border border-border-subtle bg-surface-card p-4 text-text-main shadow-soft"
    >
      <p className="text-body-2xs md:text-body-xs">{text}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="solid" shape="pill" size="md" onClick={onConfirm} data-autofocus-confirm>
          Activa’ls tots dos
        </Button>
        <Button variant="ghost" shape="pill" size="md" onClick={onCancel}>
          Cancel·la
        </Button>
      </div>
    </div>
  );

  if (mode === "popover") {
    return (
      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.18 }}
        className="absolute right-0 top-full z-20 mt-1 w-[280px]"
      >
        {body}
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
      animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div className="pb-6">{body}</div>
    </motion.div>
  );
}
