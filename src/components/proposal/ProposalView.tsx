import type { ProposalPayload, QuoteLineSnapshot } from "@/types/proposal";
import {
  CONDITIONS,
  RECURRENTS,
  DISCIPLINES,
  FULL_SCOPE_LABEL,
  formatEuro,
  type Discipline,
} from "@/lib/pricing";
import AcceptPanel from "./AcceptPanel";

/**
 * Pàgina pública d'una proposta (Figma: secció "Proposta", 11949:11354 viva /
 * 11952:11373 caducada / 11953:11381 mòbil).
 *
 * Els imports SEMPRE surten del snapshot (`quote.pricing`): una proposta ja
 * enviada no canvia de preu encara que es repriciï el catàleg. De pricing.ts
 * només en surt llenguatge (etiquetes d'abast, condicions, recurrents).
 */

const SECTION_PX = "px-6 md:px-12 lg:px-16 xl:px-24";

const PRODUCT_TITLE: Record<ProposalPayload["product"], string> = {
  web: "Web corporativa a mida, de principi a fi",
  landing: "Landing a mida, orientada a convertir",
  auditoria: "Auditoria UI/UX del teu producte",
  collaboracio: "Col·laboració amb el teu equip",
};

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("ca-ES", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

/** Abast llegible. L'auditoria no es mesura per disciplines sinó per mida. */
function scopeOf(p: ProposalPayload): string {
  if (p.product === "auditoria") return "Segons la mida del producte";
  if (p.product === "collaboracio") return p.rate_label ?? "Per durada";
  const picked = (p.selection?.disciplines ?? []) as Discipline[];
  if (picked.length >= 3 || picked.length === 0) return FULL_SCOPE_LABEL;
  return picked.map((d) => DISCIPLINES[d]?.label ?? d).join(" + ");
}

function Section({
  caption,
  title,
  children,
}: {
  caption: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`border-t border-border-subtle py-16 md:py-24 ${SECTION_PX}`}>
      <div className="flex flex-col gap-6">
        <span className="text-caption uppercase text-text-secondary">{caption}</span>
        <h2 className="text-display-s-medium md:text-display-m-medium lg:text-display-l-medium text-text-main">{title}</h2>
      </div>
      <div className="mt-12">{children}</div>
    </section>
  );
}

function MoneyRow({ label, amount, dim }: { label: string; amount: string; dim?: boolean }) {
  const tone = dim ? "text-text-secondary" : "text-text-main";
  return (
    <li className="flex items-center justify-between gap-6 border-b border-border-subtle py-5">
      <span className={`text-body-s md:text-body-m lg:text-body-l ${tone}`}>{label}</span>
      <span className={`text-body-s md:text-body-m lg:text-body-l tabular-nums ${tone}`}>{amount}</span>
    </li>
  );
}

