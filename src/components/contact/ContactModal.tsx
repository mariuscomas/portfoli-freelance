"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, ArrowRight, ArrowUpRight, Check } from "@phosphor-icons/react";
import Button from "@/components/ui/Button";
import { submitContact } from "@/app/contacte/actions";
import { RESPONSE_SLA } from "@/lib/pricing";
import { SITE_EMAIL } from "@/lib/site";
import { EVENTS, trackEvent } from "@/lib/analytics";

/**
 * <ContactModal />
 *
 * Substitueix la pàgina /contacte. Figma "Contacta v.2" (node 11338:9556).
 * Cortina full-screen que baixa des de dalt amb un formulari conversacional
 * d'un camp per pas:
 *
 *   1. Nom               → "Com et dius?"
 *   2. Correu electrònic → "Quin és el teu correu?"
 *   3. Missatge          → "Què tens al cap?"  (textarea, envia)
 *   ✓  Confirmació       → "Missatge enviat."
 *
 * El footer ofereix les dues sortides alternatives del disseny: escriure un
 * correu (mailto) o agendar 30 min a Google Calendar.
 *
 * Reutilitza la Server Action `submitContact` (taula contact_submissions),
 * amb el mateix honeypot anti-spam que la resta de forms.
 *
 * Arquitectura: l'estat del formulari viu a <CurtainContent>, que només
 * està muntat mentre la cortina és oberta — així cada obertura comença de
 * zero sense efectes de reset (i el lint de react-hooks queda content).
 *
 * A11y (WCAG 2.1 AA): role=dialog + aria-modal, focus-trap, Escape tanca,
 * restauració de focus al trigger, focus a l'input a cada pas, errors amb
 * role=alert, targets ≥44px i prefers-reduced-motion (cortina → fade).
 */

const EMAIL = SITE_EMAIL;
const CALL_BOOKING_URL = "https://calendar.app.google/b4khxKQkiSNss4KR6";

interface StepDef {
  key: "name" | "email" | "message";
  label: string;
  question: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "email" | "text";
  multiline?: boolean;
}

const STEPS: StepDef[] = [
  {
    key: "name",
    label: "Nom",
    question: "Com et dius?",
    type: "text",
    autoComplete: "name",
  },
  {
    key: "email",
    label: "Correu electrònic",
    question: "Quin és el teu correu?",
    type: "email",
    autoComplete: "email",
    inputMode: "email",
  },
  {
    key: "message",
    label: "Missatge",
    question: "Què tens al cap?",
    multiline: true,
  },
];

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/** Validació per pas — retorna el missatge d'error o null si és vàlid. */
function validateStep(key: StepDef["key"], value: string): string | null {
  const v = value.trim();
  if (key === "name") {
    if (v.length === 0) return "Digues-me com et dius per poder-te respondre.";
    if (v.length > 200) return "El nom és massa llarg.";
  }
  if (key === "email") {
    if (!EMAIL_REGEX.test(v)) return "Si us plau, escriu un correu vàlid.";
  }
  if (key === "message") {
    if (v.length < 5) return "Explica-m'ho amb almenys 5 caràcters.";
    if (v.length > 5000) return "El missatge és massa llarg (màx 5000 caràcters).";
  }
  return null;
}

