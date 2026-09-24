"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, type Transition } from "framer-motion";
import {
  Check,
  LinkSimple,
  LinkedinLogo,
  ShareNetwork,
  XLogo,
} from "@phosphor-icons/react";
import { useShareWork } from "./useShareWork";

/*
  Pastilla «Compartir» de la barra fixa (desktop, lg+).
  Figma: Buttons / Custom / Pill Compartir (12451-12672), eix Display:
  - Full: LinkedIn, X i copiar l'enllaç.
  - Icon: un sol botó ShareNetwork quan la barra es compacta. S'expandeix a
    Full en hover i en focus de teclat, com el selector Visual/Lectura, amb
    peek propi (WorkViewBar). Sense estat actiu: són accions.
*/

interface Props {
  title: string;
  slug: string;
  /** true = Display Full (tres accions); false = Display Icon. */
  expanded: boolean;
  onPeekOpen?: () => void;
  onPeekClose?: () => void;
  /** Transicions de la barra (WorkViewBar), per moure's al mateix ritme. */
  resize?: Transition;
  fade?: Transition;
  fadeOut?: Transition;
  className?: string;
}

const segment =
  "flex items-center justify-center rounded-full size-11 lg:size-12 xl:size-14 " +
  "text-text-main transition-colors duration-300 hover:text-text-secondary " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-main focus-visible:ring-offset-2";

export default function WorkSharePill({
  title,
  slug,
  expanded,
  onPeekOpen,
  onPeekClose,
  resize,
  fade,
  fadeOut,
  className = "",
}: Props) {
  const { copied, copyLink, openShare } = useShareWork(title, slug);
  const copyLabel = copied ? "Enllaç copiat" : "Copiar l’enllaç";
  const groupRef = useRef<HTMLDivElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  // El disparador desapareix en expandir-se: si tenia el focus, el passem a
  // la primera acció perquè el teclat no perdi el fil.
  const triggerHadFocus = useRef(false);

  useEffect(() => {
    if (expanded && triggerHadFocus.current) {
      triggerHadFocus.current = false;
      firstActionRef.current?.focus();
    }
  }, [expanded]);

  return (
    <motion.div
      ref={groupRef}
      role="group"
      layout
      // Quan el selector veí s'obre, aquesta pastilla només es desplaça: la
      // caixa es mou sencera i el contingut no fa animació pròpia (abans la
      // icona es movia dins la pastilla). El contingut només anima quan
      // canvia l'estat d'aquesta peça (layoutDependency).
      transition={resize}
      style={{ borderRadius: 9999 }}
      aria-label="Compartir aquest projecte"
      onMouseEnter={onPeekOpen}
      onMouseLeave={onPeekClose}
      onBlur={(e) => {
        if (!groupRef.current?.contains(e.relatedTarget as Node | null))
          onPeekClose?.();
      }}
      className={`pointer-events-auto items-center gap-0 p-1.5 lg:p-2 bg-surface-card overflow-hidden
        shadow-[0_4px_24px_rgba(0,0,0,0.10)] ${className}`}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {expanded ? (
          <motion.div
            key="full"
            className="flex items-center"
            layout="position"
            layoutDependency={expanded}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: fadeOut }}
            transition={fade}
          >
            <button
              ref={firstActionRef}
              type="button"
              className={segment}
              aria-label="Compartir a LinkedIn"
              title="Compartir a LinkedIn"
              onFocus={onPeekOpen}
              onClick={() => openShare("linkedin")}
            >
              <LinkedinLogo size={22} weight="regular" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={segment}
              aria-label="Compartir a X"
              title="Compartir a X"
              onFocus={onPeekOpen}
              onClick={() => openShare("x")}
            >
              <XLogo size={22} weight="regular" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={segment}
              aria-label={copyLabel}
              title={copyLabel}
              onFocus={onPeekOpen}
              onClick={copyLink}
            >
              {copied ? (
                <Check size={22} weight="regular" aria-hidden="true" />
              ) : (
                <LinkSimple size={22} weight="regular" aria-hidden="true" />
              )}
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="icon"
            layout="position"
            layoutDependency={expanded}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: fadeOut }}
            transition={fade}
            type="button"
            className={segment}
            aria-label="Compartir aquest projecte"
            aria-expanded={false}
            title="Compartir"
            onFocus={() => {
              triggerHadFocus.current = true;
              onPeekOpen?.();
            }}
            onClick={onPeekOpen}
          >
            <ShareNetwork size={22} weight="regular" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>
      <span className="sr-only" aria-live="polite">
        {copied ? "Enllaç copiat al porta-retalls." : ""}
      </span>
    </motion.div>
  );
}
