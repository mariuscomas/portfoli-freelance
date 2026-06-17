"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Cube,
  DeviceMobile,
  Globe,
  Target,
  Browsers,
  Sparkle,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import TransitionLink from "@/components/common/TransitionLink";
import { Service } from "@/types";
import { t } from "@/lib/i18n";

/**
 * <ServiceModal />
 *
 * Aplica el disseny del Figma "Serveis Detail - Macbook Pro 16'" (frame 10727:5692).
 *
 * Estructura:
 *  ┌────────────────────────────────────────────────────────┐
 *  │  DISSENY WEB                                       (×) │   ← Header (display-h5)
 *  │                                                        │
 *  │  ┌──────────────────┐   ┌────────────────────────────┐ │
 *  │  │                  │   │  Desde 2.500€              │ │
 *  │  │     IMATGE       │   │  6.500€                    │ │
 *  │  │     (5/4 ratio)  │   │  This service contains...  │ │
 *  │  │                  │   │  ┌──────────────────────┐  │ │
 *  │  └──────────────────┘   │  │ 1 Kickoff   500€      │  │ │
 *  │                         │  │ 2 Final     500€      │  │ │
 *  │  About this Service     │  └──────────────────────┘  │ │
 *  │  Lorem ipsum…           │  Concepts and revision:…  │ │
 *  │                         │  Project Duration:…       │ │
 *  │  Our Step-by-Step Plan  │  ┌──────────────────────┐  │ │
 *  │  …                      │  │     Contactar         │  │ │
 *  │                         │  └──────────────────────┘  │ │
 *  │                         └────────────────────────────┘ │
 *  └────────────────────────────────────────────────────────┘
 *
 *  - Modal és el card sencer (bg-surface-card, rounded-card).
 *  - Columna dreta és un panel propi (bg-surface-base, rounded-card)
 *    amb el milestones-card blanc encastat a dins (bg-surface-card +
 *    border surface-border).
 *  - Tipografies: Display H5 al títol, Heading H4 als sub-títols,
 *    Heading H1 al preu gran, Body MD/LG a la resta — tot via tokens
 *    `text-*` definits a globals.css (sync amb variables Figma).
 *  - El conjunt fa scroll dins el card (overflow-y-auto). La columna
 *    dreta no es sticky perquè trencaria amb continguts llargs;
 *    l'usuari fa scroll fins al CTA quan toca.
 */

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
}

/* Mapping flexible: noms vells (Lucide) i nous (Phosphor) → mateix component. */
const ICON_MAP: Record<string, PhosphorIcon> = {
  Cube,
  DeviceMobile,
  Globe,
  Target,
  Browsers,
  Sparkle,
  Box: Cube,
  Smartphone: DeviceMobile,
  LayoutTemplate: Browsers,
  Sparkles: Sparkle,
};

function getIcon(iconName: string): PhosphorIcon {
  return ICON_MAP[iconName] || Sparkle;
}

