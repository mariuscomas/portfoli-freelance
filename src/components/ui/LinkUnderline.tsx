"use client";

import React, { forwardRef } from "react";

/* ============================================================
   <LinkUnderline /> — Enllaç subratllat, sincronitzat amb Figma
   ------------------------------------------------------------
   Mestre: "Buttons / Custom / Link" (component set 10564:2064)
   https://www.figma.com/design/kYJGrKCJyy3nlMg2idLzOE/MariusFreelance?node-id=10564-2064

   Spec del mestre:
   - Text:      estil Buttons/Link (24/28, Hanken Regular) → .text-button-link
   - Color:     Link/Default/font-color + /border (alias text/main); text i
                subratllat comparteixen token, com al mestre
   - Subratllat: stroke 1px, 6px sota la caixa de text  → pb-1.5 + border-b
   - Icona:     20×20, 10px de separació                → gap-2.5
   - Variants:  Active (True = amb subratllat / False = sense)
                × State (Default / Hover / Focus)
   - Props:     Show Icon (boolean) + Icon (instance swap)

   El subratllat va al <span> del text, no al contenidor: al Figma el Border
   té l'amplada del Content (només el text), no la del conjunt amb la icona.

   min-h-11 = 44px, la constant a11y `sizing/target-min` del Figma. El mestre
   fa 28px d'alt; els 44 són l'àrea tàctil, no la caixa visual.

   Estats (Figma: propietat State = Default / Hover / Focus):
   - Hover: Link/Hover/font-color + Link/Hover/border → accent/main
   - Focus: Link/Focus/outline → focus/ring (= primary/main, s'inverteix amb
     el tema). Al Figma es pinta com a stroke de 2px cap enfora; l'offset de
     4px el posa el codi.
   ============================================================ */

type CommonProps = {
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

export type LinkUnderlineProps = AsButton | AsAnchor;

const base = [
  "group inline-flex min-h-11 w-fit items-center gap-2.5",
  "text-button-link text-text-main",
  "transition-colors duration-300",
  "hover:text-accent",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4",
  "focus-visible:ring-focus-ring focus-visible:ring-offset-surface-base",
].join(" ");

export const LinkUnderline = forwardRef<
  HTMLButtonElement & HTMLAnchorElement,
  LinkUnderlineProps
>(function LinkUnderline(
  { active = true, icon, children, className = "", ...rest },
  ref,
) {
  const content = (
    <>
      <span
        className={
          active
            ? "border-b border-text-main pb-1.5 transition-colors duration-300 group-hover:border-accent"
            : undefined
        }
      >
        {children}
      </span>
      {icon}
    </>
  );

  const classes = `${base} ${className}`.trim();

  // `as` és API del component, no un atribut d'HTML: no ha d'arribar al DOM.
  const domProps: Record<string, unknown> = { ...rest };
  delete domProps.as;

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
