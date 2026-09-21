"use client";

import { useState, useId, useEffect, useRef } from "react";
import { useReducedMotion, motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, ArrowUpRight, Check } from "@phosphor-icons/react";
import Button from "@/components/ui/Button";
import TransitionLink from "@/components/common/TransitionLink";
import { submitQuote } from "@/app/actions/quotes";
import type { Json } from "@/types/database";
import {
  calcCollab,
  formatRate,
  COLLAB_TIERS,
  COLLAB_CALENDAR_URL,
  type CollabModality,
  RESPONSE_SLA,
} from "@/lib/pricing";
import {
  Curtain,
  Accordion,
  RadioList,
  Switch,
  ChipGroup,
  Field,
  formatEuro,
  type RadioOption,
} from "./configuratorShared";
import { EVENTS, trackEvent } from "@/lib/analytics";

/**
 * <CollabConfiguratorModal /> — Línia A (col·laboració amb agències).
 *
 * No és un "producte" (no és pressupost tancat sinó tarifa €/h). Flux:
 *   config → tria de dedicació + intensitat/urgència, tarifa "des de" en viu
 *   form   → dades de l'agència + encàrrec (mini-lead)
 *   sent   → confirmació + reserva de trucada (Calendar de col·laboracions)
 *
 * Font de veritat del càlcul: pricing.ts (calcCollab). Comparteix primitius
 * amb el ConfiguratorModal via configuratorShared.
 */

type Phase = "config" | "form" | "sent";

const CONDITIONS =
  "Condicions: facturació mensual 15–30 dies · sense IVA · renovació manté tarifa · 30 €/h és el terra";

const START_OPTIONS = ["Aquest mes", "1–3 mesos", "Estic explorant"];
const DURATION_OPTIONS = ["Puntual", "Unes setmanes", "Uns mesos", "3+ mesos"];

const modalityOptions: RadioOption[] = COLLAB_TIERS.map((t) => ({
  id: t.id,
  label: t.label,
  detail: t.detail,
  meta: formatRate({ rate: t.rate, rateMax: t.rateMax ?? t.rate }),
}));

export default function CollabConfiguratorModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  // Obertura del configurador de col·laboració: un sol event per obertura.
  const openedRef = useRef(false);
  useEffect(() => {
    if (isOpen && !openedRef.current) {
      openedRef.current = true;
      trackEvent(EVENTS.collabOpen);
    }
    if (!isOpen) openedRef.current = false;
  }, [isOpen]);

  return (
    <Curtain isOpen={isOpen} onClose={onClose} title="Configura la col·laboració">
      {isOpen && <CollabContent onClose={onClose} />}
    </Curtain>
  );
}

