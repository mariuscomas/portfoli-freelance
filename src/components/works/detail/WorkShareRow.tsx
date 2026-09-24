"use client";

import { Check, ShareNetwork } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { useShareWork } from "./useShareWork";

/* ============================================================
   <WorkShareRow /> — compartir el case study (mòbil i tablet)
   ------------------------------------------------------------
   Figma: Section Share mòbil (Exploracio). Un sol «Compartir» que obre el
   full del sistema (navigator.share); on no n'hi ha, copia l'enllaç.
   A desktop (lg+) no surt: el compartir viu a la barra fixa
   (WorkSharePill), decisió 24set26 que substitueix la fila estàtica de
   desktop del mateix dia perquè ocupava una franja sencera per a tres
   botons i arribava quan el lector ja havia acabat.
   Instagram i Behance no tenen URL de compartir des d'una web: no hi són.
   ============================================================ */

interface Props {
  title: string;
  slug: string;
}

export default function WorkShareRow({ title, slug }: Props) {
  const { copied, nativeShare } = useShareWork(title, slug);

  return (
    <section
      aria-labelledby="work-share-title"
      className="lg:hidden relative z-10 bg-surface-base border-t border-border-default px-page py-section-s"
    >
      <div className="flex flex-col gap-6">
        <h2 id="work-share-title" className="text-caption-eyebrow text-text-secondary">
          Comparteix aquest projecte
        </h2>
        <Button
          variant="outline"
          size="md"
          shape="square"
          fullWidth
          onClick={nativeShare}
          iconLeft={copied ? <Check size={20} /> : <ShareNetwork size={20} />}
        >
          {copied ? "Enllaç copiat" : "Compartir"}
        </Button>
        <span className="sr-only" aria-live="polite">
          {copied ? "Enllaç copiat al porta-retalls." : ""}
        </span>
      </div>
    </section>
  );
}
