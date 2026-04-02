import React from "react";
import SharedPageHero from "@/components/common/SharedPageHero";
import PageNavPill from "@/components/common/PageNavPill";
import ServicesList from "@/components/services/ServicesList";
import { createClient } from "@/utils/supabase/server";

const navItems = [
  { label: "Productes", href: "#productes" },
  { label: "Col·laboració", href: "#colaboracio" },
];

export default async function ServicesPage() {
  const supabase = await createClient();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  return (
    <main className="flex min-h-[100dvh] flex-col w-full overflow-x-hidden bg-surface-base">
      <SharedPageHero
        title="Serveis"
        description="La meva història no comença amb un llapis, sinó amb línies de codi. Aquesta base tècnica em permet dissenyar productes viables, escalables i amb una estètica impecable."
        bottomContent={<PageNavPill items={navItems} />}
      />
      
      <ServicesList services={services || []} />
    </main>
  );
}
