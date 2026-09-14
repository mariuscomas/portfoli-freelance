"use client";

import Link, { LinkProps } from "next/link";
import { useTransition } from "@/context/TransitionContext";
import React, { ComponentPropsWithoutRef } from "react";

interface TransitionLinkProps extends LinkProps, Omit<ComponentPropsWithoutRef<'a'>, keyof LinkProps> {
  children: React.ReactNode;
  className?: string;
}

export default function TransitionLink({
  href,
  children,
  className,
  ...props
}: TransitionLinkProps) {
  const { triggerTransition } = useTransition();

  const hrefString = typeof href === 'string' ? href : href.pathname || '/';

  // Detectem el tipus d'enllaç
  const isExternal = hrefString.startsWith('http') || hrefString.startsWith('//');
  const isHash = hrefString.startsWith('#');

  // Els enllaços externs s'obren en una pestanya nova per defecte (no perdem la web),
  // tret que qui crida indiqui un target propi. Sempre amb rel segur quan és _blank.
  const computedTarget = props.target ?? (isExternal ? '_blank' : undefined);
  const computedRel =
    props.rel ?? (computedTarget === '_blank' ? 'noopener noreferrer' : undefined);

  const handleTransition = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Si hi ha un onClick passat per props, l'executem
    if (props.onClick) {
      props.onClick(e);
    }

    // Si l'esdeveniment ja ha estat previngut per l'altre onClick, no continuem amb la transició
    if (e.defaultPrevented) return;

    // Extern, target="_blank" o ancoratge (#): no fem transició de pàgina
    if (isExternal || isHash || computedTarget === '_blank') {
      if (isHash) {
        // Deixem que Next.js ho gestioni normalment
        return;
      }
      e.preventDefault();
      window.open(
        hrefString,
        computedTarget || '_self',
        computedTarget === '_blank' ? 'noopener,noreferrer' : undefined
      );
      return;
    }

    e.preventDefault();
    triggerTransition(hrefString);
  };

  return (
    <Link
      href={href}
      className={className}
      onClick={handleTransition}
      {...props}
      target={computedTarget}
      rel={computedRel}
    >
      {children}
    </Link>
  );
}
