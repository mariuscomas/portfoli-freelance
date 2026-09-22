"use client";

import React, { forwardRef } from "react";

/* ============================================================
   <LinkUnderline /> — Enllaç subratllat, sincronitzat amb Figma
   ------------------------------------------------------------
   Mestre: "Buttons / Custom / Link" (component set 10564:2064)
   https://www.figma.com/design/kYJGrKCJyy3nlMg2idLzOE/MariusFreelance?node-id=10564-2064

   Spec del mestre:
   - Text:      estil Button/Link/<Size>, Hanken Regular → .text-button-link-<size>
                SM 14/16 · MD 16/18 · LG 20/24 · XL 24/28 (default XL)
   - Color:     Link/Default/font-color + /border (alias text/main); text i
                subratllat comparteixen token, com al mestre
   - Subratllat: stroke 1px, 6px sota la caixa de text  → pb-1.5 + border-b
   - Icona:     20×20, 10px de separació                → gap-2.5
   - Variants:  Size (SM / MD / LG / XL) × Active (True = amb subratllat / False = sense)
                × State (Default / Hover / Focus)
   - Props:     Show Icon (boolean) + Icon (instance swap)

   El subratllat va al <span> del text, no al contenidor: al Figma el Border
   té l'amplada del Content (només el text), no la del conjunt amb la icona.

   min-h-11 = 44px, la constant a11y `sizing/target-min` del Figma. El mestre
   fa 28px d'alt; els 44 són l'àrea tàctil, no la caixa visual.

   Estats (Figma: propietat State = Default / Hover / Focus):
   - Hover: Link/Hover/font-color + Link/Hover/border → text/secondary
     (marca monocroma, 22set26: substitueix accent/main, el verd #13ec6d)
   - Focus: Link/Focus/outline → focus/ring (= primary/main, s'inverteix amb
     el tema). Al Figma es pinta com a stroke de 2px cap enfora; l'offset de
     4px el posa el codi.
   ============================================================ */

export type LinkUnderlineSize = "sm" | "md" | "lg" | "xl";

const sizeClass: Record<LinkUnderlineSize, string> = {
  sm: "text-button-link-sm",
  md: "text-button-link-md",
  lg: "text-button-link-lg",
  xl: "text-button-link-xl",
};

type CommonProps = {
  /** Mida del text. Figma: variant Size. Default "xl". */
  size?: LinkUnderlineSize;
  /** Subratllat visible. Figma: variant Active. Default true. */
  active?: boolean;
  /** Icona opcional a la dreta (20×20). Figma: Show Icon + Icon. */
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

type AsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
    as?: "button";
    href?: never;
  };

type AsAnchor = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className"> & {
    as: "a";
    href: string;
  };

type AsSpan = CommonProps &
  Omit<React.HTMLAttributes<HTMLSpanElement>, "children" | "className"> & {
    /**
     * Variant presentacional: pinta el link del DS sense element interactiu
     * propi. Pensada per anar DINS d'un `<TransitionLink>` o un `<button>`,
     * on un <a> niat no seria HTML vàlid ni navegable amb teclat. El focus i
     * el hover els governa el pare (`group`).
     */
    as: "span";
    href?: never;
  };

export type LinkUnderlineProps = AsButton | AsAnchor | AsSpan;

const base = [
  "group inline-flex min-h-11 w-fit items-center gap-2.5",
  "text-text-main",
  "transition-colors duration-300",
  "hover:text-text-secondary",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4",
  "focus-visible:ring-focus-ring focus-visible:ring-offset-surface-base",
].join(" ");

export const LinkUnderline = forwardRef<
  HTMLButtonElement & HTMLAnchorElement,
  LinkUnderlineProps
>(function LinkUnderline(
  { size = "xl", active = true, icon, children, className = "", ...rest },
  ref,
) {
  const content = (
    <>
      <span
        className={
          active
            ? "border-b border-text-main pb-1.5 transition-colors duration-300 group-hover:border-text-secondary"
            : undefined
        }
      >
        {children}
      </span>
      {icon}
    </>
  );

  const classes = `${base} ${sizeClass[size]} ${className}`.trim();

  // `as` és API del component, no un atribut d'HTML: no ha d'arribar al DOM.
  const domProps: Record<string, unknown> = { ...rest };
  delete domProps.as;

  if (rest.as === "span") {
    return (
      <span className={classes} {...(domProps as React.HTMLAttributes<HTMLSpanElement>)}>
        {content}
      </span>
    );
  }

  if (rest.as === "a") {
    return (
      <a
        ref={ref}
        className={classes}
        {...(domProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={(rest as AsButton).type ?? "button"}
      className={`${classes} cursor-pointer`}
      {...(domProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
});

export default LinkUnderline;