/* Selector dels elements enfocables, per al focus-trap (com ServiceModal). */
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * <AnimatedPlaceholder />
 *
 * El placeholder natiu no es pot animar per caràcters, així que el fem
 * transparent (es manté a l'atribut per a lectors de pantalla) i pintem
 * aquesta capa per sobre: cada lletra entra escalonada d'esquerra a dreta,
 * caient de dalt a baix amb un blur que es desfà — efecte "màgic".
 *
 * Les paraules són inline-block amb whitespace-nowrap perquè el text pugui
 * fer wrap en pantalles estretes sense trencar paraules a mitges. El delay
 * és per índex global de lletra, així l'escalonat travessa les paraules de
 * forma contínua. Amb prefers-reduced-motion: fade simple sense desplaçament.
 */
function AnimatedPlaceholder({ text, visible }: { text: string; visible: boolean }) {
  const reduce = useReducedMotion();

  // Pre-calculem paraules amb l'índex global de la primera lletra de cadascuna.
  const words: { chars: string[]; startIndex: number }[] = [];
  let letterIndex = 0;
  for (const word of text.split(" ")) {
    words.push({ chars: Array.from(word), startIndex: letterIndex });
    letterIndex += word.length;
  }

  const BASE_DELAY = 0.25; // deixa acabar l'entrada del pas (0.35s solapats)
  const STAGGER = 0.03;

  return (
    <AnimatePresence>
      {visible && (
        <motion.span
          aria-hidden="true"
          initial={false}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          className="pointer-events-none absolute inset-0 flex flex-wrap content-center items-center justify-center px-3.5 py-2.5 text-center font-sans text-body-2xl text-text-secondary/50"
        >
          {words.map((word, w) => (
            <span
              key={w}
              className={`inline-block whitespace-nowrap ${
                w < words.length - 1 ? "mr-[0.3em]" : ""
              }`}
            >
              {word.chars.map((ch, c) => (
                <motion.span
                  key={c}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: -20, filter: "blur(8px)" }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: reduce ? 0.3 : 0.5,
                    ease: [0.16, 1, 0.3, 1],
                    delay: reduce ? 0 : BASE_DELAY + (word.startIndex + c) * STAGGER,
                  }}
                  className="inline-block"
                >
                  {ch}
                </motion.span>
              ))}
            </span>
          ))}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/* Detecció de client sense setState-in-effect: snapshot de servidor false,
   de client true. Evita el clàssic useState(mounted) + useEffect. */
const emptySubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const isClient = useIsClient();
  const reduce = useReducedMotion();

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="contact-curtain"
          initial={reduce ? { opacity: 0 } : { y: "-100%" }}
          animate={reduce ? { opacity: 1 } : { y: 0 }}
          exit={reduce ? { opacity: 0 } : { y: "-100%" }}
          transition={{ duration: reduce ? 0.2 : 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[110] h-[100dvh] w-full bg-surface-base text-text-main"
        >
          <CurtainContent onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/**
 * Contingut de la cortina. Només viu mentre el modal és obert, per tant
 * l'estat del formulari es reinicia sol a cada obertura.
 */
function CurtainContent({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState(false);
  const [values, setValues] = useState({ name: "", email: "", message: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const reduce = useReducedMotion();

  const dialogRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Scroll-lock del body + restauració de focus al trigger en desmuntar.
  useEffect(() => {
    const restoreFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
      restoreFocus?.focus?.();
    };
  }, []);

  // Escape tanca.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Focus a l'input del pas actual.
  useEffect(() => {
    if (sent) return;
    const id = requestAnimationFrame(() => fieldRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [step, sent]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Focus-trap: cicla Tab/Shift+Tab dins la cortina.
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

  const advance = async () => {
    const message = validateStep(current.key, values[current.key]);
    if (message) {
      setError(message);
      fieldRef.current?.focus();
      return;
    }
    setError(null);

    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }

    // Últim pas → enviem.
    setSubmitting(true);
    const res = await submitContact({
      email: values.email,
      name: values.name,
      message: `${values.message.trim()}\n\n— [via modal contacte]`,
      website: "", // honeypot buit: usuari humà
    });
    setSubmitting(false);

    if (res.status === "ok") {
      setSent(true);
      trackEvent(EVENTS.contactSubmit);
    } else {
      setError(res.message);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void advance();
  };

  // Al textarea, Enter avança (Shift+Enter fa salt de línia), com als
  // formularis conversacionals tipus Typeform.
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void advance();
    }
  };

  // Auto-grow: el textarea comença amb l'alçada d'una línia (com els inputs
  // dels altres passos) i creix amb el contingut — quan el text esgota
  // l'amplada i salta de línia, o amb Shift+Enter. A partir del 40% del
  // viewport deixa de créixer i fa scroll intern.
  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = "auto"; // reset per poder mesurar scrollHeight real
    const max = Math.round(window.innerHeight * 0.4);
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  };

  const stepTransition = { duration: reduce ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      onKeyDown={handleTrap}
      className="flex h-full w-full flex-col px-6 md:px-12 lg:px-24 focus:outline-none"
    >
      {/* === HEADER: pregunta marc + tancar === */}
      <header className="flex shrink-0 items-center justify-between gap-6 py-6">
        <h2 id="contact-modal-title" className="text-display-h5 text-text-main">
          Tens un projecte concret al cap?
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="-m-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-main transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
          aria-label="Tancar"
        >
          <X size={28} weight="regular" />
        </button>
      </header>

      {/* === CONTINGUT: un pas cada vegada, centrat === */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-6">
        <AnimatePresence mode="wait" initial={false}>
          {sent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: reduce ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -12 }}
              transition={stepTransition}
              className="flex w-full max-w-2xl flex-col items-center gap-6 text-center"
              role="status"
              aria-live="polite"
            >
              <span
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary-main text-text-main-inverse"
                aria-hidden="true"
              >
                <Check size={32} weight="bold" />
              </span>
              <h3 className="text-heading-h2 text-text-main">Missatge enviat.</h3>
              <p className="text-body-lg text-text-secondary leading-relaxed">
                T&apos;hem rebut, {values.name.trim().split(" ")[0]}. Responem en menys de{" "}
                {RESPONSE_SLA} a {values.email.trim()}.
              </p>
              <Button variant="solid" shape="pill" size="xl" onClick={onClose} className="mt-2">
                Tancar
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key={current.key}
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: reduce ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -12 }}
              transition={stepTransition}
              className="flex w-full flex-col items-center gap-12 md:gap-20"
              noValidate
            >
              {/* Honeypot: visualment ocult i fora del tab order */}
              <label
                aria-hidden="true"
                className="absolute -left-[9999px] h-px w-px overflow-hidden"
                tabIndex={-1}
              >
                No omplis aquest camp
                <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              </label>

              {/* Camp del pas: label petit + input gegant centrat.
                  Gap generós label↔input, com al disseny (el label flota
                  per sobre de la pregunta, no enganxat). */}
              <div
                className={`flex w-full flex-col items-center gap-6 md:gap-10 ${
                  current.multiline ? "max-w-4xl" : "max-w-3xl"
                }`}
              >
                <label
                  htmlFor={`contact-step-${current.key}`}
                  className="text-label text-text-secondary"
                >
                  {current.label}{" "}
                  <span aria-hidden="true" className="text-error">
                    *
                  </span>
                  <span className="sr-only">
                    {" "}
                    (obligatori). Pas {step + 1} de {STEPS.length}
                  </span>
                </label>

                {/* Wrapper relatiu: l'input real (placeholder natiu transparent,
                    però present per a lectors de pantalla) + la capa
                    AnimatedPlaceholder amb les lletres escalonades. */}
                <div className="relative w-full">
                  {current.multiline ? (
                    <textarea
                      ref={(el) => {
                        fieldRef.current = el;
                        // En muntar el pas (o tornar-hi enrere amb text escrit),
                        // ajustem l'alçada al contingut existent.
                        if (el) autoGrow(el);
                      }}
                      id={`contact-step-${current.key}`}
                      name={current.key}
                      rows={1}
                      maxLength={5000}
                      placeholder={current.question}
                      value={values[current.key]}
                      disabled={submitting}
                      onChange={(e) => {
                        setValues((v) => ({ ...v, [current.key]: e.target.value }));
                        if (error) setError(null);
                        autoGrow(e.currentTarget);
                      }}
                      onKeyDown={handleTextareaKeyDown}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? "contact-step-error" : undefined}
                      className="w-full resize-none overscroll-contain border-b border-border-default bg-transparent px-3.5 py-2.5 text-center font-sans text-body-2xl text-text-main transition-colors placeholder:text-transparent focus:border-text-main focus:outline-none disabled:opacity-50"
                    />
                  ) : (
                    <input
                      ref={(el) => {
                        fieldRef.current = el;
                      }}
                      id={`contact-step-${current.key}`}
                      name={current.key}
                      type={current.type}
                      autoComplete={current.autoComplete}
                      inputMode={current.inputMode}
                      placeholder={current.question}
                      value={values[current.key]}
                      disabled={submitting}
                      onChange={(e) => {
                        setValues((v) => ({ ...v, [current.key]: e.target.value }));
                        if (error) setError(null);
                      }}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? "contact-step-error" : undefined}
                      className="w-full border-b border-border-default bg-transparent px-3.5 py-2.5 text-center font-sans text-body-2xl text-text-main transition-colors placeholder:text-transparent focus:border-text-main focus:outline-none disabled:opacity-50"
                    />
                  )}

                  <AnimatedPlaceholder
                    text={current.question}
                    visible={values[current.key].length === 0}
                  />
                </div>

                {error && (
                  <p
                    id="contact-step-error"
                    role="alert"
                    className="mt-2 text-body-md text-error"
                  >
                    {error}
                  </p>
                )}
              </div>

              {/* CTA Continuar / Enviar + tornar enrere */}
              <div className="flex flex-col items-center gap-4">
                <Button
                  variant="solid"
                  shape="pill"
                  size="xl"
                  type="submit"
                  loading={submitting}
                  iconRight={
                    <ArrowRight
                      size={22}
                      weight="regular"
                      className="transition-transform group-hover:translate-x-1"
                    />
                  }
                >
                  {submitting ? "Enviant..." : isLast ? "Enviar" : "Continuar"}
                </Button>
                {step > 0 && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setError(null);
                      setStep((s) => s - 1);
                    }}
                    className="inline-flex min-h-11 items-center justify-center rounded-base text-body-sm text-text-secondary transition-colors hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
                  >
                    ← Tornar
                  </button>
                )}
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* === FOOTER: sortides alternatives (correu / trucada) === */}
      <footer className="flex shrink-0 flex-col gap-3 py-6 md:flex-row md:items-center md:justify-between md:gap-6">
        <p className="text-heading-h4 text-text-main">
          Escriu-me un correu i et responc el mateix dia?{" "}
          <a
            href={`mailto:${EMAIL}`}
            className="rounded-base underline decoration-text-secondary/40 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
          >
            {EMAIL}
          </a>
        </p>
        <a
          href={CALL_BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex w-fit items-center gap-1.5 rounded-base text-heading-h4 text-text-main transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base md:text-right"
        >
          Prefereixes parlar? Agafem 30 min sense compromís.
          <ArrowUpRight size={16} weight="regular" aria-hidden="true" />
          <span className="sr-only">(s&apos;obre en una pestanya nova)</span>
        </a>
      </footer>
    </div>
  );
}
