"use client";

import Link, { LinkProps } from "next/link";
import { useTransition } from "@/context/TransitionContext";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const handleTransition = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Si hi ha un onClick passat per props, l'executem
    if (props.onClick) {
      props.onClick(e);
    }

    // Si l'esdeveniment ja ha estat previngut per l'altre onClick, no continuem amb la transició
    if (e.defaultPrevented) return;

    const hrefString = typeof href === 'string' ? href : href.pathname || '/';
    
    // Si és un link extern, un link amb target="_blank" o un link d'ancoratge (#), no fem transició
    const isExternal = hrefString.startsWith('http') || hrefString.startsWith('//');
    const isHash = hrefString.startsWith('#');
    
    if (isExternal || isHash || props.target === '_blank') {
      if (isHash) {
        // Deixem que Next.js ho gestioni normalment
        return;
      }
      e.preventDefault();
      window.open(hrefString, props.target || '_self');
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
    >
      {children}
    </Link>
  );
}
