"use client";

import { useEffect, useRef, useState, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Check, CaretUp, CaretDown, Plus, ShareNetwork } from "@phosphor-icons/react";
import Button from "@/components/ui/Button";
import ConfirmationSpotlight from "@/components/services/ConfirmationSpotlight";
import { submitQuote, type QuoteProduct } from "@/app/actions/quotes";
import type { Json } from "@/types/database";
import {
  AnimatedTotal,
  useIsClient,
  useMediaQuery,
  ConfigRow,
  Stepper,
  Switch,
  ChipGroup,
  Field,
  SelectField,
  SummaryGroup,
  Accordion,
  RadioList,
  DisciplineChips,
  formatEuro,
  Sheet,
  DependencyConfirm,
} from "./configuratorShared";
import {
  PRODUCTS,
  RECURRENTS,
  PRODUCT_CALL_URL,
  calcConfiguration,
  CONFIG_EXTRAS,
  PACKS,
  groupExtras,
  crossFamilyPacks,
  packStatus,
  disciplineUnlock,
  orderExtrasByFamily,
  decodeConfig,
  shareUrl,
  stripShareParams,
  type SharedConfig,
  DISCIPLINES,
  extraCaption,
  extraPricing,
  extraHelp,
  calcAudit,
  AUDIT_FOCUSES,
  AUDIT_SIZES,
  AUDIT_EXTRAS,
  AUDIT_BASE_INCLUDES,
  AUDIT_DELIVERABLES,
  type Product,
  type ProductId,
  type Discipline,
  type ConfigProduct,
  type ConfigExtraId,
  type ConfigQuote,
  type AuditFocus,
  type AuditQuote,
  type AuditSize,
  RESPONSE_SLA,
} from "@/lib/pricing";
import { EVENTS, trackEvent } from "@/lib/analytics";

/**
 * <ConfiguratorModal />
 *
 * Cortina full-screen per configurar un producte i tancar el lead, en la
 * línia del <ContactModal /> (mateixa cortina, mateix z-index, mateixa
 * arquitectura). Substitueix el configurador dins del ServiceModal 50/50:
 * aquí tota la pantalla treballa per la decisió.
 *
 *   config → presets amb preu (ancoratge) + extres + TOTAL STICKY sempre
 *            visible a la barra inferior amb el CTA
 *   form   → un sol pas de dades (email, nom, timing, missatge opcional);
 *            el pressupost ja el dona la configuració
 *   sent   → confirmació + "Què passa ara"
 *
 * L'auditoria (preu tancat, sense extres) salta directament al form.
 * Driven 100% per pricing.ts. El resum de la configuració s'annexa al
 * missatge de la Server Action `submitContact` — cap columna nova.
 *
 * Arquitectura: l'estat viu a <CurtainContent>, muntat només mentre la
 * cortina és oberta — cada obertura comença de zero sense resets en efectes.
 *
 * A11y (WCAG 2.1 AA): role=dialog + aria-modal, focus-trap, Escape tanca,
 * restauració de focus, focus al heading en canviar de fase, total amb
 * aria-live, radiogroup als presets/chips, targets ≥44px i reduced-motion.
 */

const TIMING_OPTIONS = ["Aquest mes", "1–3 mesos", "Encara ho estic mirant"];
const CLIENT_TYPE_OPTIONS = ["Empresa / marca", "Agència / estudi", "Particular"];
/** Canals d'atribució de "Com m'has conegut?" — es desen a quotes.source. */
const SOURCE_OPTIONS = ["Google", "LinkedIn", "Behance / Dribbble", "Recomanació", "Malt", "Altres"];

/** Validació d'email al client (pre-check d'UX; el servidor és la font de veritat). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Títol estable del header per producte — no muta amb la selecció. */
const PRODUCT_TITLES: Record<ProductId, string> = {
  web: "Configura la teva web",
  landing: "Configura la teva landing",
  auditoria: "Configura la teva auditoria",
};

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

interface ConfiguratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: ProductId | null;
}