export default function ProposalView({
  proposal,
  token,
}: {
  proposal: ProposalPayload;
  token: string;
}) {
  const p = proposal;
  const snapshot = p.pricing ?? {};
  const phases: QuoteLineSnapshot[] = snapshot.phases ?? [];
  const extras: QuoteLineSnapshot[] = snapshot.extras ?? [];
  const totalLabel =
    p.total_eur != null ? formatEuro(p.total_eur) : (p.rate_label ?? "—");
  const closed = p.is_closed && p.status === "acceptada";

  return (
    <main className="flex min-h-[100dvh] w-full flex-col overflow-x-clip bg-surface-base">
      {/* Capçalera mínima: qui obre això ve convidat per un enllaç privat —
          un menú de màrqueting només li oferiria sortides. */}
      <header
        className={`flex items-center justify-between gap-4 border-b border-border-subtle py-8 ${SECTION_PX}`}
      >
        <span className="text-caption uppercase text-text-main">Marius Comas Rosa</span>
        <span className="text-caption uppercase text-text-secondary">{p.reference}</span>
      </header>

      {p.is_expired && (
        <div
          className={`flex items-center gap-3 border-b border-error py-6 ${SECTION_PX}`}
          role="status"
        >
          <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-error" />
          <p className="text-body-s md:text-body-m lg:text-body-l text-error">
            Aquesta proposta va caducar el {fmtDate(p.expires_at)}. Els preus que hi veus són els
            d&apos;aleshores.
          </p>
        </div>
      )}

      {closed && !p.is_expired && (
        <div className={`border-b border-border-subtle py-6 ${SECTION_PX}`} role="status">
          <p className="text-body-s md:text-body-m lg:text-body-l text-text-main">
            Aquesta proposta ja està acceptada. Et confirmo dates i t&apos;envio la factura del 50%.
          </p>
        </div>
      )}

      {/* Hero */}
      <section className={`pb-16 pt-24 md:pb-24 md:pt-32 ${SECTION_PX}`}>
        <span className="text-caption uppercase text-text-secondary">
          Proposta per a {p.name || "tu"}
        </span>
        <h1 className="mt-6 max-w-5xl text-display-m md:text-display-xl lg:text-display-2xl text-text-main">
          {PRODUCT_TITLE[p.product]}
        </h1>
        <p className="mt-8 max-w-2xl text-body-m-light md:text-body-xl-light lg:text-body-2xl-light text-text-secondary">
          Aquesta és la proposta que surt de la configuració que vas enviar. El preu està tancat: el
          que llegeixes aquí és el que costa.
        </p>

        <dl className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-12">
          {[
            { k: "ENVIADA", v: fmtDate(p.sent_at), tone: "" },
            {
              k: "VÀLIDA FINS",
              v: fmtDate(p.expires_at),
              tone: p.is_expired ? "text-error" : "",
            },
            { k: "ABAST", v: scopeOf(p), tone: "" },
          ].map((item) => (
            <div
              key={item.k}
              className="flex flex-col gap-3 border-t border-border-subtle pt-5"
            >
              <dt className={`text-caption uppercase ${item.tone || "text-text-secondary"}`}>
                {item.k}
                {item.k === "VÀLIDA FINS" && p.is_expired ? " · caducada" : ""}
              </dt>
              <dd className={`text-body-s md:text-body-m lg:text-body-l ${item.tone || "text-text-main"}`}>{item.v}</dd>
            </div>
          ))}
          <div className="flex flex-col gap-3 border-t border-border-subtle pt-5">
            <dt className="text-caption uppercase text-text-secondary">Total</dt>
            <dd
              className={`text-body-l-semibold md:text-display-2xs lg:text-display-m ${p.is_expired ? "text-text-secondary" : "text-text-main"}`}
            >
              {totalLabel}
            </dd>
            <span className="text-caption uppercase text-text-secondary">
              {p.is_expired
                ? "Preu de la proposta original · sense IVA"
                : "Sense IVA · 50% a l'inici, 50% a l'entrega"}
            </span>
          </div>
        </dl>
      </section>

      {/* Desglòs */}
      {(phases.length > 0 || extras.length > 0) && (
        <Section caption="01 · Desglòs" title="D'on surt el preu">
          {phases.length > 0 && (
            <>
              <span className="text-caption uppercase text-text-secondary">
                Base · {scopeOf(p)}
              </span>
              <ul className="mt-4 mb-10 flex flex-col">
                {phases.map((l) => (
                  <MoneyRow key={l.id} label={l.label} amount={formatEuro(l.amount)} />
                ))}
                {snapshot.baseTotal != null && (
                  <MoneyRow label="Subtotal base" amount={formatEuro(snapshot.baseTotal)} dim />
                )}
              </ul>
            </>
          )}

          {extras.length > 0 && (
            <>
              <span className="text-caption uppercase text-text-secondary">Extres triats</span>
              <ul className="mt-4 mb-10 flex flex-col">
                {extras.map((l) => (
                  <MoneyRow key={l.id} label={l.label} amount={formatEuro(l.amount)} />
                ))}
                {snapshot.extrasTotal != null && (
                  <MoneyRow label="Subtotal extres" amount={formatEuro(snapshot.extrasTotal)} dim />
                )}
              </ul>
            </>
          )}

          <div className="flex items-center justify-between gap-6 border-b border-border-subtle py-7">
            <span className="text-body-l lg:text-body-xl text-text-main">Total del projecte</span>
            <span className="text-body-s-semibold md:text-body-l-semibold lg:text-display-xs text-text-main tabular-nums">{totalLabel}</span>
          </div>
          <p className="mt-6 text-caption uppercase text-text-secondary">
            Imports sense IVA. Continguts (textos, logo i imatges) a càrrec teu si no contractes la
            redacció.
          </p>
        </Section>
      )}

      {/* Condicions */}
      <Section caption="02 · Condicions" title="Com ho faig">
        <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-10">
          {CONDITIONS.map((c) => (
            <li key={c} className="border-t border-border-subtle pt-5 text-body-xs-light md:text-body-s-light text-text-main">
              {c}
            </li>
          ))}
        </ul>
      </Section>

      {/* Recurrents */}
      <Section caption="03 · Després del llançament" title="El que va a part">
        <ul className="flex flex-col">
          {RECURRENTS.map((r) => (
            <MoneyRow key={r.label} label={r.label} amount={r.price} />
          ))}
        </ul>
        <p className="mt-6 text-caption uppercase text-text-secondary">
          Cap d&apos;aquests conceptes està dins del total: es contracten a part i només si els vols.
        </p>
      </Section>

      {/* Acció */}
      <AcceptPanel
        token={token}
        defaultSigner={p.name ?? ""}
        expired={p.is_expired}
        alreadyAccepted={closed}
      />
    </main>
  );
}