function CollabContent({ onClose }: { onClose: () => void }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("config");
  const [modality, setModality] = useState<CollabModality>("mes");
  const [partial, setPartial] = useState(false);
  const [urgent, setUrgent] = useState(false);

  const quote = calcCollab({ modality, partial, urgent });
  const rateLabel = formatRate(quote);

  const phaseTransition = { duration: reduce ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] as const };

  const buildSummary = () => {
    const tier = COLLAB_TIERS.find((t) => t.id === modality);
    return [
      `Col·laboració · ${tier?.label ?? modality}`,
      `Tarifa orientativa: ${rateLabel}`,
      quote.equivalent
        ? `Equivalent: ~${formatEuro(quote.equivalent)}/${quote.equivalentUnit}`
        : null,
      quote.modifiers.length ? `Modificadors: ${quote.modifiers.join(" · ")}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {phase === "config" && (
        <motion.div
          key="config"
          initial={{ opacity: 0, y: reduce ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduce ? 0 : -12 }}
          transition={phaseTransition}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 md:px-12 lg:px-24">
            <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 py-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_336px] lg:gap-12">
              {/* COLUMNA A — Com treballo */}
              <section
                aria-label="Com treballo"
                className="flex flex-col lg:border-r lg:border-border-subtle lg:pr-6"
              >
                <div className="border-b border-border-subtle py-5">
                  <h3
                    className="text-display-2xs-medium lg:text-display-xs-medium text-text-main focus:outline-none"
                    data-autofocus
                    tabIndex={-1}
                  >
                    Com treballo
                  </h3>
                  <p className="text-body-s font-normal text-text-main">(Base, sempre inclòs)</p>
                </div>
                {[
                  "Extensió del teu equip, com un membre més",
                  "Les teves eines (Figma, Slack, Linear, Notion), sense onboarding",
                  "Sprints i cerimònies del teu equip",
                  "Remot amb overlap horari complet (CET)",
                  "Incorporació en 48 h si cal, sense període de prova",
                ].map((item) => (
                  <p
                    key={item}
                    className="border-b border-border-subtle py-3 text-body-xs-light md:text-body-s-light text-text-main"
                  >
                    {item}
                  </p>
                ))}
              </section>

              {/* COLUMNA B — Dedicació + Intensitat/urgència */}
              <section aria-label="Configuració" className="flex flex-col gap-8">
                <Accordion title="Quina dedicació necessites?" level="h3" defaultOpen>
                  <RadioList
                    ariaLabel="Quina dedicació necessites?"
                    options={modalityOptions}
                    value={modality}
                    onChange={(id) => setModality(id as CollabModality)}
                  />
                </Accordion>

                <Accordion title="Intensitat i urgència" level="h3" defaultOpen>
                  <div className="flex items-center gap-6 border-b border-border-subtle py-4">
                    <span className="flex-1 text-body-s md:text-body-m lg:text-body-l text-text-main">
                      Dedicació parcial (&lt;20 h/setmana)
                    </span>
                    <Switch label="Dedicació parcial" checked={partial} onChange={setPartial} />
                  </div>
                  <div className="flex items-center gap-6 border-b border-border-subtle py-4">
                    <span className="flex-1 text-body-s md:text-body-m lg:text-body-l text-text-main">Ho necessites en &lt;48 h?</span>
                    <Switch label="Urgència" checked={urgent} onChange={setUrgent} />
                  </div>
                </Accordion>
              </section>

              {/* COLUMNA C — Resum */}
              <aside
                aria-label="Resum"
                className="flex flex-col gap-6 lg:border-l lg:border-border-subtle lg:pl-6"
              >
                <div className="flex flex-col">
                  <h3 className="border-b border-border-subtle py-5 text-display-2xs-medium lg:text-display-xs-medium text-text-main">
                    Resum
                  </h3>
                  <div className="flex items-center gap-6 py-5">
                    <span className="flex-1 text-display-2xs-medium lg:text-display-xs-medium text-text-main">Tarifa resultant:</span>
                    <span className="text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium text-text-main tabular-nums" aria-live="polite">
                      des de {rateLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 border-b border-border-subtle py-3">
                    <span className="flex-1 text-body-s text-text-main">Segons modalitat</span>
                    <span className="shrink-0 text-caption text-text-secondary tabular-nums">
                      {quote.equivalent
                        ? `~${formatEuro(quote.equivalent)}/${quote.equivalentUnit}`
                        : "mín. 4 h"}
                    </span>
                  </div>
                  {quote.modifiers.length > 0 && (
                    <Accordion title="Modificadors aplicats" level="h4" defaultOpen>
                      {quote.modifiers.map((m) => (
                        <p
                          key={m}
                          className="border-b border-border-subtle py-3 text-body-xs-light md:text-body-s-light text-text-secondary"
                        >
                          {m}
                        </p>
                      ))}
                    </Accordion>
                  )}
                </div>
                <div className="border-t dash-h-border-subtle pt-6">
                  <p className="text-caption uppercase text-text-secondary">{CONDITIONS}</p>
                </div>
              </aside>
            </div>
          </div>

          <footer className="shrink-0 border-t border-border-subtle bg-surface-base px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-12 lg:px-24">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between md:gap-8">
              <p className="text-caption text-text-secondary">
                Tarifa orientativa, la tanquem segons abast i durada. O{" "}
                <a
                  href={COLLAB_CALENDAR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 transition-colors hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
                >
                  reserva una trucada de 20 min
                  <span className="sr-only"> (s&apos;obre en una pestanya nova)</span>
                </a>
                .
              </p>
              <Button
                variant="solid"
                shape="pill"
                size="xl"
                onClick={() => setPhase("form")}
                iconRight={
                  <ArrowRight
                    size={22}
                    weight="regular"
                    className="transition-transform group-hover:translate-x-1"
                  />
                }
              >
                Continua
              </Button>
            </div>
          </footer>
        </motion.div>
      )}

      {phase === "form" && (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: reduce ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduce ? 0 : -12 }}
          transition={phaseTransition}
          className="flex min-h-0 flex-1 flex-col"
        >
          <CollabForm
            summary={buildSummary()}
            rateLabel={rateLabel}
            selectionBase={{ modality, partial, urgent }}
            pricing={
              {
                rate: quote.rate,
                rateMax: quote.rateMax,
                modifiers: quote.modifiers,
                equivalent: quote.equivalent,
                equivalentUnit: quote.equivalentUnit,
              } as unknown as Json
            }
            onBack={() => setPhase("config")}
            onSent={() => {
              setPhase("sent");
              trackEvent(EVENTS.collabSubmit);
            }}
          />
        </motion.div>
      )}

      {phase === "sent" && (
        <motion.div
          key="sent"
          initial={{ opacity: 0, y: reduce ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduce ? 0 : -12 }}
          transition={phaseTransition}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 md:px-12 lg:px-24"
        >
          <CollabConfirmation onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CollabForm({
  summary,
  rateLabel,
  selectionBase,
  pricing,
  onBack,
  onSent,
}: {
  summary: string;
  rateLabel: string;
  selectionBase: { modality: CollabModality; partial: boolean; urgent: boolean };
  pricing: Json;
  onBack: () => void;
  onSent: () => void;
}) {
  const [start, setStart] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const name = String(form.get("name") || "");
    const agency = String(form.get("agency") || "").trim();
    const userMessage = String(form.get("message") || "").trim();
    const website = String(form.get("website") || ""); // honeypot

    const message = [
      "Sol·licitud de col·laboració (Línia A)",
      `\n${summary}`,
      agency ? `\nAgència: ${agency}` : null,
      start ? `\nQuan comença: ${start}` : null,
      duration ? `\nDurada estimada: ${duration}` : null,
      userMessage ? `\nMissatge:\n${userMessage}` : null,
      "\n— [via configurador col·laboració]",
    ]
      .filter(Boolean)
      .join("\n");

    setSubmitting(true);
    setError(null);
    const res = await submitQuote({
      email,
      name,
      message,
      website,
      product: "collaboracio",
      selection: { ...selectionBase, start, duration } as unknown as Json,
      pricing,
      totalEur: null,
      rateLabel,
    });
    setSubmitting(false);
    if (res.status === "ok") onSent();
    else setError(res.message);
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
      <label
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
        tabIndex={-1}
      >
        No omplis aquest camp
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 md:px-12 lg:px-24">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 py-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_336px] lg:gap-12">
          {/* COLUMNA A — Les teves dades */}
          <section
            aria-label="Les teves dades"
            className="flex flex-col gap-8 lg:border-r lg:border-border-subtle lg:pr-6"
          >
            <h3
              className="border-b border-border-subtle py-5 text-display-2xs-medium lg:text-display-xs-medium text-text-main focus:outline-none"
              data-autofocus
              tabIndex={-1}
            >
              Les teves dades
            </h3>
            <Field
              label="Email"
              required
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="tu@agencia.com"
              disabled={submitting}
            />
            <Field label="Nom" name="name" type="text" autoComplete="name" placeholder="El teu nom" disabled={submitting} />
            <Field label="Agència" name="agency" type="text" placeholder="Nom de l'agència" disabled={submitting} />
          </section>

          {/* COLUMNA B — El teu encàrrec */}
          <section aria-label="El teu encàrrec" className="flex flex-col gap-6">
            <h3 className="border-b border-border-subtle py-5 text-display-2xs-medium lg:text-display-xs-medium text-text-main">
              El teu encàrrec
            </h3>
            <ChipGroup
              label="Quan comences?"
              options={START_OPTIONS}
              selected={start}
              onSelect={setStart}
              disabled={submitting}
            />
            <ChipGroup
              label="Durada estimada"
              options={DURATION_OPTIONS}
              selected={duration}
              onSelect={setDuration}
              disabled={submitting}
            />
            <label className="flex flex-col gap-2">
              <span className="text-label text-text-secondary">Missatge (opcional)</span>
              <textarea
                name="message"
                rows={5}
                maxLength={5000}
                placeholder="Què necessiteu? Perfil, stack, ritme de treball…"
                disabled={submitting}
                className="w-full resize-y rounded-md border border-border-default bg-surface-card p-4 font-sans text-body-s md:text-body-m lg:text-body-l text-text-main transition-colors placeholder:text-text-secondary/40 focus:border-text-main focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base disabled:opacity-50"
              />
            </label>
            {error && (
              <p id={errorId} role="alert" className="text-body-s md:text-body-m lg:text-body-l text-error">
                {error}
              </p>
            )}
          </section>

          {/* COLUMNA C — Resum */}
          <aside
            aria-label="Resum"
            className="flex flex-col gap-6 lg:border-l lg:border-border-subtle lg:pl-6"
          >
            <div className="flex flex-col">
              <h3 className="border-b border-border-subtle py-5 text-display-2xs-medium lg:text-display-xs-medium text-text-main">
                Resum
              </h3>
              <div className="flex items-center gap-6 py-5">
                <span className="flex-1 text-display-2xs-medium lg:text-display-xs-medium text-text-main">Tarifa resultant:</span>
                <span className="text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium text-text-main tabular-nums">des de {rateLabel}</span>
              </div>
            </div>
            <div className="border-t dash-h-border-subtle pt-6">
              <p className="text-caption uppercase text-text-secondary">{CONDITIONS}</p>
            </div>
          </aside>
        </div>
      </div>

      <footer className="shrink-0 border-t border-border-subtle bg-surface-base px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-12 lg:px-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between md:gap-8">
          <p className="text-caption text-text-secondary">
            Tarifa orientativa, la tanquem segons abast i durada.
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              disabled={submitting}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-base px-2 text-body-xs-light md:text-body-s-light text-text-secondary transition-colors hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base disabled:opacity-50"
            >
              <ArrowLeft size={16} weight="regular" aria-hidden="true" />
              Tornar
            </button>
            <Button
              variant="solid"
              shape="pill"
              size="xl"
              type="submit"
              loading={submitting}
              aria-describedby={error ? errorId : undefined}
              iconRight={
                <ArrowRight
                  size={22}
                  weight="regular"
                  className="transition-transform group-hover:translate-x-1"
                />
              }
            >
              {submitting ? "Enviant..." : "Enviar i reservar trucada"}
            </Button>
          </div>
        </div>
      </footer>
    </form>
  );
}

function CollabConfirmation({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="mx-auto flex w-full max-w-xl flex-col items-center gap-10 py-6 text-center md:py-10"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-6">
        <span
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary-main text-text-main-inverse"
          aria-hidden="true"
        >
          <Check size={32} weight="bold" />
        </span>
        <div className="flex flex-col gap-3">
          <h3 className="text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium text-text-main focus:outline-none" tabIndex={-1} data-autofocus>
            Rebut.
          </h3>
          <p className="max-w-prose text-body-s md:text-body-m lg:text-body-l text-text-secondary">
            He rebut el teu encàrrec. Et responc en menys de {RESPONSE_SLA} amb disponibilitat i
            una tarifa tancada.
          </p>
        </div>
      </div>

      <div className="flex w-full max-w-[488px] flex-col gap-5 rounded-card border border-border-subtle bg-surface-card p-6 text-left">
        <span className="text-label text-text-secondary">Què passa ara</span>
        <CollabStep index={1} title="Reviso l'encàrrec" detail="Perfil, stack i ritme. Avui o demà al matí." />
        <CollabStep index={2} title="Reservem una trucada" detail="Vols reservar-la ara" href={COLLAB_CALENDAR_URL} />
        <CollabStep index={3} title="Arrenquem" detail="Incorporació en 48 h si encaixa." />
      </div>

      <TransitionLink
        href="/works"
        onClick={onClose}
        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-base text-body-s md:text-body-m lg:text-body-l text-text-secondary transition-colors hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
      >
        Mentrestant, fes una ullada als treballs recents
        <ArrowUpRight size={16} weight="regular" aria-hidden="true" />
      </TransitionLink>
    </div>
  );
}

function CollabStep({
  index,
  title,
  detail,
  href,
}: {
  index: number;
  title: string;
  detail: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-subtle text-body-xs-light md:text-body-s-light text-text-main tabular-nums"
        aria-hidden="true"
      >
        {index}
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-body-s md:text-body-m lg:text-body-l text-text-main">{title}</span>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit text-body-xs-light md:text-body-s-light text-text-secondary underline underline-offset-4 transition-colors hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
          >
            {detail}
            <span className="sr-only"> (s&apos;obre en una pestanya nova)</span>
          </a>
        ) : (
          <span className="text-body-xs-light md:text-body-s-light text-text-secondary">{detail}</span>
        )}
      </div>
    </div>
  );
}
