import type { Metadata } from "next";
import WorksGallery from "@/components/works/WorksGallery";
import { createClient } from "@/utils/supabase/server";
import { Project } from "@/types";

export const metadata: Metadata = {
  title: "Treballs | Màrius - Portfoli Freelance",
  description: "Descobreix els meus projectes i treballs recents.",
};

const getTranslation = (field: any, locale = 'ca') => {
  if (typeof field === 'object' && field !== null) {
    return field[locale] || field.ca || "";
  }
  return field || "";
};

export default async function TreballsPage() {
  const supabase = await createClient();

  // Consulta de tots els treballs publicats
  const { data: works } = await supabase
    .from("works")
    .select("*")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  // Mapeig de la base de dades (tipus intern Supabase) cap al Component (tipus Project)
  const projects: Project[] = (works || []).map((work) => {
    return {
      id: work.id,
      title: getTranslation(work.title),
      category: getTranslation(work.role) || "Project", 
      slug: getTranslation(work.slug),
      image: work.main_image_url || undefined,
      bgColor: work.hero_color || work.content?.hero_color || undefined,
    };
  });

  return (
    <main className="flex min-h-[100dvh] flex-col w-full overflow-x-hidden bg-surface-base">
      <WorksGallery projects={projects} />
    </main>
  );
}
