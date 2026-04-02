import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WorkDetailLayout from "@/components/works/detail/WorkDetailLayout";
import { WorkDetailData } from "@/types/works";
import { createClient } from "@/utils/supabase/server";

// Aquesta és la dada mockejada per si no hi ha contingut introduït a Supabase encara
const mockWorkData: Record<string, WorkDetailData> = {
  "padll": {
    id: "padll-1",
    slug: "padll",
    hero: {
      title: "PADLL",
      description: "Disseny d'un MVP amb perfil dual per connectar surfistes i facilitar reserves online optimitzant la interacció amb escoles.",
      backgroundColor: "#5C7894"
    },
    blocks: [
      {
        id: "block-1",
        textSection: {
          id: "ts-1",
          number: "01",
          title: "Project Overview",
          heading: "Connectar dos mons en una mateixa experiència",
          description: "Mancava una eina centralitzada que permetés als surfistes particulars trobar i reservar de forma fàcil material i classes ales diferents escoles locals mentre, des de la perspectiva del negoci, es facilitava la gestió interna de tot aquest volum.",
          listType: "characteristics",
          listDetails: [
            { label: "Type", value: "UI/UX Design" },
            { label: "Engagement", value: "Mobile App Design" },
            { label: "Category", value: "Sports & Booking Platform" },
            { label: "Model", value: "MVP" }
          ]
        },
        media: [
          { id: "m1", url: "/images/image_treballs_prova.png", type: "image", alt: "PADLL Flow 1" }
        ]
      },
      {
        id: "block-2",
        textSection: {
          id: "ts-2",
          number: "02",
          title: "Disseny Visual",
          heading: "Tipografia i coherència amb un sentit esportiu modern",
          description: "La tria del llenguatge visual es va centrar en aportar una sensació de frescor, moviment, i claredat per assegurar una llegibilitat màxima sota la llum intensa d'indrets de platja.",
          listType: "what-we-did",
          listItems: [
            "Creació de llibreria de components base.",
            "Definició de paleta cromàtica contrastada per ús a l'exterior.",
            "Sistema tipogràfic jeràrquic."
          ]
        },
        media: [
          { id: "m2a", url: "/images/image_treballs_prova.png", type: "image" },
          { id: "m2b", url: "/images/image_treballs_prova.png", type: "image" },
          { id: "m2c", url: "/images/image_treballs_prova.png", type: "image" },
          { id: "m2d", url: "/images/image_treballs_prova.png", type: "image" }
        ]
      },
      {
        id: "block-3",
        textSection: {
          id: "ts-3",
          number: "03",
          title: "Interacció",
          heading: "Fluiditat i Micro-interaccions",
          description: "Hem aplicat principis d'accessibilitat sumats a interaccions molt àgils per garantir completesa d'accions en passos molt curts per optimitzar la retenció dels usuaris freqüents.",
          listType: "what-we-did",
          listItems: [
            "Wireframing interactiu per testeig.",
            "Testos d'usuari amb prototips d'alta fidelitat.",
            "Ajustaments de corbes d'animació en transitions clau."
          ]
        },
        media: [
          { id: "m3a", url: "/images/image_treballs_prova.png", type: "image" }
        ]
      },
      {
        id: "block-4",
        textSection: {
          id: "ts-4",
          number: "04",
          title: "Resultats",
          heading: "Llançament del MVP i resposta inicial",
          description: "L'esforç va convergir en un MVP sòlid i escalable que proveeix la base tecnològica necessària per seguir desenvolupant futures etapes del roadmap.",
          listType: "none",
        },
        media: [
          { id: "m4a", url: "/images/image_treballs_prova.png", type: "image" },
          { id: "m4b", url: "/images/image_treballs_prova.png", type: "image" }
        ]
      }
    ],
    conclusion: "Un projecte en constant evolució. Transformar les idees inicials en una solució tangible ha estat un repte apassionant. Ara, amb l'MVP al mercat, seguirem escoltant els usuaris, aprenent i iterant per portar l'experiència al següent nivell.",
    finalMedia: [
      { id: "fmt", url: "/images/image_treballs_prova.png", type: "image" }
    ],
    nextProject: {
      title: "Health Tracker App",
      slug: "health-tracker"
    }
  }
};

export const metadata: Metadata = {
  title: "Detall Projecte | Màrius - Portfoli",
};

const isTranslationObj = (obj: any) => {
  return typeof obj === "object" && obj !== null && !Array.isArray(obj) && ("ca" in obj || "en" in obj || "es" in obj);
};

const deepTranslate = (obj: any, locale = "ca"): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => deepTranslate(item, locale));
  }
  if (isTranslationObj(obj)) {
    return obj[locale] || obj.ca || "";
  }
  if (typeof obj === "object" && obj !== null) {
    const translatedObj: any = {};
    for (const key in obj) {
      translatedObj[key] = deepTranslate(obj[key], locale);
    }
    return translatedObj;
  }
  return obj;
};

// ... per mantenir retrocompatibilitat als root items
const getTranslation = (field: any, locale = "ca") => {
  if (isTranslationObj(field)) {
    return field[locale] || field.ca || "";
  }
  return field || "";
};

export default async function ProjectDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const currentSlug = resolvedParams.slug;

  const supabase = await createClient();

  // Obtenim tots els projectes publicats per avaluar slugs jsonb i trobar el pròxim
  const { data: allWorks } = await supabase
    .from("works")
    .select("*")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  if (!allWorks || allWorks.length === 0) {
    const data = mockWorkData[currentSlug] || mockWorkData["padll"];
    return (
      <main className="flex min-h-[100dvh] flex-col w-full overflow-x-hidden bg-surface-base">
        <WorkDetailLayout data={data} />
      </main>
    );
  }

  const currentIndex = allWorks.findIndex(w => getTranslation(w.slug) === currentSlug);
  const work = allWorks[currentIndex];

  if (!work) {
    if (mockWorkData[currentSlug]) {
       return (
         <main className="flex min-h-[100dvh] flex-col w-full overflow-x-hidden bg-surface-base">
           <WorkDetailLayout data={mockWorkData[currentSlug]} />
         </main>
       );
    }
    notFound();
  }

  const nextWork = allWorks[currentIndex + 1] || allWorks[0];
  const nextProject = {
    title: getTranslation(nextWork.title),
    slug: getTranslation(nextWork.slug)
  };

  const rawContent = work.content || {};
  const content = deepTranslate(rawContent);

  // Formateig adaptat al nostre disseny de components
  const mappedData: WorkDetailData = {
    id: work.id.toString(),
    slug: currentSlug,
    hero: {
      title: getTranslation(work.title),
      description: getTranslation(work.short_description),
      backgroundColor: work.hero_color || content.hero_color || "#1A1A1A"
    },
    blocks: content.blocks || mockWorkData["padll"].blocks, // Fallback visual
    conclusion: typeof work.conclusion === "string" ? work.conclusion : (getTranslation(work.conclusion) || content.conclusion || ""),
    finalMedia: content.finalMedia || [],
    nextProject
  };

  return (
    <main className="flex min-h-[100dvh] flex-col w-full overflow-x-hidden bg-surface-base">
      <WorkDetailLayout data={mappedData} />
    </main>
  );
}
