"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  X,
  ArrowRight,
  ArrowUpRight,
  Check,
  Cube,
  DeviceMobile,
  Globe,
  Target,
  Browsers,
  Planet,
  Detective,
  RocketLaunch,
  Microscope,
  Sparkle,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import TransitionLink from "@/components/common/TransitionLink";
import { submitContact } from "@/app/contacte/actions";
import { Service } from "@/types";
import { t } from "@/lib/i18n";

/**
 * <ServiceModal />
 *
 * Flux de conversió en 3 estats dins del mateix modal (Figma
 * "Modal Serveis · Conversion Flow", node 11105:12548). El panell ESQUERRE
 * (imatge + articles) és constant; el panell DRET es transforma:
 *
 *   idle  → pricing + dual-CTA (proposta personalitzada / trucada 20 min)
 *   form  → formulari inline amb qualificació de lead (timing + pressupost)
 *   sent  → confirmació "Missatge enviat" + "Què passa ara"
 *
 * No es canvia de pàgina: el formulari crida la mateixa Server Action
 * `submitContact` que /contacte. Les respostes de qualificació s'annexen
 * al missatge, per no requerir columnes noves a `contact_submissions`.
 *
 * Accessibilitat (WCAG 2.1 AA): focus-trap dins el dialog, focus inicial al
 * card i moviment de focus al heading en canviar d'estat, restauració del
 * focus al trigger en tancar, chips com a radiogroup amb fletxes, targets
 * ≥44px, anell de focus fosc (coherent amb el token focus/ring del DS) i
 * suport de prefers-reduced-motion.
 */

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
}

/**
 * URL de reserva de trucada. El CTA secundari hi enllaça en una pestanya nova.
 * Si es posa a null, el secundari obre el formulari inline (mateix destí).
 */
const CALL_BOOKING_URL: string | null = "https://calendar.app.google/b4khxKQkiSNss4KR6";

const TIMING_OPTIONS = ["Aquest mes", "1–3 mesos", "Estic explorant"];
const BUDGET_OPTIONS = ["< 3.000€", "3–7.000€", "7–15.000€", "> 15.000€"];

/* Mapping flexible: noms vells (Lucide) i nous (Phosphor) → mateix component. */
const ICON_MAP: Record<string, PhosphorIcon> = {
  Cube,
  DeviceMobile,
  Globe,
  Target,
  Browsers,
  Planet,
  Detective,
  RocketLaunch,
  Microscope,
  Sparkle,
  Box: Cube,
  Smartphone: DeviceMobile,
  LayoutTemplate: Browsers,
  Sparkles: Sparkle,
};

function getIcon(iconName: string): PhosphorIcon {
  return ICON_MAP[iconName] || Sparkle;
}

/* Selector dels elements enfocables, per al focus-trap. */
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

type View = "idle" | "form" | "sent";

