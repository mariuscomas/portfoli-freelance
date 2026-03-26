"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
}

interface PageNavPillProps {
  items: NavItem[];
}

export default function PageNavPill({ items }: PageNavPillProps) {
  return (

    <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-6">
      <Link
        href="#serveis-list"
        className="group flex items-center gap-2 text-body-md font-medium hover:opacity-70 transition-opacity"
      >
        <span>Coneix els meus serveis</span>
        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </Link>

      <nav className="flex items-center gap-2 p-1.5 bg-surface-border/30 rounded-full w-fit">
        {items.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={`px-6 py-2 rounded-full text-body-sm transition-all duration-300 ${index === 0
              ? "bg-text-main text-surface-base font-medium"
              : "hover:bg-surface-border/50 text-text-secondary"
              }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>


    </div>
  );
}
