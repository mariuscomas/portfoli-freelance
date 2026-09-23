"use client";

import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { ArrowUp, ArrowRight, CheckCircle, CircleNotch, LinkedinLogo, BehanceLogo, Globe } from "@phosphor-icons/react";
import { subscribeNewsletter } from "@/app/actions/newsletter";
import TransitionLink from "@/components/common/TransitionLink";
import LogoSmall from "@/components/common/LogoSmall";
import { usePathname } from "next/navigation";
import { useFooterReveal } from "@/context/FooterRevealContext";
import { useContactModal } from "@/context/ContactModalContext";
import RevealGroup from "@/components/common/RevealGroup";
import { LinkUnderline } from "@/components/ui/LinkUnderline";
import { CONSENT_CHANGE_EVENT } from "@/lib/analytics"

/**
 * Form de newsletter del footer. Crida la Server Action subscribeNewsletter
 * (taula newsletter_subscribers a Supabase, mateix patró que /contacte).
 * Estats: idle → loading → success | error. En success, el form es
 * substitueix pel missatge de confirmació.
 */
function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;
    setError(null);

    startTransition(async () => {
      const result = await subscribeNewsletter({ email, website: honeypot });
      if (result.status === "ok") {
        setDone(true);
      } else {
        setError(result.message);
      }
    });
  };

  if (done) {
    return (
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        // DS-exception: mida display de la newsletter (28px); els clamps body encollirien massa en mòbil
        className="flex items-center gap-3 py-4 font-sans text-text-main text-2xl md:text-[28px]"
        role="status"
      >
        <CheckCircle size={28} weight="fill" className="shrink-0" />
        Gràcies! Ja estàs subscrit.
      </motion.p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <form className="relative flex items-center w-full group mt-2" onSubmit={handleSubmit} noValidate>
        {/* Honeypot anti-spam: invisible per a humans, els bots l'omplen. */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
        />
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="El teu millor correu"
          disabled={isPending}
          aria-label="El teu email"
          aria-invalid={error ? true : undefined}
          // Figma (component Input): línia base border → focus border-strong (blanc);
          // caret en el color de primer pla, error amb línia error/main.
          className={`w-full bg-transparent border-b py-4 pr-12 text-text-main caret-text-main font-sans text-2xl md:text-[28px] focus:outline-none transition-colors placeholder:text-text-secondary/40 disabled:opacity-50 ${
            error
              ? "border-error focus:border-error"
              : "border-border-default focus:border-text-main"
          }`}
        />
        <button
          type="submit"
          disabled={isPending}
          className="absolute right-0 bottom-3 text-text-main opacity-60 group-hover:opacity-100 hover:text-text-secondary hover:translate-x-1 transition-all p-2 border-b border-transparent disabled:opacity-40 disabled:hover:translate-x-0"
          aria-label="Subscriu-me a la newsletter"
        >
          {isPending
            ? <CircleNotch size={28} weight="regular" className="animate-spin" />
            : <ArrowRight size={28} weight="regular" />}
        </button>
      </form>

      {error && (
        <p className="text-caption text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Decideix si aquesta ruta porta footer. Els fitxers de projecte (/works/:slug)
 * porten el seu propi tancament al final de la pàgina.
 *
 * La decisió viu AQUÍ, en un component sense hooks de DOM, i no dins de
 * FooterContent: `useScroll({ target })` de motion comprova al seu useEffect
 * que el ref estigui poblat i LLANÇA ("Target ref is defined but not
 * hydrated") si no ho està. Amb el `return null` a dins, els hooks
 * s'executaven igualment però el sentinel no es muntava mai.
 */
export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/works/") && pathname !== "/works") return null;
  return <FooterContent />;
}

/** Titular del tancament, per línies (el salt només a partir de md). */
/**
 * Titular de tancament, paraula per paraula (el reveal entra una per una).
 * `em` = èmfasi per to (text/secondary), com al Figma; `glue` = sense espai
 * davant, per al punt final, que va al color base.
 */
const CLOSING_LINES: { w: string; em?: boolean; glue?: boolean }[][] = [
  [{ w: "El" }, { w: "següent" }, { w: "projecte" }],
  [{ w: "comença" }, { w: "amb" }, { w: "una" }, { w: "conversa", em: true }, { w: ".", glue: true }],
];
const CLOSING_WORDS = CLOSING_LINES.flat().length;

function FooterContent() {
  // Cal aquí també: el reset del reveal es dispara en canviar de ruta entre
  // dues pàgines que SÍ que porten footer (llavors el component no es desmunta).
  const pathname = usePathname();
  const { setRevealed } = useFooterReveal();
  const { open: openContactModal } = useContactModal();

  // EFECTE CORTINA (sticky reveal):
  //  - La CTA + el contingut formen la cortina (capa opaca z-[1], a SiteShell
  //    i a la <section> de sota). S'aixequen amb el scroll.
  //  - El footer fosc és `sticky bottom-0` i queda DARRERE (z-0, sota la
  //    cortina z-[1] de SiteShell): es revela
  //    a mesura que la cortina s'aixeca. `sticky` (no `fixed`) → es revela
  //    sencer encara que sigui més alt que el viewport.
  //  - sentinelRef mesura el progrés del revelat (parallax + fade del navbar).
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sentinelRef,
    offset: ["start end", "start start"],
  });

  // Parallax: el contingut del footer entra una mica més lent → profunditat.
  const footerInnerY = useTransform(scrollYProgress, [0, 1], ["-12%", "0%"]);

  // Footer "armat" (sticky) només quan la sentinella és a menys d'una
  // pantalla del final del viewport; fins llavors és `relative`, al seu lloc
  // natural del flux. Motiu: sticky bottom-0 i més alt que la pantalla, la seva
  // part de dalt quedava enganxada darrere la vora superior del viewport i
  // Safari d'iOS 26 tenyia la barra d'estat amb el seu fons fosc a totes les
  // pàgines (comprovat a l'iPhone amagant el footer, 22set26).
  // - `visibility:hidden` NO serveix: Safari el continua mostrejant (provat).
  // - relative → sticky no mou res visible: en armar-se, el footer puja per
  //   DARRERE la cortina opaca (z-[1]) i l'alçada del document no canvia.
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setArmed(e.isIntersecting),
      { rootMargin: "0px 0px 100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pathname]);

  // El Header fa fade-out quan la cortina ja ha revelat bona part del footer.
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setRevealed(v > 0.6);
  });


  // Reset en canviar de ruta o desmuntar (evita deixar el Header amagat).
  useEffect(() => () => setRevealed(false), [pathname, setRevealed]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* CTA — part de la cortina (opac, z-[1]): s'aixeca amb el contingut i
          revela el footer fosc de sota. */}
      {/* Entrada (guió 21set26): el titular s'omple paraula per paraula
          (20% → 100%, 60 ms per paraula, un cop, sense fixar) i el Link puja
          després (G2). Surt a totes les pàgines amb footer. */}
      <RevealGroup as="section" className="relative z-[1] w-full border-t border-border-default bg-surface-base px-page py-section-m lg:py-section-xl flex flex-col items-start gap-8 md:gap-12">
        {/* Figma (23set26): el titular passa de Hanken Light (Body/2XL -
            Statement, decisió 14set26) a Display — Bricolage SemiBold 56 a
            1728/1280, 40 a 834 i 32 a 402. El salt entre graons el decideix
            el component, com marca la rampa fixa. */}
        <h2 className="text-display-xs md:text-display-s xl:text-display-l text-text-main">
          {CLOSING_LINES.map((line, li) => (
            <Fragment key={li}>
              {li > 0 && <br className="hidden md:block" />}
              {line.map((word, wi) => {
                const i = CLOSING_LINES.slice(0, li).flat().length + wi;
                return (
                  <Fragment key={wi}>
                    {i > 0 && !word.glue && " "}
                    <span
                      className={`reveal-word${word.em ? " text-text-secondary" : ""}`}
                      style={{ "--reveal-delay": `${i * 60}ms` } as React.CSSProperties}
                    >
                      {word.w}
                    </span>
                  </Fragment>
                );
              })}
            </Fragment>
          ))}
        </h2>

        <div
          className="reveal-up mt-2 md:mt-6"
          style={{ "--reveal-delay": `${(CLOSING_WORDS - 1) * 60}ms` } as React.CSSProperties}
        >
          {/* Obre el modal de contacte (cortina) en lloc de navegar.
              Figma: instancia de "Buttons / Custom / Link" sense icona
              (node 11336:9476, Show Icon = false). */}
          <LinkUnderline onClick={openContactModal}>
            Reserva una trucada
          </LinkUnderline>
        </div>
      </RevealGroup>

      {/* Sentinella: límit cortina↔footer (mesura el progrés del revelat). */}
      <div ref={sentinelRef} aria-hidden className="h-0 w-full" />

      {/* FOOTER FOSC — sticky bottom-0, DARRERE la cortina: es revela.
          z-0 (mai negatiu!): amb -z-10 el footer queda darrere del body en el
          hit-testing i l'input de la newsletter no rep clics. La cortina
          (SiteShell, z-[1]) el tapa igualment perquè té z superior. */}
      <footer
        className={`dark ${armed ? "sticky" : "relative"} bottom-0 left-0 w-full z-0 flex flex-col overflow-hidden bg-surface-card`}
      >
      <motion.div style={{ y: footerInnerY }} className="w-full flex flex-col">

      {/* MAIN FOOTER (Fosc Inferior) */}
      <div className="w-full bg-surface-card text-text-main px-6 md:px-12 lg:px-24 pt-20 md:pt-32 pb-8 flex flex-col gap-16 md:gap-24">

        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 pb-16 md:pb-24 border-b border-border-subtle">

          {/* Col 1: Bio & Sitemap */}
          <div className="flex flex-col items-start justify-between gap-12 lg:pr-12 text-body-s md:text-body-m lg:text-body-l">
            {/* Logo Scroll Simplificat */}
            <div className="text-text-main w-auto">
              <LogoSmall className="h-14 lg:h-20 w-auto" />
            </div>

            <p className="text-body-s md:text-body-m lg:text-body-l font-medium text-text-main leading-relaxed tracking-tight max-w-[420px]">
              Dissenyador de producte digital. Del concepte d&apos;UI/UX a la implementació en codi.
            </p>

            {/* Sitemap Horizontal List */}
            <nav className="flex flex-wrap items-center gap-x-6 md:gap-x-8 gap-y-4 pt-4">
              {['Inici', 'Treballs', 'Serveis', 'Col·laboració', 'Qui soc'].map((item) => {
                let href = "/";
                if (item === "Treballs") href = "/works";
                else if (item === "Serveis") href = "/serveis";
                else if (item === "Col·laboració") href = "/colaboracio";
                else if (item === "Qui soc") href = "/about";

                return (
                  <TransitionLink
                    href={href}
                    key={item}
                    // Figma: repòs en secondary, hover cap a main (guanya èmfasi).
                    // py-3 -my-3 → target tàctil ≥44px sense alterar el ritme visual.
                    className="font-sans font-medium text-text-secondary hover:text-text-main transition-colors py-3 -my-3"
                  >
                    {item}
                  </TransitionLink>
                );
              })}
            </nav>
          </div>

          {/* Col 2: Newsletter */}
          <div className="flex flex-col justify-end gap-10 md:max-w-xl lg:max-w-md lg:ml-auto w-full">
            <p className="text-body-l lg:text-body-xl font-medium text-text-main leading-snug tracking-tight">
              De tant en tant, un correu amb aprenentatges reals: decisions de disseny, procés i el perquè de cada tria.
            </p>

            <NewsletterForm />

            <p className="text-body-xs-light md:text-body-s-light text-text-secondary/70 leading-relaxed" style={{ textWrap: "balance" }}>
              Sense spam ni sorolls. En apuntar-t&apos;hi acceptes la Política de privacitat; pots donar-te de baixa quan vulguis.
            </p>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Socials */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0 pb-4">

          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-5 font-sans text-text-secondary text-[15px] font-medium w-full md:w-auto justify-center md:justify-start">
            <span>© 2009-{new Date().getFullYear()} Màrius Freelance</span>
            <TransitionLink
              href="/privacitat"
              className="hover:text-text-main transition-colors py-2 -my-2"
            >
              Privacitat
            </TransitionLink>
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent(CONSENT_CHANGE_EVENT, { detail: "reopen" }),
                )
              }
              className="hover:text-text-main transition-colors py-2 -my-2"
            >
              Cookies
            </button>
          </div>

          {/* Socials Centered */}
          <div className="flex gap-8 items-center text-text-secondary w-full md:w-auto justify-center md:absolute md:left-1/2 md:-translate-x-1/2">
            {/* p-2.5 -m-2.5 → àrea de clic ≥44px mantenint la icona a 24px. */}
            <a href="https://www.malt.es/profile/marius" target="_blank" rel="noopener noreferrer" className="p-2.5 -m-2.5 hover:text-text-main hover:scale-110 transition-all" aria-label="Malt"><Globe size={24} /></a>
            <a href="https://www.linkedin.com/in/mariuscomas/" target="_blank" rel="noopener noreferrer" className="p-2.5 -m-2.5 hover:text-text-main hover:scale-110 transition-all" aria-label="LinkedIn"><LinkedinLogo size={24} /></a>
            <a href="https://www.behance.net/MariusComas" target="_blank" rel="noopener noreferrer" className="p-2.5 -m-2.5 hover:text-text-main hover:scale-110 transition-all" aria-label="Behance"><BehanceLogo size={24} /></a>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center justify-center gap-3 py-3 -my-3 text-text-secondary hover:text-text-main transition-colors font-sans text-[15px] font-medium group w-full md:w-auto"
            aria-label="Torna a dalt"
          >
            Torna a dalt <ArrowUp size={16} className="group-hover:-translate-y-1 transition-transform" />
          </button>

        </div>
      </div>
      </motion.div>
      </footer>
    </>
  );
}