export default function ServiceModal({ isOpen, onClose, service }: ServiceModalProps) {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<View>("idle");
  const reduce = useReducedMotion();

  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const isFirstFocus = useRef(true);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // En obrir (o canviar de servei) tornem sempre a l'estat inicial.
  useEffect(() => {
    if (isOpen) setView("idle");
  }, [isOpen, service?.id]);

  // Escape tanca.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Focus inicial al card en obrir + restauració al trigger en tancar.
  useEffect(() => {
    if (isOpen) {
      restoreFocusRef.current = document.activeElement as HTMLElement;
      isFirstFocus.current = true;
      const id = requestAnimationFrame(() => dialogRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    restoreFocusRef.current?.focus?.();
    restoreFocusRef.current = null;
  }, [isOpen]);

  // En canviar d'estat (form/sent) movem el focus al heading nou perquè els
  // lectors de pantalla anunciïn el canvi. El primer render no compta (ja
  // s'ha enfocat el card).
  useEffect(() => {
    if (!isOpen) return;
    if (isFirstFocus.current) {
      isFirstFocus.current = false;
      return;
    }
    const id = requestAnimationFrame(() => {
      const el = dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]");
      el?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [view, isOpen]);

  if (!service || !mounted) return null;

  const Icon = getIcon(service.icon_name);
  const title = t(service.title);
  const slug = t(service.slug);
  const contentAbout = t(service.content_about);
  const contentSteps = t(service.content_steps);
  const contentDeliverables = t(service.content_deliverables);
  const contentWhyUs = t(service.content_why_us);
  const revisions = t(service.revisions);
  const duration = t(service.duration);

  // Pricing — la BD només té price_starts_at. El preu gran és aquest valor;
  // el "Desde X€" petit és una fracció (40%).
  const fullPrice = service.price_starts_at
    ? `${service.price_starts_at.toLocaleString("de-DE")}€`
    : "Consultar";
  const lowPrice = service.price_starts_at
    ? `${Math.round(service.price_starts_at * 0.4).toLocaleString("de-DE")}€`
    : null;

  // Fites de pagament: si el servei en té de definides a la BD, les usem;
  // si no, fallback al 50/50 clàssic (sempre que hi hagi preu).
  const customMilestones =
    Array.isArray(service.payment_milestones) && service.payment_milestones.length > 0
      ? service.payment_milestones.map((m) => ({
          percent: typeof m.percent === "number" ? m.percent : null,
          title: t(m.title) || "",
          meta: t(m.meta) || "",
        }))
      : null;
  const milestones =
    customMilestones ??
    (service.price_starts_at
      ? [
          { percent: 50, title: "Kickoff", meta: "A la signatura" },
          { percent: 50, title: "Lliurament final", meta: "Al handoff" },
        ]
      : []);
  const hasMilestones = milestones.length > 0;

  const titleStr = typeof title === "string" ? title : "Service";
  const slugStr = typeof slug === "string" ? slug : "";

  // Focus-trap: cicla Tab/Shift+Tab dins el card.
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

  /*
    Portal a document.body — crític perquè el modal es comporti com un modal
    real i no s'atrapi dins de parents amb transform/filter/etc.
  */
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start md:items-center justify-center p-4 md:p-10 lg:p-16 xl:p-24"
        >
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: reduce ? 0 : 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: reduce ? 0 : 20 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleTrap}
            className="bg-surface-card rounded-card w-full max-w-[1280px] max-h-[88vh] md:max-h-[85vh] overflow-y-auto hide-scrollbar shadow-2xl relative focus:outline-none"
          >
            <div className="flex flex-col gap-10 md:gap-12 p-6 md:p-12">

              {/* === HEADER: títol uppercase + close === */}
              <header className="flex items-start justify-between gap-6">
                <h3
                  id="service-modal-title"
                  className="text-display-h5 text-text-main"
                >
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="shrink-0 -m-2 inline-flex items-center justify-center w-11 h-11 text-text-main hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card rounded-full"
                  aria-label="Tancar"
                >
                  <X size={24} weight="regular" />
                </button>
              </header>

              {/* === GRID 50/50: esquerra constant, dreta canvia segons `view` === */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-start">

                {/* ===== Columna ESQUERRA — imatge + articles (constant) ===== */}
                <div className="min-w-0 flex flex-col gap-10 md:gap-16">

                  {/* Imatge protagonista (ratio ~5/4 com a Figma) */}
                  <div
                    className="rounded-card overflow-hidden w-full bg-surface-base relative"
                    style={{ aspectRatio: "5 / 4" }}
                  >
                    {service.image_url ? (
                      <Image
                        src={service.image_url}
                        alt={titleStr}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-text-secondary/30">
                        <Icon size={180} weight="thin" />
                      </div>
                    )}
                  </div>

                  {/* Articles — un per cada bloc de contingut omplert. */}
                  {contentAbout && (
                    <Article title="About this Service">{contentAbout}</Article>
                  )}
                  {contentSteps && (
                    <Article title="Our Step-by-Step Plan:">{contentSteps}</Article>
                  )}
                  {contentDeliverables && (
                    <Article title="Main Deliverables:">{contentDeliverables}</Article>
                  )}
                  {contentWhyUs && (
                    <Article title="Why Choose This Offer?">{contentWhyUs}</Article>
                  )}
                </div>

                {/* ===== Columna DRETA — panell que es transforma ===== */}
                <aside className="min-w-0 bg-surface-base rounded-card p-6 md:p-10">
                  <AnimatePresence mode="wait" initial={false}>
                    {view === "idle" && (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: reduce ? 0 : -8 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <PricingView
                          fullPrice={fullPrice}
                          lowPrice={lowPrice}
                          hasMilestones={hasMilestones}
                          milestones={milestones}
                          revisions={revisions}
                          duration={duration}
                          onRequestProposal={() => setView("form")}
                        />
                      </motion.div>
                    )}

                    {view === "form" && (
                      <motion.div
                        key="form"
                        initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: reduce ? 0 : -8 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <FormView
                          serviceTitle={titleStr}
                          serviceSlug={slugStr}
                          onSent={() => setView("sent")}
                          onBack={() => setView("idle")}
                        />
                      </motion.div>
                    )}

                    {view === "sent" && (
                      <motion.div
                        key="sent"
                        initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: reduce ? 0 : -8 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <ConfirmationView onClose={onClose} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </aside>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}

/* ============================================================
   ESTAT A · Pricing + dual-CTA
   ============================================================ */
function PricingView({
  fullPrice,
  lowPrice,
  hasMilestones,
  milestones,
  revisions,
  duration,
  onRequestProposal,
}: {
  fullPrice: string;
  lowPrice: string | null;
  hasMilestones: boolean;
  milestones: { percent: number | null; title: string; meta: string }[];
  revisions: string;
  duration: string;
  onRequestProposal: () => void;
}) {
  return (
    <div className="flex flex-col gap-10 md:gap-16">
      <div className="flex flex-col gap-8 md:gap-12">

        {/* Header preu */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col text-text-main">
            {lowPrice && <span className="text-heading-h4">Desde {lowPrice}</span>}
            <span className="text-heading-h1">{fullPrice}</span>
          </div>
          {hasMilestones && (
            <p className="text-body-md text-text-secondary">
              {`Aquest servei conté ${milestones.length} ${
                milestones.length === 1 ? "fita" : "fites"
              } de pagament`}
            </p>
          )}
        </div>

        {/* Card blanc interior amb les fites de pagament */}
        {hasMilestones && (
          <div className="bg-surface-card border border-surface-border rounded-card p-6 flex flex-col gap-3">
            {milestones.map((m, i) => (
              <MilestoneRow
                key={i}
                index={i + 1}
                title={m.title}
                meta={m.meta}
                amount={m.percent != null ? `${m.percent}%` : ""}
              />
            ))}
          </div>
        )}

        {/* Meta */}
        {(revisions || duration) && (
          <div className="flex flex-col gap-3">
            {revisions && <MetaRow label="Concepts i revisions:" value={revisions} />}
            {duration && <MetaRow label="Durada del projecte:" value={duration} />}
          </div>
        )}
      </div>

      {/* Dual-CTA */}
      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={onRequestProposal}
          className="group w-full h-16 bg-primary-main text-text-main-inverse rounded-base text-button-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-main focus-visible:ring-offset-surface-base"
        >
          Demanar proposta personalitzada
          <ArrowRight size={22} weight="regular" className="group-hover:translate-x-1 transition-transform" />
        </button>

        {CALL_BOOKING_URL ? (
          <a
            href={CALL_BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 min-h-11 text-body-md text-text-secondary hover:text-text-main transition-colors rounded-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
          >
            o agenda una trucada de 20 min
            <ArrowUpRight size={16} weight="regular" aria-hidden="true" />
            <span className="sr-only">(s&apos;obre en una pestanya nova)</span>
          </a>
        ) : (
          <button
            type="button"
            onClick={onRequestProposal}
            className="inline-flex items-center justify-center gap-1.5 min-h-11 text-body-md text-text-secondary hover:text-text-main transition-colors rounded-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
          >
            o agenda una trucada de 20 min
            <ArrowUpRight size={16} weight="regular" aria-hidden="true" />
          </button>
        )}

        <p className="text-body-sm text-text-secondary text-center">
          Et responc en 24h amb un primer abast i una proposta concreta.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   ESTAT B · Formulari inline amb qualificació
   ============================================================ */
function FormView({
  serviceTitle,
  serviceSlug,
  onSent,
  onBack,
}: {
  serviceTitle: string;
  serviceSlug: string;
  onSent: () => void;
  onBack: () => void;
}) {
  const [timing, setTiming] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const name = String(form.get("name") || "");
    const userMessage = String(form.get("message") || "").trim();
    const website = String(form.get("website") || ""); // honeypot

    // Missatge amb la qualificació annexada (sempre ≥ 5 caràcters).
    const message = [
      `Proposta sol·licitada per: ${serviceTitle}`,
      timing ? `Quan vol arrencar: ${timing}` : null,
      budget ? `Pressupost orientatiu: ${budget}` : null,
      userMessage ? `\nMissatge:\n${userMessage}` : null,
      `\n— [via modal /serveis${serviceSlug ? `/${serviceSlug}` : ""}]`,
    ]
      .filter(Boolean)
      .join("\n");

    setSubmitting(true);
    setError(null);
    const res = await submitContact({ email, name, message, website });
    setSubmitting(false);

    if (res.status === "ok") onSent();
    else setError(res.message);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
      {/* Honeypot */}
      <label aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden" tabIndex={-1}>
        No omplis aquest camp
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-body-sm text-text-secondary uppercase tracking-wider">Pas 2 de 2</span>
        <h4
          className="text-heading-h2 text-text-main focus:outline-none"
          tabIndex={-1}
          data-autofocus
        >
          Explica&apos;m el teu projecte
        </h4>
        <p className="text-body-md text-text-secondary">
          Et responc en menys de 24 hores feiners.
        </p>
      </div>

      <Field label="Email" required name="email" type="email" autoComplete="email" inputMode="email" placeholder="tu@correu.com" disabled={submitting} />
      <Field label="Nom" name="name" type="text" autoComplete="name" placeholder="El teu nom" disabled={submitting} />

      <ChipGroup
        label="Quan vols arrencar?"
        options={TIMING_OPTIONS}
        selected={timing}
        onSelect={setTiming}
        disabled={submitting}
      />
      <ChipGroup
        label="Pressupost orientatiu"
        options={BUDGET_OPTIONS}
        selected={budget}
        onSelect={setBudget}
        disabled={submitting}
      />

      <label className="flex flex-col gap-2">
        <span className="text-body-sm text-text-secondary uppercase tracking-wider">Missatge (opcional)</span>
        <textarea
          name="message"
          rows={3}
          maxLength={5000}
          placeholder="Què tens ja? Què t'amoïna?"
          disabled={submitting}
          className="w-full bg-surface-card border border-surface-border rounded-md p-4 text-text-main font-sans text-body-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base focus:border-text-main transition-colors placeholder:text-text-secondary/40 resize-y disabled:opacity-50"
        />
      </label>

      {error && (
        <p id={errorId} role="alert" className="text-body-md text-error">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-4">
        <button
          type="submit"
          disabled={submitting}
          aria-describedby={error ? errorId : undefined}
          className="group w-full h-16 bg-primary-main text-text-main-inverse rounded-base text-button-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-main focus-visible:ring-offset-surface-base"
        >
          {submitting ? "Enviant..." : "Enviar i rebre proposta"}
          {!submitting && (
            <ArrowRight size={22} weight="regular" className="group-hover:translate-x-1 transition-transform" />
          )}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="inline-flex items-center justify-center min-h-11 text-body-sm text-text-secondary hover:text-text-main transition-colors w-fit mx-auto rounded-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
        >
          ← Tornar
        </button>
      </div>

      <p className="text-body-sm text-text-secondary">
        En enviar, només guardo el missatge per respondre&apos;t. No el comparteixo.
      </p>
    </form>
  );
}

/* ============================================================
   ESTAT C · Confirmació
   ============================================================ */
function ConfirmationView({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col gap-10 py-2" role="status" aria-live="polite">
      <div className="flex flex-col items-center text-center gap-6">
        <span
          className="flex items-center justify-center w-[72px] h-[72px] rounded-full bg-primary-main text-text-main-inverse"
          aria-hidden="true"
        >
          <Check size={32} weight="bold" />
        </span>
        <div className="flex flex-col gap-3">
          <h4
            className="text-heading-h2 text-text-main focus:outline-none"
            tabIndex={-1}
            data-autofocus
          >
            Missatge enviat.
          </h4>
          <p className="text-body-md text-text-secondary max-w-prose">
            T&apos;he rebut. Responc en menys de 24 hores feiners amb un primer abast i una proposta concreta.
          </p>
        </div>
      </div>

      {/* Què passa ara */}
      <div className="bg-surface-card border border-surface-border rounded-card p-6 flex flex-col gap-5">
        <span className="text-body-sm text-text-secondary uppercase tracking-wider">Què passa ara</span>
        <StepRow index={1} title="Reviso el teu missatge" detail="Avui mateix o demà al matí." />
        <StepRow index={2} title="T'envio una proposta" detail="Abast, fases, timing i pressupost en un PDF curt." />
        <StepRow index={3} title="Decidim plegats com avançar" detail="Si encaixa, agendem el kickoff." />
      </div>

      <TransitionLink
        href="/works"
        onClick={onClose}
        className="inline-flex items-center justify-center gap-1.5 min-h-11 text-body-md text-text-secondary hover:text-text-main transition-colors rounded-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
      >
        Mentrestant, fes una ullada als treballs recents
        <ArrowUpRight size={16} weight="regular" aria-hidden="true" />
      </TransitionLink>
    </div>
  );
}

/* ============================================================
   Subcomponents
   ============================================================ */

function Article({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <h4 className="text-heading-h4 text-text-main">{title}</h4>
      <p className="text-body-lg text-text-secondary whitespace-pre-wrap">{children}</p>
    </div>
  );
}

function MilestoneRow({
  index,
  title,
  meta,
  amount,
}: {
  index: number;
  title: string;
  meta: string;
  amount: string;
}) {
  return (
    <div className="flex items-baseline gap-3 text-body-md text-text-main">
      <span className="shrink-0 w-3 tabular-nums">{index}</span>
      <span className="font-normal">{title}</span>
      {meta ? (
        <span className="hidden sm:inline flex-1 text-text-secondary font-light">{meta}</span>
      ) : (
        <span className="flex-1" aria-hidden="true" />
      )}
      <span className="shrink-0 tabular-nums">{amount}</span>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-body-md text-text-main">
      <span className="font-normal">{label}</span>
      <span className="font-light">{value}</span>
    </div>
  );
}

function StepRow({ index, title, detail }: { index: number; title: string; detail: string }) {
  return (
    <div className="flex items-start gap-4">
      <span
        className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full border border-surface-border text-body-sm text-text-main tabular-nums"
        aria-hidden="true"
      >
        {index}
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-body-md text-text-main">{title}</span>
        <span className="text-body-sm text-text-secondary">{detail}</span>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-body-sm text-text-secondary uppercase tracking-wider">
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
        className="w-full bg-transparent border-b border-text-secondary/40 py-3 text-text-main font-sans text-body-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base focus:border-text-main transition-colors placeholder:text-text-secondary/40 disabled:opacity-50"
      />
    </label>
  );
}

/**
 * ChipGroup — selector de valor únic amb semàntica de radiogroup:
 *  - role="radiogroup" + label associat via aria-labelledby
 *  - cada opció role="radio" amb aria-checked
 *  - roving tabindex (només l'opció activa, o la primera, és tabbable)
 *  - fletxes ←→↑↓ + Home/End naveguen i seleccionen (WAI-ARIA radio pattern)
 *  - target ≥44px (min-h-11)
 */
function ChipGroup({
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
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (idx - 1 + options.length) % options.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = options.length - 1;
    onSelect(options[next]);
    const group = e.currentTarget.parentElement;
    group?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  };

  return (
    <div className="flex flex-col gap-3">
      <span id={labelId} className="text-body-sm text-text-secondary uppercase tracking-wider">
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
              className={`inline-flex items-center min-h-11 px-4 rounded-full text-body-sm border transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base ${
                active
                  ? "bg-primary-main text-text-main-inverse border-primary-main"
                  : "bg-surface-card text-text-secondary border-surface-border hover:border-text-main hover:text-text-main"
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
