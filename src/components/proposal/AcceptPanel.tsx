"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { acceptProposal } from "@/app/proposta/[token]/actions";
import { PRODUCT_CALL_URL } from "@/lib/pricing";
import { SITE_EMAIL } from "@/lib/site";

/* Marge lateral de pàgina. Llegeix la rampa `--page-margin`
   (402:24 · 768:48 · 1024:72 · 1440:96 · 1920:144), que mana des del
   21set26. Abans era "px-6 md:px-12 lg:px-16 xl:px-24" escrit a mà,
   que a lg donava 64 on la rampa en diu 72 i no tenia el graó de 144. */
const SECTION_PX = "px-page";

/**
 * Secció d'acció de la proposta. L'acceptació queda registrada amb nom i data
 * (quote_events), que és el que la converteix en una acceptació defensable.
 * La validació real (caducada, tancada) la fa la funció de la base de dades:
 * això d'aquí només n'ensenya el resultat.
 */
export default function AcceptPanel({
  token,
  defaultSigner,
  expired,
  alreadyAccepted,
}: {
  token: string;
  defaultSigner: string;
  expired: boolean;
  alreadyAccepted: boolean;
}) {
  const [signer, setSigner] = useState(defaultSigner);
  const [state, setState] = useState<"idle" | "sending" | "done">(
    alreadyAccepted ? "done" : "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setState("sending");
    const res = await acceptProposal(token, signer);
    if (res.status === "ok" || res.status === "already") setState("done");
    else {
      setState("idle");
      setError(res.message);
    }
  };

  if (expired) {
    return (
      <section className={`border-t border-border-subtle pb-32 pt-24 ${SECTION_PX}`}>
        <span className="text-caption uppercase text-text-secondary">04 · Què pots fer</span>
        <h2 className="mt-6 text-display-xs md:text-display-s lg:text-display-l text-text-main">Te&apos;n faig una d&apos;actualitzada</h2>
        <div className="mt-10">
          <Button as="a" href={`mailto:${SITE_EMAIL}?subject=Proposta caducada`}>
            Demana&apos;n una d&apos;actualitzada
          </Button>
        </div>
        <p className="mt-8 max-w-2xl text-body-s md:text-body-m lg:text-body-l text-text-secondary">
          La validesa de 30 dies ja ha passat, així que aquests imports no els puc mantenir a cegues.
          Digues-m&apos;ho i te&apos;n torno a fer una amb els preus d&apos;ara: si al teu projecte
          no ha canviat res, sol ser el mateix número.
        </p>
      </section>
    );
  }

  if (state === "done") {
    return (
      <section className={`border-t border-border-subtle pb-32 pt-24 ${SECTION_PX}`}>
        <span className="text-caption uppercase text-text-secondary">04 · Fet</span>
        <h2 className="mt-6 text-display-xs md:text-display-s lg:text-display-l text-text-main">Proposta acceptada</h2>
        <p className="mt-8 max-w-2xl text-body-s md:text-body-m lg:text-body-l text-text-secondary">
          Queda registrat. Et confirmo dates i t&apos;envio la factura del 50% per començar; si
          t&apos;encaixa millor parlar-ne abans, escriu-me i ho quadrem.
        </p>
      </section>
    );
  }

  return (
    <section className={`border-t border-border-subtle pb-32 pt-24 ${SECTION_PX}`}>
      <span className="text-caption uppercase text-text-secondary">04 · Com seguim</span>
      <h2 className="mt-6 text-display-xs md:text-display-s lg:text-display-l text-text-main">Comencem?</h2>

      <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-end md:gap-8">
        <label className="flex max-w-sm flex-1 flex-col gap-2">
          <span className="text-caption uppercase text-text-secondary">Qui accepta</span>
          <input
            type="text"
            value={signer}
            onChange={(e) => setSigner(e.target.value)}
            placeholder="Nom i cognom"
            className="w-full border-b border-border-subtle bg-transparent py-2 text-body-s md:text-body-m lg:text-body-l text-text-main placeholder:text-text-secondary/60 focus:border-text-main focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap items-center gap-8">
          <Button onClick={submit} disabled={state === "sending"}>
            {state === "sending" ? "Un moment…" : "Accepto la proposta"}
          </Button>
          <a
            href={PRODUCT_CALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-body-s md:text-body-m lg:text-body-l text-text-secondary underline underline-offset-4 hover:text-text-main"
          >
            Tinc dubtes, parlem-ne
          </a>
        </div>
      </div>

      {error && <p className="mt-6 text-body-xs-light md:text-body-s-light text-error">{error}</p>}

      <p className="mt-10 max-w-2xl text-body-s md:text-body-m lg:text-body-l text-text-secondary">
        En acceptar queda registrat que hi dones el vist-i-plau: et confirmo dates i t&apos;envio la
        factura del 50% per començar. Si prefereixes parlar-ne abans, reservem 20 minuts i no passa
        res.
      </p>
    </section>
  );
}
