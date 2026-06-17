"use client";

import React, { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

/* ============================================================
   <Button /> — Sistema de botons sincronitzat amb Figma
   ------------------------------------------------------------
   Variants: solid | outline | ghost
   Sizes:    sm    | md      | lg (default)
   Shapes:   default (radius 16px) | pill | square
   ============================================================ */

export type ButtonVariant = "solid" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonShape = "default" | "pill" | "square";

type CommonButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
  className?: string;
};

type ButtonAsButton = CommonButtonProps &
  Omit<HTMLMotionProps<"button">, "children" | "className"> & {
    as?: "button";
    href?: never;
  };

type ButtonAsLink = CommonButtonProps &
  Omit<HTMLMotionProps<"a">, "children" | "className"> & {
    as: "a";
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/* ------------------------------------------------------------
   Classes per variant — consumeixen tokens CSS de globals.css
   ------------------------------------------------------------ */
const variantClasses: Record<ButtonVariant, string> = {
  solid: [
    // Base
    "relative overflow-hidden",
    "bg-[var(--solid-default-background)] text-[var(--solid-default-font-color)]",
    "backdrop-blur-[2px]",
    "drop-shadow-[0px_4px_10px_rgba(0,0,0,0.08)]",
    // Hover
    "hover:bg-[var(--solid-hover-background)] hover:text-[var(--solid-hover-font-color)]",
    // Active / Pressed (Figma: Solid/Pressed)
    "active:bg-[var(--solid-pressed-background)] active:text-[var(--solid-pressed-font-color)]",
    // Focus visible (Figma: Solid/Focus/outline) — WCAG 2.4.7
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "focus-visible:ring-[var(--solid-focus-outline)] focus-visible:ring-offset-[var(--surface-base)]",
    // Disabled
    "disabled:bg-[var(--solid-disabled-background)] disabled:text-[var(--solid-disabled-font-color)]",
    "disabled:cursor-not-allowed disabled:opacity-90 disabled:hover:bg-[var(--solid-disabled-background)]",
  ].join(" "),

  outline: [
    "relative overflow-hidden",
    "border border-[var(--outline-default-border)] text-[var(--outline-default-font-color)]",
    "backdrop-blur-[5px]",
    "shadow-[0px_4px_10px_0px_rgba(0,0,0,0.03)]",
    // Hover
    "hover:bg-[var(--outline-hover-background)] hover:text-[var(--outline-hover-font-color)]",
    // Active / Pressed
    "active:bg-[var(--outline-pressed-background)] active:text-[var(--outline-pressed-font-color)] active:border-[var(--outline-pressed-border)]",
    // Focus visible
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "focus-visible:ring-[var(--outline-focus-outline)] focus-visible:ring-offset-[var(--surface-base)]",
    // Disabled
    "disabled:border-[var(--outline-disabled-border)] disabled:text-[var(--outline-disabled-font-color)]",
    "disabled:cursor-not-allowed disabled:hover:bg-transparent",
  ].join(" "),

  ghost: [
    "relative",
    "text-[var(--ghost-default-font-color)]",
    // Hover
    "hover:bg-[var(--ghost-hover-background)] hover:text-[var(--ghost-hover-font-color)]",
    // Active / Pressed
    "active:bg-[var(--ghost-pressed-background)] active:text-[var(--ghost-pressed-font-color)]",
    // Focus visible
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "focus-visible:ring-[var(--ghost-focus-outline)] focus-visible:ring-offset-[var(--surface-base)]",
    // Disabled
    "disabled:bg-[var(--ghost-disabled-background)] disabled:text-[var(--ghost-disabled-font-color)]",
    "disabled:cursor-not-allowed disabled:hover:bg-transparent",
  ].join(" "),
};

/* ------------------------------------------------------------
   Classes per size — segueixen properties/{size}/{padding,height}
   ------------------------------------------------------------ */
const sizeClasses: Record<ButtonSize, string> = {
  sm: [
    "text-[14px] leading-[20px]",
    "h-[var(--button-sm-height)]",
    "px-[var(--button-sm-padding)]",
    "gap-[6px]",
  ].join(" "),
  md: [
    "text-[16px] leading-[24px]",
    "h-[var(--button-md-height)]",
    "px-[var(--button-md-padding)]",
    "gap-[8px]",
  ].join(" "),
  lg: [
    // Figma exacte: 20px / 28px / 64px alçada / 32px padding
    "text-[length:var(--button-large-font-size)] leading-[var(--button-large-line-height)]",
    "h-[var(--button-large-height)]",
    "px-[var(--button-large-padding)]",
    "gap-[8px]",
  ].join(" "),
};

/* ------------------------------------------------------------
   Classes per shape
   ------------------------------------------------------------ */
const shapeClasses: Record<ButtonShape, string> = {
  default: "rounded-[var(--radius-base)]",   // 16px (Figma: card-radius / number)
  pill: "rounded-full",
  square: "rounded-none",
};

/* ============================================================
   Component
   ============================================================ */
const ButtonInner = forwardRef<HTMLElement, ButtonProps>(function ButtonInner(props, ref) {
  const {
    variant = "solid",
    size = "lg",
    shape = "default",
    iconLeft,
    iconRight,
    loading = false,
    fullWidth = false,
    className = "",
    children,
    ...rest
  } = props;

  const baseClasses = [
    // Layout core
    "inline-flex items-center justify-center",
    "font-sans font-normal",
    "whitespace-nowrap select-none",
    // Transició suau (alineada amb el sistema)
    "transition-[background-color,color,border-color,transform] duration-300 ease-out",
    // Width
    fullWidth ? "w-full" : "w-auto",
    // Cursor en estat normal
    "cursor-pointer",
    // El focus-visible viu a cada variant (ring específic per Solid/Outline/Ghost)
  ].join(" ");

  const composedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    shapeClasses[shape],
    className,
  ].join(" ");

  // "Light Effect" subtil que travessa el botó al hover (només per a Solid)
  const lightEffect =
    variant === "solid" ? (
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
    ) : null;

  const content = (
    <>
      {lightEffect}
      {iconLeft && !loading && (
        <span className="inline-flex shrink-0 items-center justify-center" aria-hidden="true">
          {iconLeft}
        </span>
      )}
      {loading && (
        <span
          className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children && <span className="relative">{children}</span>}
      {iconRight && !loading && (
        <span className="inline-flex shrink-0 items-center justify-center" aria-hidden="true">
          {iconRight}
        </span>
      )}
    </>
  );

  // Polimorfisme: link o button
  if (props.as === "a") {
    const { as: _as, href, ...anchorProps } = rest as Omit<ButtonAsLink, keyof CommonButtonProps>;
    return (
      <motion.a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={`group ${composedClasses}`}
        whileTap={{ scale: 0.98 }}
        {...anchorProps}
      >
        {content}
      </motion.a>
    );
  }

  const { as: _as, disabled, ...buttonProps } = rest as Omit<ButtonAsButton, keyof CommonButtonProps>;

  return (
    <motion.button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={(buttonProps.type as "button" | "submit" | "reset") ?? "button"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`group ${composedClasses}`}
      whileTap={disabled || loading ? undefined : { scale: 0.98 }}
      {...buttonProps}
    >
      {content}
    </motion.button>
  );
});

export const Button = ButtonInner as <T extends ButtonProps>(
  props: T & { ref?: React.Ref<HTMLElement> }
) => React.ReactElement;

export default Button;