export default function ConfiguratorModal({ isOpen, onClose, productId }: ConfiguratorModalProps) {
  // M6 (24set26): un enllaç compartit (`/serveis/web?d=…&m=…`) obre el
  // configurador sol, amb la selecció carregada. Només a l'spoke del producte;
  // el modal s'obre sense que la vista pare n'hagi de saber res. Es llegeix un
  // cop, en muntar (a SSR no hi ha window i el portal no es pinta igualment).
  const [shared, setShared] = useState<SharedConfig | null>(() => {
    if (typeof window === "undefined") return null;
    if (productId !== "web" && productId !== "landing") return null;
    if (window.location.pathname !== `/serveis/${productId}`) return null;
    return decodeConfig(window.location.search);
  });
  const [sharedOpen, setSharedOpen] = useState(shared !== null);
  const open = isOpen || sharedOpen;
  const close = () => {
    if (sharedOpen) {
      setSharedOpen(false);
      setShared(null);
      window.history.replaceState(window.history.state, "", stripShareParams(window.location.href));
    }
    onClose();
  };

  // Obertura del configurador: un sol event per obertura, amb el producte.
  const openedRef = useRef(false);
  useEffect(() => {
    if (open && !openedRef.current) {
      openedRef.current = true;
      trackEvent(EVENTS.configuratorOpen, { product: productId ?? "desconegut" });
    }
    if (!open) openedRef.current = false;
  }, [open, productId]);

  const isClient = useIsClient();
  const reduce = useReducedMotion();

  const product = productId ? PRODUCTS.find((p) => p.id === productId) ?? null : null;

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {open && product && (
        <motion.div
          key="configurator-curtain"
          initial={reduce ? { opacity: 0 } : { y: "-100%" }}
          animate={reduce ? { opacity: 1 } : { y: 0 }}
          exit={reduce ? { opacity: 0 } : { y: "-100%" }}
          transition={{ duration: reduce ? 0.2 : 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[110] h-[100dvh] w-full bg-surface-base text-text-main"
        >
          <CurtainContent product={product} onClose={close} shared={shared} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

type Phase = "config" | "form" | "sent";

function CurtainContent({
  product,
  onClose,
  shared,
}: {
  product: Product;
  onClose: () => void;
  /** M6: selecció d'un enllaç compartit (només web i landing). */
  shared?: SharedConfig | null;
}) {
  // Web i landing es configuren pel mateix motor (rols); auditoria salta al form.
  const configProduct: ConfigProduct | null =
    product.id === "web" ? "web" : product.id === "landing" ? "landing" : null;
  const isAudit = product.id === "auditoria";
  const configurable = configProduct !== null || isAudit;
  const reduce = useReducedMotion();

  const [phase, setPhase] = useState<Phase>(configurable ? "config" : "form");
  // Dades mostrades a la confirmació (email introduït + referència real del quote).
  const [sentInfo, setSentInfo] = useState<{ email: string; ref: string | null }>({
    email: "",
    ref: null,
  });
  // Mòbil: el config es parteix en 3 sub-passos (wizard); desktop segueix en una
  // sola pantalla de 3 columnes. mobileStep només s'usa quan mobileWizard.
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [mobileStep, setMobileStep] = useState(0);
  // Web / landing (calcConfiguration)
  const [disciplines, setDisciplines] = useState<Discipline[]>(shared?.disciplines ?? ["ux", "ui", "dev"]);
  // 3 toggles independents, tots encesos per defecte (àncora en abast complet:
  // l'usuari treu, no afegeix). Mínim 1: no es pot desmarcar l'últim actiu.
  const toggleDiscipline = (d: Discipline) =>
    setDisciplines((prev) =>
      prev.includes(d)
        ? prev.length === 1
          ? prev
          : prev.filter((x) => x !== d)
        : [...prev, d],
    );
  /**
   * UN sol estat per a TOTS els mòduls: `{ pagina: 2, seo: 1, ... }`. Els
   * booleans hi viuen com a 0/1. Abans hi havia un useState per extra i la
   * pantalla els pintava un per un, així que els vuit mòduls del pla modular
   * es van quedar sense interfície. Amb un mapa, afegir un mòdul torna a ser
   * només tocar el catàleg de `pricing.ts`.
   */
  const [extraVals, setExtraVals] = useState<Partial<Record<ConfigExtraId, number>>>(shared?.extras ?? {});

  // M6 (24set26): compartir la selecció. Mateix patró que /works
  // (useShareWork): menú natiu on n'hi ha; si no, copia l'enllaç i ho diu.
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);
  const shareConfig = async () => {
    if (!configProduct) return;
    const url = shareUrl(window.location.origin, configProduct, { disciplines, extras: extraVals });
    const track = (method: string) =>
      trackEvent(EVENTS.share, { method, content_type: "configuration", item_id: configProduct });
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: PRODUCT_TITLES[product.id], url });
        track("native");
      } catch {
        // L'usuari ha tancat el menú: no és un error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
      track("copy_link");
    } catch {
      // Sense permís de porta-retalls: no fingim que s'ha copiat.
    }
  };
  const shareAction = configProduct ? { onShare: shareConfig, copied } : undefined;
  const setExtra = (id: ConfigExtraId, value: number) =>
    setExtraVals((prev) => ({ ...prev, [id]: value }));
  const n = (id: ConfigExtraId) => extraVals[id] ?? 0;
  // Auditoria (calcAudit): focus multi-selecció + talla + extres
  const [focuses, setFocuses] = useState<AuditFocus[]>(["ux", "ui", "dev"]);
  const [auditSize, setAuditSize] = useState<AuditSize>("s");
  const [auditExtrasOn, setAuditExtrasOn] = useState<Record<string, boolean>>({});
  // Estat del formulari (pas 2) — usat pel layout unificat desktop web/landing,
  // on el Resum és persistent i llisca entre passos. (Audit/mòbil usen <LeadForm/>.)
  const [timing, setTiming] = useState<string | null>(null);
  const [clientType, setClientType] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [acceptError, setAcceptError] = useState(false);
  const errorId = useId();
  const acceptErrorId = useId();

  const dialogRef = useRef<HTMLDivElement>(null);
  const isFirstFocus = useRef(true);

  // Scroll-lock + restauració de focus al trigger en desmuntar.
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

  // Focus inicial al dialog; en canviar de fase, al heading nou.
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
  }, [phase, mobileStep]);

  // Focus-trap.
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

  // ————— Càlcul (font de veritat: pricing.ts) —————

  // Els cinc extres del v1 conserven el seu camp propi a ConfigSelection (per
  // no trencar el model ni els tests); la resta viatgen pel canal `modules`.
  const quote = configProduct
    ? calcConfiguration({
        product: configProduct,
        disciplines,
        pages: n("pagina"),
        languages: n("idioma"),
        motion: n("motion") > 0,
        cms: n("cms") > 0,
        redaccio: n("redaccio") > 0,
        modules: Object.fromEntries(
          (Object.keys(extraVals) as ConfigExtraId[])
            .filter((id) => !V1_EXTRA_IDS.includes(id))
            .map((id) => [id, extraVals[id]]),
        ),
      })
    : null;

  const auditQuote = isAudit
    ? calcAudit({
        focuses: focuses.length ? focuses : ["ux"],
        size: auditSize,
        extras: Object.keys(auditExtrasOn).filter((k) => auditExtrasOn[k]),
      })
    : null;

  const total = quote ? quote.total : auditQuote ? auditQuote.total : product.price;

  // ————— Navegació del wizard mòbil —————
  // Web/landing es parteix en 3 sub-passos; auditoria en 4 (focus+base+cobreix,
  // mida, extres, resum). Desktop segueix en una pantalla per a tots.
  const mobileWizard = isMobile && configurable;
  // Layout unificat (Resum persistent que llisca) només a web/landing desktop.
  const runDesktop = !isMobile && configProduct !== null;
  // Web/landing: 2 sub-passos (Tipus+Base → Extres) + dades = 3 passos.
  // Auditoria: 3 (Tipus+Base+Cobreix → Abast → Extres) + dades = 4. El pas
  // Resum s'ha retirat a tots dos: el desglòs s'obre des del total del peu (24set26).
  const CONFIG_SUBSTEPS = configProduct ? 2 : 3;
  const totalSteps = mobileWizard ? CONFIG_SUBSTEPS + 1 : 2;
  const currentStep =
    phase === "config" ? (mobileWizard ? mobileStep + 1 : 1) : mobileWizard ? totalSteps : 2;
  const showBack =
    isMobile && ((phase === "form" && configurable) || (phase === "config" && mobileStep > 0));

  const goBack = () => {
    if (phase === "form") {
      setPhase("config");
      if (mobileWizard) setMobileStep(CONFIG_SUBSTEPS - 1);
    } else if (phase === "config" && mobileStep > 0) {
      setMobileStep((s) => s - 1);
    }
  };
  const advanceConfig = () => {
    if (mobileWizard && mobileStep < CONFIG_SUBSTEPS - 1) setMobileStep((s) => s + 1);
    else {
      setPhase("form");
      trackEvent(EVENTS.configuratorStep, { product: product.id, step: "form" });
    }
  };

  // Recap compacte per al pas de dades en mòbil (el Resum queda un pas enrere).
  const recap = (
    auditQuote
      ? [
          product.name,
          auditQuote.focuses.map((f) => f.id.toUpperCase()).join(" + "),
          auditQuote.extras.length > 0 ? `${auditQuote.extras.length} extres` : null,
          formatEuro(total),
        ]
      : [
          product.name,
          quote?.scopeLabel,
          // Les línies de pack són descomptes, no extres (24set26).
          quote && quote.extras.some((e) => !e.id.startsWith("pack-"))
            ? `${quote.extras.filter((e) => !e.id.startsWith("pack-")).length} extres`
            : null,
          formatEuro(total),
        ]
  )
    .filter(Boolean)
    .join(" · ");

  // Payload per desar a `quotes` (snapshot). selection = tria crua; pricing = càlcul.
  const quoteSelection: Json = auditQuote
    ? {
        focuses,
        size: auditSize,
        extras: Object.keys(auditExtrasOn).filter((k) => auditExtrasOn[k]),
      }
    : {
        disciplines,
        pages: n("pagina"),
        languages: n("idioma"),
        motion: n("motion") > 0,
        cms: n("cms") > 0,
        redaccio: n("redaccio") > 0,
        modules: Object.fromEntries(
          (Object.keys(extraVals) as ConfigExtraId[])
            .filter((id) => !V1_EXTRA_IDS.includes(id))
            .map((id) => [id, extraVals[id]]),
        ),
      };
  const quotePricing = (
    auditQuote
      ? {
          baseTotal: auditQuote.baseTotal,
          sizeIncrement: auditQuote.sizeIncrement,
          extras: auditQuote.extras,
          extrasTotal: auditQuote.extrasTotal,
          total: auditQuote.total,
          focuses: auditQuote.focuses.map((f) => f.id),
        }
      : quote
        ? {
            baseTotal: quote.baseTotal,
            phases: quote.phases,
            extras: quote.extras,
            extrasTotal: quote.extrasTotal,
            total: quote.total,
          }
        : {}
  ) as unknown as Json;

  // Mateix model que les disciplines de la web (24set26): toggles independents,
  // mínim un d'encès; «Tot» vol dir els tres encesos.
  const toggleFocus = (f: AuditFocus) =>
    setFocuses((prev) => {
      if (prev.includes(f)) return prev.length === 1 ? prev : prev.filter((x) => x !== f);
      return AUDIT_FOCUSES.map((x) => x.id).filter((id) => id === f || prev.includes(id));
    });

  /** Resum llegible de la configuració, annexat al missatge del formulari. */
  /** Import d'una línia d'extra amb signe. Els packs tenen import negatiu i
   *  amb un "+" fix sortia "+-90 €" al correu que rep el client. */
  const signedEuro = (n: number) =>
    n < 0 ? `\u2212${formatEuro(Math.abs(n))}` : `+${formatEuro(n)}`;

  const buildSummary = () => {
    if (auditQuote) {
      const lines = [
        `Configuració: Auditoria · ${auditQuote.focuses.map((f) => f.label).join(" + ")}`,
        `· Base (${auditQuote.focuses.length} focus): ${formatEuro(auditQuote.baseTotal)}`,
        `· Abast: ${auditQuote.size.label}${
          auditQuote.sizeIncrement ? ` (+${formatEuro(auditQuote.sizeIncrement)})` : " (inclòs)"
        }`,
        ...auditQuote.extras.map((e) => `· ${e.label}: ${signedEuro(e.amount)}`),
        `Total orientatiu: ${formatEuro(auditQuote.total)}`,
      ];
      return lines.join("\n");
    }
    if (!quote) {
      return `Producte: ${product.name} · ${formatEuro(product.price)} (preu tancat)`;
    }
    const lines = [
      `Configuració: ${product.name} · ${quote.scopeLabel}`,
      ...quote.phases.map((p, i) => `· Fase ${i + 1} · ${p.label}: ${formatEuro(p.amount)}`),
      `· Total base: ${formatEuro(quote.baseTotal)}`,
      ...quote.extras.map((e) => `· ${e.label}: ${signedEuro(e.amount)}`),
      `Total orientatiu: ${formatEuro(quote.total)}`,
    ];
    return lines.join("\n");
  };

  const phaseTransition = { duration: reduce ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] as const };

  const stepLabel =
    phase === "config"
      ? isAudit
        ? "Pas 1 de 2 · Tipus d’auditoria, abast i extres"
        : "Pas 1 de 2 · Tipus de projecte i extres"
      : phase === "form"
        ? configurable
          ? "Pas 2 de 2 · Brief i dades"
          : `Explica’m el teu projecte. Et responc en menys de ${RESPONSE_SLA}.`
        : null;

  // ————— Submit del layout unificat (web/landing desktop) —————
  const handleRunSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phase === "config") {
      advanceConfig();
      return;
    }
    const formEl = e.currentTarget;
    const data = new FormData(formEl);
    const email = String(data.get("email") || "").trim();
    const name = String(data.get("name") || "");
    const userMessage = String(data.get("message") || "").trim();
    const source = String(data.get("source") || "").trim();
    const website = String(data.get("website") || ""); // honeypot

    if (!EMAIL_RE.test(email)) {
      setEmailError("Escriu un email vàlid.");
      formEl.querySelector<HTMLInputElement>('input[name="email"]')?.focus();
      return;
    }
    setEmailError(null);
    if (!accepted) {
      setAcceptError(true);
      formEl.querySelector<HTMLInputElement>('input[name="accept"]')?.focus();
      return;
    }

    const message = [
      `Proposta sol·licitada per: ${product.name}`,
      `\n${buildSummary()}`,
      timing ? `\nQuan vol arrencar: ${timing}` : null,
      clientType ? `\nTipus de client: ${clientType}` : null,
      userMessage ? `\nMissatge:\n${userMessage}` : null,
      `\n— [via configurador /serveis]`,
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
      source: source || null,
      product: product.id as QuoteProduct,
      selection: quoteSelection,
      pricing: quotePricing,
      totalEur: total,
      breakdown: buildSummary(),
    });
    setSubmitting(false);
    if (res.status === "ok") {
      setSentInfo({ email, ref: res.ref });
      setPhase("sent");
      trackEvent(EVENTS.configuratorSubmit, { product: product.id });
    } else setError(res.message);
  };

  const consentField = (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="accept"
          checked={accepted}
          onChange={(e) => {
            setAccepted(e.target.checked);
            if (e.target.checked) setAcceptError(false);
          }}
          disabled={submitting}
          aria-invalid={acceptError || undefined}
          aria-describedby={acceptError ? acceptErrorId : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 rounded-[4px] border border-border-default accent-primary-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
        />
        <span className="text-body-xs-light md:text-body-s-light text-text-secondary">
          Autoritzo l&apos;ús de les meves dades perquè em contactin i em preparin la
          proposta. No es faran servir per a res més ni es compartiran amb tercers, tal
          com detalla la{" "}
          <span className="font-semibold text-text-primary">Política de privacitat</span>.
        </span>
      </label>
      {acceptError && (
        <p id={acceptErrorId} role="alert" className="text-body-xs-light md:text-body-s-light text-error">
          Has d&apos;acceptar les condicions per continuar.
        </p>
      )}
    </div>
  );

  // Confirmació: pren tot el viewport (portal) amb l'efecte de focus.
  if (phase === "sent") {
    return (
      <ConfirmationSpotlight
        email={sentInfo.email}
        reference={sentInfo.ref}
        callUrl={PRODUCT_CALL_URL}
        worksHref="/works"
        onClose={onClose}
      />
    );
  }

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
      {/* === HEADER: tancar + títol (esq.) + indicador de pas (dreta) === */}
      <header className="flex shrink-0 items-center justify-between gap-6 border-b border-border-subtle px-6 py-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={showBack ? goBack : onClose}
            className="-m-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-main transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
            aria-label={showBack ? "Enrere" : "Tancar"}
          >
            {showBack ? <ArrowLeft size={20} weight="regular" /> : <X size={20} weight="regular" />}
          </button>
          <h2 id="configurator-title" className="text-body-s font-medium normal-case text-text-main">
            {PRODUCT_TITLES[product.id]}
          </h2>
        </div>
        <div className="lg:hidden">
          <StepProgress current={currentStep} total={totalSteps} />
        </div>
        {stepLabel && (
          <p className="hidden text-caption text-text-secondary lg:block">{stepLabel}</p>
        )}
      </header>

      {runDesktop && (phase === "config" || phase === "form") ? (
        /* ——— LAYOUT UNIFICAT (web/landing desktop): el Resum és persistent i
            llisca de la dreta (config) a l'esquerra (form) amb layout="position";
            el bloc d'input es creua al voltant amb subgrid. Un sol <form>. ——— */
        <form onSubmit={handleRunSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <label
            aria-hidden="true"
            className="absolute -left-[9999px] h-px w-px overflow-hidden"
            tabIndex={-1}
          >
            No omplis aquest camp
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>

          {/* SCROLL PER COLUMNA a partir de lg. Amb dotze mòduls, un sol scroll
              per a tot estirava la pàgina i se'n duia el Resum fora de
              pantalla, que és el que ha de quedar a la vista mentre el client
              afegeix mòduls i el total puja. Sota lg les columnes s'apilen i
              torna a manar un sol scroll. */}
          <div className="min-h-0 flex-1 overflow-x-clip overflow-y-auto overscroll-contain px-6 md:px-12 lg:overflow-y-hidden">
            <div className="mx-auto grid w-full max-w-[1728px] grid-cols-1 gap-10 py-6 md:py-10 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_580px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-12 lg:py-0">
              {/* RESUM persistent — no es desmunta mai; només se n'anima la posició.
                  Del pas 1 al 2 llisca de la dreta (col 3) a l'esquerra (col 1), lent,
                  empenyent cap a fora les columnes de config. */}
              <motion.aside
                layout="position"
                transition={{ layout: { duration: reduce ? 0 : 0.8, ease: [0.65, 0, 0.35, 1] } }}
                aria-label="Resum"
                // Padding horitzontal SIMÈTRIC (lg:px-6) perquè el contingut no
                // faci un salt de ~48px quan es canvia el costat del divisor
                // durant el lliscament (layout="position" no anima el padding).
                // Només flipem el border (línia divisòria) segons la fase.
                className={`flex flex-col gap-6 lg:row-start-1 lg:border-border-subtle lg:px-6 lg:min-h-0 lg:overflow-y-auto lg:overscroll-none lg:pb-10 lg:[&>*]:shrink-0 ${
                  phase === "config"
                    ? "lg:col-start-3 lg:border-l"
                    : "lg:col-start-1 lg:border-r"
                }`}
              >
                {quote && (
                  <>
                    <div className="flex flex-col">
                      <h3 className="sticky top-0 z-10 border-b border-border-subtle bg-surface-base py-5 text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium lg:pt-15 text-text-main">
                        3. Resum
                      </h3>
                      <SummaryGroup
                        title="Total Base"
                        amount={quote.baseTotal}
                        defaultOpen={false}
                        lines={quote.phases.map((p, i) => ({
                          label: `Fase ${i + 1} · ${p.label}`,
                          amount: p.amount,
                        }))}
                      />
                      {quote.extras.length > 0 && (
                        <SummaryGroup
                          title="Extres"
                          amount={quote.extrasTotal}
                          defaultOpen={false}
                          lines={orderExtrasByFamily(quote.extras).map((e) => ({ label: e.label, amount: e.amount }))}
                        />
                      )}
                      <div className="flex items-center gap-6 py-5">
                        <span className="flex-1 text-display-2xs-medium lg:text-display-xs-medium text-text-main">Total</span>
                        <span className="text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium text-text-main tabular-nums">
                          <span aria-hidden="true">
                            <AnimatedTotal value={total} />
                          </span>
                          <span className="sr-only" aria-live="polite">
                            Total orientatiu: {formatEuro(total)}
                          </span>
                        </span>
                      </div>
                    </div>
                    <NotIncludedNote />
                  </>
                )}
              </motion.aside>

              {/* BLOC D'INPUT — config (cols 1-2) ↔ formulari (cols 2-3), subgrid.
                  Sense mode="wait": sortint i entrant es creuen → slide horitzontal
                  (config surt per l'esquerra mentre el form entra per la dreta). */}
              <AnimatePresence initial={false}>
                {phase === "config" && quote ? (
                  <motion.div
                    key="run-config"
                    initial={{ x: reduce ? 0 : "-100%" }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: reduce ? 0 : "-100%", opacity: 0 }}
                    // Corba COMPARTIDA entrada/sortida perquè les dues columnes
                    // creuin sincronitzades (posicions mirall). Ease-in-out en lloc
                    // d'expo-out per treure la cua/frenada llarga del final.
                    transition={{ duration: reduce ? 0 : 0.8, ease: [0.65, 0, 0.35, 1] }}
                    className="flex flex-col gap-10 lg:col-start-1 lg:col-end-3 lg:row-start-1 lg:grid lg:h-full lg:min-h-0 lg:grid-cols-subgrid lg:grid-rows-[minmax(0,1fr)] lg:gap-12"
                  >
                    <TipusBaseSection
                      quote={quote}
                      disciplines={disciplines}
                      onToggle={toggleDiscipline}
                      shared={shared != null}
                      stepIndex={1}
                      className="lg:border-r lg:border-border-subtle lg:pr-6 lg:min-h-0 lg:overflow-y-auto lg:overscroll-none lg:pb-10 lg:[&>*]:shrink-0"
                    />
                    <ExtresSection
                      quote={quote}
                      product={configProduct!}
                      values={extraVals}
                      onChange={setExtra}
                      disciplines={disciplines}
                      onAddDiscipline={toggleDiscipline}
                      stepIndex={2}
                      className="lg:min-h-0 lg:overflow-y-auto lg:overscroll-none lg:pr-6 lg:pb-10 lg:[&>*]:shrink-0"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="run-form"
                    initial={{ x: reduce ? 0 : "100%" }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: reduce ? 0 : "100%", opacity: 0 }}
                    // Mateixa corba compartida que el bloc config (creuament sincronitzat).
                    transition={{ duration: reduce ? 0 : 0.8, ease: [0.65, 0, 0.35, 1] }}
                    className="flex flex-col gap-10 lg:col-start-2 lg:col-end-4 lg:row-start-1 lg:grid lg:h-full lg:min-h-0 lg:grid-cols-subgrid lg:grid-rows-[minmax(0,1fr)] lg:gap-12"
                  >
                    <section
                      aria-label="El brief"
                      className="flex flex-col gap-6 lg:border-r lg:border-border-subtle lg:pr-6"
                    >
                      <h3
                        className="border-b border-border-subtle py-5 text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium text-text-main focus:outline-none"
                        data-autofocus
                        tabIndex={-1}
                      >
                        El brief
                      </h3>
                      <ChipGroup
                        label="Quan vols arrencar?"
                        options={TIMING_OPTIONS}
                        selected={timing}
                        onSelect={setTiming}
                        disabled={submitting}
                      />
                      <ChipGroup
                        label="Amb qui parlo?"
                        options={CLIENT_TYPE_OPTIONS}
                        selected={clientType}
                        onSelect={setClientType}
                        disabled={submitting}
                      />
                      <label className="flex flex-col gap-2">
                        <span className="text-label text-text-secondary">Vols deixar un missatge?</span>
                        <textarea
                          name="message"
                          rows={6}
                          maxLength={5000}
                          placeholder="Context, objectius, referències… el que ajudi a entendre el projecte."
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
                    <section aria-label="Les dades" className="flex flex-col gap-8">
                      <h3 className="border-b border-border-subtle py-5 text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium text-text-main">
                        Les dades
                      </h3>
                      <Field
                        label="El teu correu"
                        required
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        placeholder="tu@correu.com"
                        error={emailError}
                        disabled={submitting}
                      />
                      <Field
                        label="El teu nom"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Nom i cognom"
                        disabled={submitting}
                      />
                      <SelectField
                        label="Com m’has conegut?"
                        name="source"
                        options={SOURCE_OPTIONS}
                        placeholder="Selecciona una opció"
                        disabled={submitting}
                      />
                      {consentField}
                    </section>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <footer className="shrink-0 border-t border-border-subtle bg-surface-base px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="flex w-full flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between md:gap-8">
              <p className="text-caption text-text-secondary">
                El total és orientatiu: el tanquem junts a la proposta. O{" "}
                <a
                  href={PRODUCT_CALL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 transition-colors hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
                >
                  reserva una trucada de 20 min
                  <span className="sr-only"> (s&apos;obre en una pestanya nova)</span>
                </a>
                .
              </p>
              {phase === "config" ? (
                <Button
                  variant="solid"
                  shape="pill"
                  size="xl"
                  type="submit"
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
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setPhase("config")}
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
                    {submitting ? "Enviant..." : "Enviar i rebre proposta"}
                  </Button>
                </div>
              )}
            </div>
          </footer>
        </form>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
        {phase === "config" && quote && !runDesktop && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -12 }}
            transition={phaseTransition}
            className="flex min-h-0 flex-1 flex-col"
          >
            {mobileWizard ? (
              /* ——— MÒBIL/TAULETA · 2 sub-passos (Tipus+Base → Extres); el Resum és al full del peu ——— */
              <>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-6 md:px-12">
                  <motion.div
                    key={mobileStep}
                    initial={{ opacity: 0, x: reduce ? 0 : 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={phaseTransition}
                    className="mx-auto flex w-full max-w-6xl flex-col py-6"
                  >
                    {mobileStep === 0 && (
                      <TipusBaseSection
                        quote={quote}
                        disciplines={disciplines}
                        onToggle={toggleDiscipline}
                        shared={shared != null}
                      />
                    )}
                    {mobileStep === 1 && (
                      <ExtresSection
                      quote={quote}
                      product={configProduct!}
                      values={extraVals}
                      onChange={setExtra}
                      disciplines={disciplines}
                      onAddDiscipline={toggleDiscipline}
                      />
                    )}
                    {mobileStep >= 1 && <MobileReassurance />}
                  </motion.div>
                </div>
                <MobileTotalFooter
                  total={total}
                  cta="Continua"
                  onCta={advanceConfig}
                  breakdown={
                    <ResumSection quote={quote} total={total} baseOpen={false} showTotal={false} showTitle={false} share={shareAction} />
                  }
                />
              </>
            ) : (
              /* ——— DESKTOP · una pantalla, 3 columnes ——— */
              <>
                {/* SCROLL PER COLUMNA a partir de lg. Amb dotze mòduls, un sol
                    scroll per a tot estirava la pàgina i se'n duia el Resum
                    fora de pantalla, que és justament el que ha de quedar a la
                    vista mentre el client afegeix mòduls. Sota lg torna a ser
                    un sol scroll: les columnes s'apilen i no hi ha res a fixar. */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 md:px-12 lg:overflow-hidden">
                  <div className="mx-auto grid w-full max-w-[1728px] grid-cols-1 gap-10 py-6 md:py-10 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_580px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-12 lg:py-0">
                    <TipusBaseSection
                      quote={quote}
                      disciplines={disciplines}
                      onToggle={toggleDiscipline}
                      shared={shared != null}
                      className="lg:border-r lg:border-border-subtle lg:pr-6 lg:min-h-0 lg:overflow-y-auto lg:overscroll-none lg:pb-10 lg:[&>*]:shrink-0"
                    />
                    <ExtresSection
                      quote={quote}
                      product={configProduct!}
                      values={extraVals}
                      onChange={setExtra}
                      disciplines={disciplines}
                      onAddDiscipline={toggleDiscipline}
                      className="lg:min-h-0 lg:overflow-y-auto lg:overscroll-none lg:pr-6 lg:pb-10 lg:[&>*]:shrink-0"
                    />
                    <ResumSection
                      quote={quote}
                      total={total}
                      baseOpen={false}
                      showTotal
                      share={shareAction}
                      className="lg:border-l lg:border-border-subtle lg:pl-6 lg:min-h-0 lg:overflow-y-auto lg:overscroll-none lg:pb-10 lg:[&>*]:shrink-0"
                    />
                  </div>
                </div>

                <footer className="shrink-0 border-t border-border-subtle bg-surface-base px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                  <div className="flex w-full flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between md:gap-8">
                    <p className="text-caption text-text-secondary">
                      El total és orientatiu: el tanquem junts a la proposta. O{" "}
                      <a
                        href={PRODUCT_CALL_URL}
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
                      onClick={advanceConfig}
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
              </>
            )}
          </motion.div>
        )}

        {phase === "config" && auditQuote && (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -12 }}
            transition={phaseTransition}
            className="flex min-h-0 flex-1 flex-col"
          >
            {mobileWizard ? (
              /* ——— MÒBIL/TAULETA · wizard auditoria: Focus+Base+Cobreix → Abast → Extres; el Resum és al full del peu ——— */
              <>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-6 md:px-12">
                  <motion.div
                    key={mobileStep}
                    initial={{ opacity: 0, x: reduce ? 0 : 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={phaseTransition}
                    className="mx-auto flex w-full max-w-6xl flex-col py-6"
                  >
                    {mobileStep === 0 && (
                      <div className="flex flex-col gap-10">
                        <div className="flex flex-col gap-4">
                          <div className="pt-1">
                            <h3
                              className="text-display-2xs-medium lg:text-display-xs-medium text-text-main focus:outline-none"
                              data-autofocus
                              tabIndex={-1}
                            >
                              Tipus d’auditoria
                            </h3>
                          </div>
                          <DisciplineChips disciplines={focuses} onToggle={toggleFocus} label="Tipus d’auditoria" />
                        </div>
                        <div className="flex flex-col">
                          <div className="border-b border-border-subtle py-5">
                            <h3 className="text-body-s font-medium text-text-main">
                              Base.
                              <span className="font-normal text-text-secondary"> Sempre inclosa</span>
                            </h3>
                          </div>
                          {AUDIT_BASE_INCLUDES.map((item) => (
                            <p
                              key={item}
                              className="border-b border-border-subtle py-4 text-body-xs-light md:text-body-s-light text-text-main"
                            >
                              {item}
                            </p>
                          ))}
                        </div>
                        <div className="flex flex-col gap-1">
                          <h3 className="text-display-2xs-medium lg:text-display-xs-medium text-text-main">Què cobreix</h3>
                          {auditQuote.focuses.map((f) => (
                            <Accordion
                              key={f.id}
                              title={f.id.toUpperCase()}
                              level="h4"
                              defaultOpen={false}
                              indent
                            >
                              {f.covers.map((c) => (
                                <p
                                  key={c}
                                  className="border-t border-border-subtle py-3 text-body-xs-light md:text-body-s-light text-text-main"
                                >
                                  {c}
                                </p>
                              ))}
                            </Accordion>
                          ))}
                        </div>
                      </div>
                    )}
                    {mobileStep === 1 && (
                      <div className="flex flex-col gap-3">
                        <h3
                          className="text-display-2xs-medium lg:text-display-xs-medium text-text-main focus:outline-none"
                          data-autofocus
                          tabIndex={-1}
                        >
                          Abast
                        </h3>
                        <RadioList
                          ariaLabel="Abast de l’auditoria"
                          options={AUDIT_SIZES.map((s) => ({
                            id: s.id,
                            label: s.label,
                            detail: s.range,
                            meta: s.increment ? `+${s.increment} €` : "inclòs",
                          }))}
                          value={auditSize}
                          onChange={(id) => setAuditSize(id as AuditSize)}
                        />
                      </div>
                    )}
                    {mobileStep === 2 && (
                      <div className="flex flex-col">
                        <h3
                          className="sticky top-0 z-10 border-b border-border-subtle bg-surface-base py-5 text-display-2xs-medium lg:text-display-xs-medium text-text-main focus:outline-none"
                          data-autofocus
                          tabIndex={-1}
                        >
                          Extres
                        </h3>
                        {AUDIT_EXTRAS.map((e) => (
                          <ConfigRow key={e.id} label={e.label} caption={`+${e.price} €`} help={e.help}>
                            <Switch
                              label={e.label}
                              checked={!!auditExtrasOn[e.id]}
                              onChange={(v) => setAuditExtrasOn((p) => ({ ...p, [e.id]: v }))}
                            />
                          </ConfigRow>
                        ))}
                      </div>
                    )}
                    {mobileStep >= 1 && <MobileReassurance />}
                  </motion.div>
                </div>
                <MobileTotalFooter
                  total={total}
                  cta="Continua"
                  onCta={advanceConfig}
                  breakdown={
                    <>
                      <AuditResumRows auditQuote={auditQuote} />
                      <NotIncludedNote className="mt-8" />
                    </>
                  }
                />
              </>
            ) : (
              /* ——— DESKTOP · una pantalla, 3 columnes ——— */
              <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 md:px-12">
              <div className="mx-auto grid w-full max-w-[1728px] grid-cols-1 gap-10 py-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_556px_minmax(0,1fr)] lg:gap-12">
                {/* Figma 12516-15446 (24set26): el focus, la Base i «Què cobreix» a
                    l'esquerra (com la web); Abast i Extres al mig; Resum a la dreta. */}
                {/* COLUMNA A — Tipus d'auditoria + Base + Què cobreix */}
                <section
                  aria-label="Tipus d’auditoria i base inclosa"
                  className="flex flex-col gap-10 lg:border-r lg:border-border-subtle lg:pr-6"
                >
                  <div className="flex flex-col gap-6">
                    <h3 className="text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium text-text-main focus:outline-none" data-autofocus tabIndex={-1}>
                      1. Tipus d’auditoria
                    </h3>
                    <DisciplineChips disciplines={focuses} onToggle={toggleFocus} label="Tipus d’auditoria" />
                  </div>
                  <div className="flex flex-col">
                    <div className="border-b border-border-subtle py-5">
                      <h4 className="text-body-s font-medium text-text-main">
                        Base.
                        <span className="font-normal"> Sempre inclosa</span>
                      </h4>
                    </div>
                    {AUDIT_BASE_INCLUDES.map((item) => (
                      <p
                        key={item}
                        className="border-b border-border-subtle py-4 text-body-xs-light md:text-body-s-light text-text-main"
                      >
                        {item}
                      </p>
                    ))}
                    {auditQuote.focuses.map((f) => (
                      <Accordion key={f.id} title={`Què cobreix ${f.id.toUpperCase()}`} level="h4" defaultOpen={false}>
                        {f.covers.map((c) => (
                          <p
                            key={c}
                            className="border-t border-border-subtle py-3 text-body-xs-light md:text-body-s-light text-text-main"
                          >
                            {c}
                          </p>
                        ))}
                      </Accordion>
                    ))}
                  </div>
                </section>

                {/* COLUMNA B — Abast + Extres */}
                <section aria-label="Abast i extres" className="flex flex-col gap-10">
                  <div className="flex flex-col gap-6">
                    <h3 className="text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium text-text-main">2. Abast</h3>
                    <RadioList
                      ariaLabel="Abast de l’auditoria"
                      options={AUDIT_SIZES.map((s) => ({
                        id: s.id,
                        label: s.label,
                        detail: s.range,
                        meta: s.increment ? `+${s.increment} €` : "inclòs",
                      }))}
                      value={auditSize}
                      onChange={(id) => setAuditSize(id as AuditSize)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="border-b border-border-subtle pb-5 text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium text-text-main">
                      3. Extres
                    </h3>
                    {AUDIT_EXTRAS.map((e) => (
                      <ConfigRow key={e.id} label={e.label} caption={`+${e.price} €`} help={e.help}>
                        <Switch
                          label={e.label}
                          checked={!!auditExtrasOn[e.id]}
                          onChange={(v) => setAuditExtrasOn((p) => ({ ...p, [e.id]: v }))}
                        />
                      </ConfigRow>
                    ))}
                  </div>
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
                    <AuditResumRows auditQuote={auditQuote} />
                    <div className="border-b border-border-subtle">
                      <Accordion title="Lliurables" level="h4" defaultOpen={false}>
                        {AUDIT_DELIVERABLES.map((d) => (
                          <p
                            key={d}
                            className="border-b border-border-subtle py-3 text-body-xs-light md:text-body-s-light text-text-secondary"
                          >
                            {d}
                          </p>
                        ))}
                      </Accordion>
                    </div>
                    <div className="flex items-center gap-6 py-5">
                      <span className="flex-1 text-display-2xs-medium lg:text-display-xs-medium text-text-main">Total</span>
                      <span className="text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium text-text-main tabular-nums">
                        <span aria-hidden="true">
                          <AnimatedTotal value={total} />
                        </span>
                        <span className="sr-only" aria-live="polite">
                          Total orientatiu: {formatEuro(total)}
                        </span>
                      </span>
                    </div>
                  </div>
                  <NotIncludedNote />
                </aside>
              </div>
            </div>

            <footer className="shrink-0 border-t border-border-subtle bg-surface-base px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="flex w-full flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between md:gap-8">
                <p className="text-caption text-text-secondary">
                  El total és orientatiu: el tanquem junts a la proposta. O{" "}
                  <a
                    href={PRODUCT_CALL_URL}
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
                  onClick={advanceConfig}
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
              </>
            )}
          </motion.div>
        )}

        {phase === "form" && !runDesktop && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -12 }}
            transition={phaseTransition}
            className="flex min-h-0 flex-1 flex-col"
          >
            <LeadForm
              product={product}
              summary={buildSummary()}
              quote={quote}
              total={total}
              selection={quoteSelection}
              pricing={quotePricing}
              isMobile={isMobile}
              recap={recap}
              auditQuote={auditQuote}
              onBack={configurable ? () => setPhase("config") : null}
              onSent={(info) => {
                setSentInfo(info);
                setPhase("sent");
              }}
            />
          </motion.div>
        )}

      </AnimatePresence>
      )}
    </div>
  );
}