export default function ServiceModal({ isOpen, onClose, service }: ServiceModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

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

  // Pricing — la BD només té price_starts_at, així que el preu principal
  // del Figma ("6.500€") és aquest valor i el "Desde X€" més petit és una
  // fracció (40%). El milestone amount és la meitat (kickoff + final).
  const fullPrice = service.price_starts_at
    ? `${service.price_starts_at.toLocaleString("de-DE")}€`
    : "Consultar";
  const halfPrice = service.price_starts_at
    ? `${Math.round(service.price_starts_at / 2).toLocaleString("de-DE")}€`
    : null;
  const lowPrice = service.price_starts_at
    ? `${Math.round(service.price_starts_at * 0.4).toLocaleString("de-DE")}€`
    : null;

  const contactHref = slug ? `/contacte?service=${encodeURIComponent(slug)}` : "/contacte";

  /*
    Portal a document.body — crítica perquè el modal es comporti com un
    modal real i no s'atrapi dins de parents amb transform/filter/etc.
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
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-modal-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-card rounded-card w-full max-w-[1280px] max-h-[88vh] md:max-h-[85vh] overflow-y-auto hide-scrollbar shadow-2xl relative"
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
                  className="shrink-0 -m-2 p-2 text-text-main hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full"
                  aria-label="Tancar"
                >
                  <X size={24} weight="regular" />
                </button>
              </header>

              {/* === GRID: 2 columnes 50/50 a partir de md (apilat a mobile) ===
                  Fem servir CSS Grid en lloc de flex-row perquè és més robust:
                  les columnes no es "trenquen" per culpa de width:100% / contingut
                  que sobrepassa el flex-basis. items-start manté alineació superior. */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-start">

                {/* ============================================
                    Columna ESQUERRA — imatge + articles
                    min-w-0 permet que la imatge respecti l'amplada de la cel·la
                   ============================================ */}
                <div className="min-w-0 flex flex-col gap-10 md:gap-16">

                  {/* Imatge protagonista (ratio ~5/4 com a Figma) */}
                  <div
                    className="rounded-card overflow-hidden w-full bg-surface-base relative"
                    style={{ aspectRatio: "5 / 4" }}
                  >
                    {service.image_url ? (
                      <Image
                        src={service.image_url}
                        alt={typeof title === "string" ? title : "Service image"}
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

                  {/* Articles — un per cada bloc de contingut omplert.
                      Tots comparteixen estil (text-heading-h4 + text-body-lg). */}
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

                {/* ============================================
                    Columna DRETA — pricing panel
                   ============================================ */}
                <aside className="min-w-0 bg-surface-base rounded-card p-6 md:p-10 flex flex-col gap-10 md:gap-16">

                  {/* Contingut superior (header preu + milestones + meta) */}
                  <div className="flex flex-col gap-8 md:gap-12">

                    {/* Header preu: "Desde X€" (heading-h4) + preu gran (heading-h1) + subtítol */}
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col text-text-main">
                        {lowPrice && service.price_starts_at && (
                          <span className="text-heading-h4">
                            Desde {lowPrice}
                          </span>
                        )}
                        <span className="text-heading-h1">
                          {fullPrice}
                        </span>
                      </div>
                      {halfPrice && (
                        <p className="text-body-md text-text-secondary">
                          This service contains 2 payment milestones
                        </p>
                      )}
                    </div>

                    {/* Card blanc interior amb milestones */}
                    {halfPrice && (
                      <div className="bg-surface-card border border-surface-border rounded-card p-6 flex flex-col gap-3">
                        <MilestoneRow
                          index={1}
                          title="Kickoff Payment"
                          meta="Due at checkout"
                          amount={halfPrice}
                        />
                        <MilestoneRow
                          index={2}
                          title="Final Delivery"
                          meta=""
                          amount={halfPrice}
                        />
                      </div>
                    )}

                    {/* Meta extra inline (Concepts + Project Duration) */}
                    {(revisions || duration) && (
                      <div className="flex flex-col gap-3">
                        {revisions && (
                          <MetaRow label="Concepts and revision:" value={revisions} />
                        )}
                        {duration && (
                          <MetaRow label="Project Duration:" value={duration} />
                        )}
                      </div>
                    )}
                  </div>

                  {/* CTA — botó solid amb radius 16px (no pill) */}
                  <TransitionLink
                    href={contactHref}
                    className="w-full h-16 bg-primary-main text-text-main-inverse rounded-base text-button-lg flex items-center justify-center hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent focus-visible:ring-offset-surface-base"
                  >
                    Contactar
                  </TransitionLink>
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
   Subcomponents
   ============================================================ */

/**
 * Article — bloc de text amb títol (Heading H4, regular, 16px) sobre
 * cos (Body LG ≈ Body/MD - Light al Figma: 24px, light, line-height 32).
 *
 * Gap heading↔body 24px segons Figma (gap-6).
 */
function Article({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <h4 className="text-heading-h4 text-text-main">{title}</h4>
      <p className="text-body-lg text-text-secondary whitespace-pre-wrap">
        {children}
      </p>
    </div>
  );
}

/**
 * MilestoneRow — fila dins el card blanc de pagaments.
 * Estructura: [index] [title] [meta] ............ [amount]
 * Tipografia Body MD (20px), text-main negre.
 */
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
      {meta && (
        <span className="hidden sm:inline flex-1 text-text-secondary font-light">
          {meta}
        </span>
      )}
      {!meta && <span className="flex-1" aria-hidden="true" />}
      <span className="shrink-0 tabular-nums">{amount}</span>
    </div>
  );
}

/**
 * MetaRow — fila inline de meta info al panel de pricing.
 * Format: "Label: value" amb label regular i value light, tot Body MD.
 */
function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-body-md text-text-main">
      <span className="font-normal">{label}</span>
      <span className="font-light">{value}</span>
    </div>
  );
}
