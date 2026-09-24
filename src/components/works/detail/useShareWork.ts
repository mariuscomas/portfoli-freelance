"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trackEvent, EVENTS } from "@/lib/analytics";

/*
  Lògica compartida de «compartir el case study» (24set26).
  La fan servir la fila estàtica de mòbil/tablet (WorkShareRow) i la pastilla
  de la barra fixa de desktop (WorkSharePill). Decisió i motius a
  docs/compartir-case-study-2026-09-24.md.
*/

const COPIED_MS = 2000;

export type ShareNetwork = "linkedin" | "x";

export function useShareWork(title: string, slug: string) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // L'URL es llegeix en el moment del clic: val igual en local, preview i
  // producció sense dependre d'una variable d'entorn.
  const pageUrl = () => window.location.href.split("#")[0];

  const track = useCallback(
    (method: string) =>
      trackEvent(EVENTS.share, { method, content_type: "work", item_id: slug }),
    [slug]
  );

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pageUrl());
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_MS);
      track("copy_link");
    } catch {
      // Sense permís de porta-retalls: no fingim que s'ha copiat.
    }
  }, [track]);

  const nativeShare = useCallback(async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url: pageUrl() });
        track("native");
      } catch {
        // L'usuari ha tancat el full: no és un error.
      }
      return;
    }
    await copyLink();
  }, [title, track, copyLink]);

  const openShare = useCallback(
    (network: ShareNetwork) => {
      const url = encodeURIComponent(pageUrl());
      const href =
        network === "linkedin"
          ? `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
          : `https://x.com/intent/post?url=${url}&text=${encodeURIComponent(title)}`;
      window.open(href, "_blank", "noopener,noreferrer,width=600,height=640");
      track(network);
    },
    [title, track]
  );

  return { copied, copyLink, nativeShare, openShare };
}