/* ============================================================
   Auditoria — chips de focus (multi-selecció)
   ============================================================ */
/* ============================================================
   Seccions del config web/landing — reutilitzades en el grid de
   desktop (3 columnes) i en el wizard de mòbil (una per sub-pas).
   ============================================================ */
function TipusBaseSection({
  quote,
  disciplines,
  onToggle,
  stepIndex,
  className,
  shared,
}: {
  quote: ConfigQuote;
  disciplines: Discipline[];
  onToggle: (d: Discipline) => void;
  stepIndex?: number;
  className?: string;
  /** M6: s'ha obert des d'un enllaç compartit. */
  shared?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <section aria-label="Abast i base inclosa" className={`flex flex-col gap-10 ${className ?? ""}`}>
      <div className="flex flex-col gap-6">
        <h3
          // Sticky amb FONS OPAC: sense bg el contingut es veuria per sota
          // mentre passa. El pare no pot tenir overflow-hidden o el sticky
          // deixa d'enganxar-se.
          className="sticky top-0 z-10 bg-surface-base text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium text-text-main focus:outline-none lg:pt-10"
          data-autofocus
          tabIndex={-1}
        >
          {stepIndex != null && `${stepIndex}. `}Tipus de projecte
        </h3>
        {shared ? (
          // Figma: «Nota · Configuració compartida» (12550-18865). L'enllaç porta la selecció, no els imports.
          <p className="-mt-4 text-body-xs text-text-secondary">
            Configuració compartida. Pots canviar el que vulguis: el total es calcula amb els preus d’avui.
          </p>
        ) : null}
        <DisciplineChips disciplines={disciplines} onToggle={onToggle} />
      </div>

      <div className="flex flex-col">
        <div className="border-b border-border-subtle py-5">
          <h3 className="text-body-s font-medium text-text-main">
            Base.
            {/* Una sola frase certa a les 7 combinacions de disciplines:
                «un projecte complet» era fals amb una o dues. Decidit 24set26. */}
            <span className="font-normal">
              {" "}
              El que inclou l’abast que has triat.
            </span>
          </h3>
        </div>
        <AnimatePresence mode="popLayout" initial={false}>
          {quote.includes.map((item, i) => (
            // Clau per POSICIÓ (no per text): la fila que canvia de text sense
            // moure's (p. ex. "Disseny i desenvolupament a mida" → "Disseny UX a
            // mida") persisteix i fa un swap lateral intern; les files que
            // apareixen/desapareixen al final entren/surten en vertical.
            <motion.div
              key={`base-slot-${i}`}
              layout
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{
                duration: reduce ? 0 : 0.32,
                ease: [0.16, 1, 0.3, 1],
                delay: reduce ? 0 : i * 0.03,
              }}
              className="relative flex items-center gap-4 border-b border-border-subtle py-4"
            >
              <div className="relative min-w-0 flex-1 overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.p
                    key={item}
                    initial={reduce ? false : { opacity: 0, x: 28 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, x: -28 }}
                    transition={{ duration: reduce ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="text-body-xs-light md:text-body-s-light text-text-main"
                  >
                    {item}
                  </motion.p>
                </AnimatePresence>
              </div>
              <Check size={18} weight="bold" className="shrink-0 text-accent" aria-hidden="true" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

/** Aparició/desaparició d'una fila d'extra: col·lapse d'alçada + fade. */
function ExtraReveal({ reduce, children }: { reduce: boolean | null; children: ReactNode }) {
  // overflow-hidden només mentre dura l'animació d'alçada: un cop oberta, la
  // fila ha de deixar sortir el popover de dependència (24set26).
  const [settled, setSettled] = useState(!!reduce);
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
      transition={{ duration: reduce ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
      onAnimationStart={() => setSettled(false)}
      onAnimationComplete={() => setSettled(true)}
      className={`shrink-0 ${settled ? "" : "overflow-hidden"}`}
    >
      {children}
    </motion.div>
  );
}

/** Els cinc extres que ConfigSelection conserva amb camp propi. */
const V1_EXTRA_IDS: ConfigExtraId[] = ["pagina", "idioma", "motion", "cms", "redaccio"];

/**
 * Pas d'extres: pinta els mòduls DES DEL CATÀLEG, agrupats per família.
 *
 * Abans els cinc extres del v1 estaven escrits a mà, un per un, i per això
 * els vuit mòduls del pla modular 2026 van quedar sense pantalla tot i ser al
 * model de preus. Ara la font és `quote.availableExtras` i el `control` de
 * cada definició decideix si surt Stepper o Switch, així que afegir un mòdul
 * és només tocar `CONFIG_EXTRAS`.
 *
 * Les regles de disposició (famílies, col·locació dels packs, caption de
 * preu) viuen a `pricing.ts` i tenen tests propis: aquí només es recorren.
 */
function ExtresSection({
  quote,
  product,
  values,
  onChange,
  stepIndex,
  className,
  disciplines,
  onAddDiscipline,
}: {
  quote: ConfigQuote;
  product: ConfigProduct;
  values: Partial<Record<ConfigExtraId, number>>;
  onChange: (id: ConfigExtraId, value: number) => void;
  stepIndex?: number;
  className?: string;
  /** M2b: amb totes dues, la línia «Amb X, N mòduls més» i el botó que l'encén. */
  disciplines?: Discipline[];
  onAddDiscipline?: (d: Discipline) => void;
}) {
  const reduce = useReducedMotion();

  // Nota dinàmica del pack (mestre Figma `Nota · Pack` 12523-24490).
  const packNote = (pack: (typeof PACKS)[number]) => {
    const st = packStatus(pack, product, (id) => (values[id] ?? 0) > 0);
    const euros = formatEuro(st.estalvi);
    return (
      <p
        key={`pack-${pack.id}`}
        aria-live="polite"
        className={`flex items-start gap-2 pt-4 text-caption-sm ${
          st.state === "cap" ? "text-text-secondary" : "text-text-main"
        }`}
      >
        {st.state === "aplicat" ? (
          <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
        ) : null}
        <span>
          {st.state === "cap"
            ? `${pack.label} · ${st.tots} junts: −${pack.discountPct}%`
            : st.state === "parcial"
              ? `${pack.label} · en tens ${st.tinc}\u00A0de\u00A0${st.total}. Afegeix ${st.falten} i estalvies ${euros}.`
              : `${pack.label} aplicat · estalvies ${euros}`}
        </span>
      </p>
    );
  };
  const locked = new Set(quote.lockedExtras);
  // Confirmació de dependència oberta (id del mòdul bloquejat), 24set26.
  const [confirmId, setConfirmId] = useState<ConfigExtraId | null>(null);
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const confirmText = (id: ConfigExtraId) => {
    const req = CONFIG_EXTRAS[id].requires!;
    return `${req.subject} necessita ${req.needs}, +${formatEuro(extraPricing(req.id, product).price)}.`;
  };


  const grups = groupExtras(quote.availableExtras, quote.lockedExtras);
  const actiusDe = (ids: ConfigExtraId[]) =>
    ids.filter((x) => !locked.has(x) && (values[x] ?? 0) > 0).length;
  // M1 (24set26): famílies plegables. Oberta per defecte la primera i les que
  // ja tenen mòduls actius; després mana l'usuari.
  const [openFams, setOpenFams] = useState<Set<string>>(
    () => new Set(grups.filter((g, i) => i === 0 || actiusDe(g.ids) > 0).map((g) => g.id)),
  );
  const toggleFam = (fid: string) =>
    setOpenFams((prev) => {
      const next = new Set(prev);
      if (next.has(fid)) next.delete(fid);
      else next.add(fid);
      return next;
    });

  const fills: ReactNode[] = [];
  for (const grup of grups) {
    const rows: ReactNode[] = [];
    const total = grup.ids.length;
    const actius = actiusDe(grup.ids);
    const obert = openFams.has(grup.id);
    const panelId = `fam-${grup.id}`;

    for (const id of grup.ids) {
      const def = CONFIG_EXTRAS[id];
      // Un mòdul bloquejat no suma encara que l'usuari l'hagués encès abans
      // d'apagar el CMS: es pinta apagat i deshabilitat.
      const isLocked = locked.has(id);
      const value = isLocked ? 0 : (values[id] ?? 0);
      const captionId = `extra-${id}-caption`;
      const caption = extraCaption(id, product, quote, value);
      rows.push(
        <ExtraReveal key={id} reduce={reduce}>
          <ConfigRow
            label={def.label}
            caption={isLocked && def.requires ? `${caption} · ${def.requires.label}` : caption}
            captionId={captionId}
            help={extraHelp(id, product)}
          >
            {def.control === "counter" ? (
              <Stepper label={def.label} value={value} onChange={(v) => onChange(id, v)} />
            ) : (
              <span className="relative">
                <Switch
                  label={def.label}
                  checked={value > 0}
                  onChange={(b) => onChange(id, b ? 1 : 0)}
                  disabled={isLocked}
                  describedBy={isLocked ? captionId : undefined}
                  onBlockedClick={isLocked && def.requires ? () => setConfirmId(id) : undefined}
                />
                {!isMobile && confirmId === id && def.requires ? (
                  <DependencyConfirm
                    mode="popover"
                    text={confirmText(id)}
                    onConfirm={() => {
                      onChange(def.requires!.id, 1);
                      onChange(id, 1);
                      setConfirmId(null);
                    }}
                    onCancel={() => setConfirmId(null)}
                  />
                ) : null}
              </span>
            )}
          </ConfigRow>
          <AnimatePresence initial={false}>
            {isMobile && confirmId === id && def.requires ? (
              <DependencyConfirm
                mode="inline"
                text={confirmText(id)}
                onConfirm={() => {
                  onChange(def.requires!.id, 1);
                  onChange(id, 1);
                  setConfirmId(null);
                }}
                onCancel={() => setConfirmId(null)}
              />
            ) : null}
          </AnimatePresence>
        </ExtraReveal>,
      );
    }

    for (const pack of grup.packs) rows.push(packNote(pack));

    fills.push(
      <div key={`grp-${grup.id}`} className="flex flex-col pt-6">
        {/* Mestre Figma `Capçalera · Família` 12528-25262 */}
        <button
          type="button"
          aria-expanded={obert}
          aria-controls={panelId}
          onClick={() => toggleFam(grup.id)}
          className="flex min-h-11 w-full items-center gap-3 border-b border-border-subtle py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
        >
          <span className="flex-1 text-caption-sm text-text-main">{grup.label}</span>
          <span className="text-caption-sm text-text-secondary tabular-nums">
            {actius > 0 ? (
              <>
                <span className="hidden md:inline">{`${total} mòduls · `}</span>
                {`${actius} ${actius === 1 ? "actiu" : "actius"}`}
              </>
            ) : (
              `${total} mòduls`
            )}
          </span>
          <CaretDown
            size={16}
            aria-hidden="true"
            className={`shrink-0 text-text-secondary transition-transform ${obert ? "rotate-180" : ""}`}
          />
        </button>
        <AnimatePresence initial={false}>
          {obert ? (
            <motion.div
              key="panel"
              id={panelId}
              initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
              className={`flex flex-col ${reduce ? "" : "overflow-hidden"}`}
              onAnimationStart={() => {
                const el = document.getElementById(panelId);
                if (el && !reduce) el.style.overflow = "hidden";
              }}
              onAnimationComplete={(def) => {
                // Un cop oberta, deixa sortir el popover de dependència.
                const el = document.getElementById(panelId);
                if (el && (def as { height?: string }).height === "auto") el.style.overflow = "visible";
              }}
            >
              <AnimatePresence initial={false}>{rows}</AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>,
    );
  }

  // Els packs que creuen famílies (el Pack Contingut) van al final de tot.
  for (const pack of crossFamilyPacks(quote.availableExtras)) fills.push(packNote(pack));

  // M2b (24set26): una sola línia al final quan una disciplina apagada amaga
  // mòduls. El botó l'encén aquí mateix: a mòbil i tauleta els chips són al pas 1.
  // Figma: mestre `Nota · Disciplina` 12535-17566.
  const unlock = disciplines && onAddDiscipline ? disciplineUnlock(product, disciplines) : null;
  // El botó desapareix en prémer-lo: el focus torna al titular de la secció.
  const titleRef = useRef<HTMLHeadingElement>(null);
  if (unlock) {
    const n = unlock.modules.length;
    const nom = DISCIPLINES[unlock.discipline].label;
    const detall = unlock.noms.charAt(0).toUpperCase() + unlock.noms.slice(1);
    fills.push(
      <div key="unlock" className="flex flex-col gap-4 pt-6">
        <div className="flex flex-col gap-1">
          <p className="text-body-s md:text-body-m lg:text-body-l text-text-main">
            {`Amb ${nom}, ${n}\u00A0${n === 1 ? "mòdul" : "mòduls"} més`}
          </p>
          <p className="text-body-xs text-text-secondary">
            {`${detall}. Suma ${formatEuro(unlock.baseDelta)} a la base.`}
          </p>
        </div>
        <Button
          variant="ghost"
          shape="pill"
          size="md"
          iconLeft={<Plus size={16} />}
          onClick={() => {
            onAddDiscipline!(unlock.discipline);
            titleRef.current?.focus();
          }}
          className="-ml-[var(--button-md-padding)] min-h-11 self-start"
        >
          {`Afegeix ${nom}`}
        </Button>
      </div>,
    );
  }

  return (
    <section aria-label="Extres" className={`flex flex-col ${className ?? ""}`}>
      <h3
        ref={titleRef}
        className="sticky top-0 z-10 border-b border-border-subtle bg-surface-base py-5 text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium lg:pt-15 text-text-main focus:outline-none"
        data-autofocus
        tabIndex={-1}
      >
        {stepIndex != null && `${stepIndex}. `}Extres
      </h3>
      {fills}
    </section>
  );
}

function ResumSection({
  quote,
  total,
  baseOpen,
  showTotal,
  showTitle = true,
  className,
  runLayoutId,
  share,
}: {
  quote: ConfigQuote;
  total: number;
  baseOpen: boolean;
  showTotal: boolean;
  /** Dins del full inferior el títol el posa el full («Resum»). */
  showTitle?: boolean;
  /** M6: botó «Comparteix el pressupost» sota el total (web i landing). */
  share?: { onShare: () => void; copied: boolean };
  className?: string;
  /** Si es passa, el Resum és un element compartit (layoutId) que llisca de
   *  posició entre config i form. layout="position" evita el jitter d'alçada. */
  runLayoutId?: string;
}) {
  return (
    <motion.aside
      layoutId={runLayoutId}
      layout={runLayoutId ? "position" : undefined}
      aria-label="Resum"
      className={`flex flex-col gap-6 ${className ?? ""}`}
    >
      <div className="flex flex-col">
        {showTitle ? (
          <h3
            className="border-b border-border-subtle py-5 text-display-2xs-medium lg:text-display-xs-medium text-text-main focus:outline-none"
            data-autofocus
            tabIndex={-1}
          >
            Resum
          </h3>
        ) : null}
        <SummaryGroup
          title="Total Base"
          amount={quote.baseTotal}
          defaultOpen={baseOpen}
          lines={quote.phases.map((p, i) => ({
            label: `Fase ${i + 1} · ${p.label}`,
            amount: p.amount,
          }))}
        />
        {quote.extras.length > 0 && (
          <SummaryGroup
            title="Extres"
            amount={quote.extrasTotal}
            lines={orderExtrasByFamily(quote.extras).map((e) => ({ label: e.label, amount: e.amount }))}
          />
        )}
        {showTotal && (
          <div className="flex items-center gap-6 py-5">
            <span className="flex-1 text-display-2xs-medium lg:text-display-xs-medium text-text-main">Total</span>
            <span className="text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium text-text-main tabular-nums">
              <span aria-hidden="true">
                <AnimatedTotal value={total} />
              </span>
              <span className="sr-only" aria-live="polite">
                Total orientatiu: {formatEuro(total)}
              </span>
            </span>
          </div>
        )}
        {share ? (
          // Figma: Outline MD pill amb ShareNetwork, amplada completa (12550-19049).
          <div className="pt-4">
            <Button
              variant="outline"
              shape="pill"
              size="md"
              fullWidth
              onClick={share.onShare}
              iconLeft={share.copied ? <Check size={16} /> : <ShareNetwork size={16} />}
            >
              {share.copied ? "Enllaç copiat" : "Comparteix el pressupost"}
            </Button>
            <span className="sr-only" aria-live="polite">
              {share.copied ? "Enllaç copiat al porta-retalls." : ""}
            </span>
          </div>
        ) : null}
      </div>
      <NotIncludedNote />
    </motion.aside>
  );
}

/* ============================================================
   Primitius del wizard mòbil — indicador de pas, footer amb Total
   sticky i nota de reassurance al cos.
   ============================================================ */
function StepProgress({ current, total }: { current: number; total: number }) {
  const reduce = useReducedMotion();
  // Direcció del canvi: el número roda amunt en avançar, avall en tornar enrere.
  // Patró "estat de renders previs" (sense refs en render) per calcular la direcció.
  const [snap, setSnap] = useState<{ step: number; dir: 1 | -1 }>({ step: current, dir: 1 });
  const dir: 1 | -1 = current > snap.step ? 1 : current < snap.step ? -1 : snap.dir;
  if (snap.step !== current) setSnap({ step: current, dir });

  return (
    <div className="flex flex-col items-end gap-1.5">
      <span className="sr-only">
        Pas {current} de {total}
      </span>
      <span
        aria-hidden="true"
        className="flex items-center gap-1 text-caption uppercase text-text-secondary"
      >
        Pas
        <span className="relative inline-block overflow-hidden leading-none tabular-nums">
          <span className="invisible">{current}</span>
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.span
              key={current}
              initial={reduce ? false : { y: dir > 0 ? "100%" : "-100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { y: dir > 0 ? "-100%" : "100%", opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {current}
            </motion.span>
          </AnimatePresence>
        </span>
        de {total}
      </span>
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className="relative h-1 w-6 overflow-hidden rounded-full bg-border-subtle"
          >
            <motion.span
              className="absolute inset-0 origin-left rounded-full bg-primary-main"
              initial={false}
              animate={{ scaleX: i < current ? 1 : 0 }}
              transition={{ duration: reduce ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

function MobileTotalFooter({
  total,
  cta,
  onCta,
  submit,
  loading,
  describedBy,
  breakdown,
}: {
  total: number;
  cta: ReactNode;
  onCta?: () => void;
  submit?: boolean;
  loading?: boolean;
  describedBy?: string;
  /** Desglòs que obre el total (full inferior). Sense això el total és text. */
  breakdown?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetId = useId();
  const reduce = useReducedMotion();

  // M4b (24set26): què ha mogut el total. Cada canvi suma al delta visible i
  // reinicia el temps; 1,5 s després de l'últim, desapareix. A mòbil i tauleta
  // el Resum és dins del full tancat: aquí és l'únic lloc on es veu.
  // Patró «estat de renders previs» (com StepProgress), sense setState en efecte.
  const [seen, setSeen] = useState(total);
  const [delta, setDelta] = useState<{ value: number; n: number } | null>(null);
  if (seen !== total) {
    setSeen(total);
    setDelta((p) => ({ value: (p?.value ?? 0) + (total - seen), n: (p?.n ?? 0) + 1 }));
  }
  const deltaN = delta?.n;
  useEffect(() => {
    if (deltaN == null) return;
    const t = setTimeout(() => setDelta(null), 1500);
    return () => clearTimeout(t);
  }, [deltaN]);
  const deltaNode = (
    <AnimatePresence>
      {delta && delta.value !== 0 ? (
        <motion.span
          key="delta"
          aria-hidden="true"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
          transition={{ duration: reduce ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-caption text-text-secondary tabular-nums"
        >
          {delta.value < 0 ? `\u2212${formatEuro(-delta.value)}` : `+${formatEuro(delta.value)}`}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );

  const totalValue = (
    <span className="text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium leading-none text-text-main tabular-nums">
      <span aria-hidden="true">
        <AnimatedTotal value={total} />
      </span>
      <span className="sr-only" aria-live="polite">
        Total orientatiu: {formatEuro(total)}
      </span>
    </span>
  );

  return (
    <div className="relative z-20 shrink-0">
      {breakdown ? (
        <Sheet id={sheetId} title="Resum" open={open} onClose={() => setOpen(false)} returnFocusRef={triggerRef}>
          {breakdown}
        </Sheet>
      ) : null}
      <footer className="relative z-10 border-t border-border-subtle bg-surface-base px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-12">
        <div className="flex items-center justify-between gap-4">
          {breakdown ? (
            /* Figma: «Total» + caret (amunt tancat, avall obert), 24set26. */
            <button
              ref={triggerRef}
              type="button"
              aria-expanded={open}
              aria-controls={sheetId}
              onClick={() => setOpen((o) => !o)}
              className="flex min-h-11 flex-col items-start text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
            >
              <span className="flex items-center gap-2 text-caption text-text-main">
                Total
                {open ? (
                  <CaretDown size={16} aria-hidden="true" />
                ) : (
                  <CaretUp size={16} aria-hidden="true" />
                )}
                <span className="sr-only">{open ? ", amaga el desglòs" : ", mostra el desglòs"}</span>
                {deltaNode}
              </span>
              {totalValue}
            </button>
          ) : (
            <div className="flex flex-col">
              <span className="flex items-center gap-2 text-caption text-text-secondary">
                Total
                {deltaNode}
              </span>
              {totalValue}
            </div>
          )}
          <Button
            variant="solid"
            shape="pill"
            size="xl"
            type={submit ? "submit" : "button"}
            onClick={onCta}
            loading={loading}
            aria-describedby={describedBy}
          >
            {cta}
          </Button>
        </div>
      </footer>
    </div>
  );
}

/**
 * Files del Resum de l'auditoria (Base · focus, Abast, Extres). Compartides pel
 * Resum de desktop, el del pas de dades i el full de desglòs de mòbil/tauleta.
 */
function AuditResumRows({ auditQuote }: { auditQuote: AuditQuote }) {
  return (
    <>
      <div className="flex items-center gap-6 border-b border-border-subtle py-3">
        <span className="flex-1 text-body-s text-text-main">
          {auditQuote.focuses.length === 3
            ? "Base · Tot (UX + UI + Dev)"
            : `Base · ${auditQuote.focuses.map((f) => f.label).join(" + ")}`}
        </span>
        <span className="shrink-0 text-caption text-text-secondary tabular-nums">
          {formatEuro(auditQuote.baseTotal)}
        </span>
      </div>
      <div className="flex items-center gap-6 border-b border-border-subtle py-3">
        <span className="flex-1 text-body-s text-text-main">Abast · {auditQuote.size.label}</span>
        <span className="shrink-0 text-caption text-text-secondary tabular-nums">
          {auditQuote.sizeIncrement ? `+${formatEuro(auditQuote.sizeIncrement)}` : "(inclòs)"}
        </span>
      </div>
      {auditQuote.extras.length > 0 && (
        <SummaryGroup
          title="Extres"
          amount={auditQuote.extrasTotal}
          lines={auditQuote.extras.map((e) => ({ label: e.label, amount: e.amount }))}
        />
      )}
    </>
  );
}

/**
 * Nota «No inclòs al total» del Resum i del full de desglòs. Taula (decidit
 * 24set26, substitueix les dues vinyetes del mateix dia, que a desktop es
 * llegien malament): els recurrents surten de RECURRENTS i l'IVA va a part.
 */
function NotIncludedNote({ className = "" }: { className?: string }) {
  // Taula del mestre Figma `Nota · No inclòs` (12523-24142): capçalera, una fila
  // per recurrent (nom a l'esquerra, import en mono a la dreta) i l'IVA a sota.
  return (
    <div className={`flex flex-col gap-3 border-t dash-h-border-subtle pt-6 ${className}`}>
      <p className="text-caption text-text-secondary">No inclòs al total</p>
      <dl className="flex flex-col">
        {RECURRENTS.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-4 border-b border-dashed border-border-subtle py-2"
          >
            <dt className="text-body-2xs md:text-body-xs text-text-secondary">{r.label}</dt>
            <dd className="shrink-0 whitespace-nowrap text-caption text-text-main tabular-nums">{r.price}</dd>
          </div>
        ))}
      </dl>
      <p className="text-body-2xs md:text-body-xs text-text-secondary">Preus sense IVA</p>
    </div>
  );
}

function MobileReassurance() {
  return (
    <p className="pt-8 text-caption text-text-secondary">
      El total és orientatiu: el tanquem junts a la proposta. O{" "}
      <a
        href={PRODUCT_CALL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4 transition-colors hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
      >
        reserva una trucada de 20 min
        <span className="sr-only"> (s&apos;obre en una pestanya nova)</span>
      </a>
      .
    </p>
  );
}

/* ============================================================
   FASE 2 · Dades del lead — el pressupost ja el dona la config
   ============================================================ */
function LeadForm({
  product,
  summary,
  quote,
  total,
  selection,
  pricing,
  isMobile,
  recap,
  auditQuote,
  onBack,
  onSent,
}: {
  product: Product;
  summary: string;
  quote: ConfigQuote | null;
  /** Resum de l'auditoria (quan no hi ha `quote`). */
  auditQuote?: AuditQuote | null;
  total: number;
  selection: Json;
  pricing: Json;
  isMobile: boolean;
  recap: string;
  onBack: (() => void) | null;
  onSent: (info: { email: string; ref: string | null }) => void;
}) {
  const [timing, setTiming] = useState<string | null>(null);
  const [clientType, setClientType] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [acceptError, setAcceptError] = useState(false);
  const errorId = useId();
  const acceptErrorId = useId();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const email = String(form.get("email") || "").trim();
    const name = String(form.get("name") || "");
    const userMessage = String(form.get("message") || "").trim();
    const source = String(form.get("source") || "").trim();
    const website = String(form.get("website") || ""); // honeypot

    // Validació de camp al client: l'email es mostra SOTA el seu camp, no com a
    // error de formulari al final. Els errors de servei (xarxa) van al bloc general.
    if (!EMAIL_RE.test(email)) {
      setEmailError("Escriu un email vàlid.");
      formEl.querySelector<HTMLInputElement>('input[name="email"]')?.focus();
      return;
    }
    setEmailError(null);

    if (!accepted) {
      setAcceptError(true);
      formEl.querySelector<HTMLInputElement>('input[name="accept"]')?.focus();
      return;
    }

    const message = [
      `Proposta sol·licitada per: ${product.name}`,
      `\n${summary}`,
      timing ? `\nQuan vol arrencar: ${timing}` : null,
      clientType ? `\nTipus de client: ${clientType}` : null,
      userMessage ? `\nMissatge:\n${userMessage}` : null,
      `\n— [via configurador /serveis]`,
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
      source: source || null,
      product: product.id as QuoteProduct,
      selection,
      pricing,
      totalEur: total,
      breakdown: summary,
    });
    setSubmitting(false);

    if (res.status === "ok") onSent({ email, ref: res.ref });
    else setError(res.message);
  };

  const consentField = (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="accept"
          checked={accepted}
          onChange={(e) => {
            setAccepted(e.target.checked);
            if (e.target.checked) setAcceptError(false);
          }}
          disabled={submitting}
          aria-invalid={acceptError || undefined}
          aria-describedby={acceptError ? acceptErrorId : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 rounded-[4px] border border-border-default accent-primary-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
        />
        <span className="text-body-xs-light md:text-body-s-light text-text-secondary">
          Autoritzo l&apos;ús de les meves dades perquè em contactin i em preparin la
          proposta. No es faran servir per a res més ni es compartiran amb tercers, tal
          com detalla la{" "}
          <span className="font-semibold text-text-primary">Política de privacitat</span>.
        </span>
      </label>
      {acceptError && (
        <p id={acceptErrorId} role="alert" className="text-body-xs-light md:text-body-s-light text-error">
          Has d&apos;acceptar les condicions per continuar.
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
      {/* Honeypot */}
      <label
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
        tabIndex={-1}
      >
        No omplis aquest camp
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>

      {isMobile ? (
        /* ——— MÒBIL · pas 4: recap compacte + dades, footer Total + enviar ——— */
        <>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-6 md:px-12">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 py-6">
              <div className="flex flex-col gap-2">
                {recap && <span className="text-caption text-text-secondary">{recap}</span>}
                <h3
                  className="text-display-2xs-medium lg:text-display-xs-medium text-text-main focus:outline-none"
                  data-autofocus
                  tabIndex={-1}
                >
                  Les dades
                </h3>
              </div>
              <Field
                label="El teu correu"
                required
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="tu@correu.com"
                error={emailError}
                disabled={submitting}
              />
              <Field
                label="El teu nom"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Nom i cognom"
                disabled={submitting}
              />
              <SelectField
                label="Com m’has conegut?"
                name="source"
                options={SOURCE_OPTIONS}
                placeholder="Selecciona una opció"
                disabled={submitting}
              />
              <div className="flex flex-col gap-6">
                <h3 className="text-display-2xs-medium lg:text-display-xs-medium text-text-main">El brief</h3>
                <ChipGroup
                  label="Quan vols arrencar?"
                  options={TIMING_OPTIONS}
                  selected={timing}
                  onSelect={setTiming}
                  disabled={submitting}
                />
                <ChipGroup
                  label="Amb qui parlo?"
                  options={CLIENT_TYPE_OPTIONS}
                  selected={clientType}
                  onSelect={setClientType}
                  disabled={submitting}
                />
                <label className="flex flex-col gap-2">
                  <span className="text-label text-text-secondary">Vols deixar un missatge?</span>
                  <textarea
                    name="message"
                    rows={6}
                    maxLength={5000}
                    placeholder="Context, objectius, referències… el que ajudi a entendre el projecte."
                    disabled={submitting}
                    className="w-full resize-y rounded-md border border-border-default bg-surface-card p-4 font-sans text-body-s md:text-body-m lg:text-body-l text-text-main transition-colors placeholder:text-text-secondary/40 focus:border-text-main focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base disabled:opacity-50"
                  />
                </label>
              </div>
              {consentField}
              <MobileReassurance />
              {error && (
                <p id={errorId} role="alert" className="text-body-s md:text-body-m lg:text-body-l text-error">
                  {error}
                </p>
              )}
            </div>
          </div>
          <MobileTotalFooter
            total={total}
            cta={
              submitting ? (
                "Enviant..."
              ) : (
                /* A mòbil el text llarg no hi cap amb el total (24set26). */
                <>
                  <span className="md:hidden">Rep la proposta</span>
                  <span className="hidden md:inline">Envia i rep la proposta</span>
                </>
              )
            }
            submit
            loading={submitting}
            describedBy={error ? errorId : undefined}
            breakdown={
              quote ? (
                <ResumSection quote={quote} total={total} baseOpen={false} showTotal={false} showTitle={false} />
              ) : auditQuote ? (
                <>
                  <AuditResumRows auditQuote={auditQuote} />
                  <NotIncludedNote className="mt-8" />
                </>
              ) : undefined
            }
          />
        </>
      ) : (
        /* ——— DESKTOP · 3 columnes: dades · projecte · resum ——— */
        <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 md:px-12">
        <div className="mx-auto grid w-full max-w-[1728px] grid-cols-1 gap-10 py-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_556px_minmax(0,1fr)] lg:gap-12">
          {/* COLUMNA A — Resum (Figma: Resum · El brief · Les dades, 24set26) */}
          <aside
            aria-label="Resum"
            className="flex flex-col gap-6 lg:border-r lg:border-border-subtle lg:pr-6"
          >
            <div className="flex flex-col">
              <h3 className="border-b border-border-subtle py-5 text-display-2xs-medium lg:text-display-xs-medium text-text-main">
                Resum
              </h3>
              {quote && (
                <>
                  <SummaryGroup
                    title="Total Base"
                    amount={quote.baseTotal}
                    defaultOpen={false}
                    lines={quote.phases.map((p, i) => ({
                      label: `Fase ${i + 1} · ${p.label}`,
                      amount: p.amount,
                    }))}
                  />
                  {quote.extras.length > 0 && (
                    <SummaryGroup
                      title="Extres"
                      amount={quote.extrasTotal}
                      defaultOpen={false}
                      lines={orderExtrasByFamily(quote.extras).map((e) => ({ label: e.label, amount: e.amount }))}
                    />
                  )}
                </>
              )}
              {!quote && auditQuote ? <AuditResumRows auditQuote={auditQuote} /> : null}
              <div className="flex items-center gap-6 py-5">
                <span className="flex-1 text-display-2xs-medium lg:text-display-xs-medium text-text-main">Total</span>
                <span className="text-display-2xs-medium md:text-display-xs-medium lg:text-display-s-medium text-text-main tabular-nums">
                  {formatEuro(total)}
                </span>
              </div>
            </div>
            <NotIncludedNote />
          </aside>

          {/* COLUMNA B — El brief */}
          <section
            aria-label="El brief"
            className="flex flex-col gap-6 lg:border-r lg:border-border-subtle lg:pr-6"
          >
            <h3 className="border-b border-border-subtle py-5 text-display-2xs-medium lg:text-display-xs-medium text-text-main">
              {auditQuote ? "4. " : ""}El brief
            </h3>
            <ChipGroup
              label="Quan vols arrencar?"
              options={TIMING_OPTIONS}
              selected={timing}
              onSelect={setTiming}
              disabled={submitting}
            />
            <ChipGroup
              label="Amb qui parlo?"
              options={CLIENT_TYPE_OPTIONS}
              selected={clientType}
              onSelect={setClientType}
              disabled={submitting}
            />
            <label className="flex flex-col gap-2">
              <span className="text-label text-text-secondary">Vols deixar un missatge?</span>
              <textarea
                name="message"
                rows={6}
                maxLength={5000}
                placeholder="Context, objectius, referències… el que ajudi a entendre el projecte."
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

          {/* COLUMNA C — Les dades */}
          <section
            aria-label="Les dades"
            className="flex flex-col gap-8"
          >
            <h3
              className="border-b border-border-subtle py-5 text-display-2xs-medium lg:text-display-xs-medium text-text-main focus:outline-none"
              data-autofocus
              tabIndex={-1}
            >
              {auditQuote ? "5. " : ""}Les dades
            </h3>
            <Field
              label="El teu correu"
              required
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="tu@correu.com"
              error={emailError}
              disabled={submitting}
            />
            <Field
              label="El teu nom"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Nom i cognom"
              disabled={submitting}
            />
            <SelectField
              label="Com m’has conegut?"
              name="source"
              options={SOURCE_OPTIONS}
              placeholder="Selecciona una opció"
              disabled={submitting}
            />
            {consentField}
          </section>
        </div>
      </div>

      {/* Footer: nota + Tornar + Enviar */}
      <footer className="shrink-0 border-t border-border-subtle bg-surface-base px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="flex w-full flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between md:gap-8">
          <p className="text-caption text-text-secondary">
            El total és orientatiu: el tanquem junts a la proposta. O{" "}
            <a
              href={PRODUCT_CALL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 transition-colors hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
            >
              reserva una trucada de 20 min
              <span className="sr-only"> (s&apos;obre en una pestanya nova)</span>
            </a>
            .
          </p>
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                disabled={submitting}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-base px-2 text-body-xs-light md:text-body-s-light text-text-secondary transition-colors hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-main focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base disabled:opacity-50"
              >
                <ArrowLeft size={16} weight="regular" aria-hidden="true" />
                Tornar
              </button>
            )}
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
              {submitting ? "Enviant..." : "Enviar i rebre proposta"}
            </Button>
          </div>
        </div>
      </footer>
        </>
      )}
    </form>
  );
}


