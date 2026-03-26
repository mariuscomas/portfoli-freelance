"use client";

import React from "react";
import SharedPageHero from "@/components/common/SharedPageHero";
import PageNavPill from "@/components/common/PageNavPill";
import ServicesList from "@/components/services/ServicesList";

const navItems = [
  { label: "Productes", href: "#productes" },
  { label: "Col·laboració", href: "#colaboracio" },
];

export default function ServicesPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col w-full overflow-x-hidden bg-surface-base">
      <SharedPageHero
        title="Serveis"
        description="La meva història no comença amb un llapis, sinó amb línies de codi. Aquesta base tècnica em permet dissenyar productes viables, escalables i amb una estètica impecable."
        bottomContent={<PageNavPill items={navItems} />}
      />
      
      <ServicesList />
    </main>
  );
}
