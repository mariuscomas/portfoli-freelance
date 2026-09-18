import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { SERVICE_COLUMNS, productsFrom } from "@/lib/services";
import IntroLoader from "@/components/common/IntroLoader";
import Hero from "@/components/home/Hero";
import SplitFunnel from "@/components/home/SplitFunnel";
import ServicesTeaser from "@/components/home/ServicesTeaser";
import CollabBreak from "@/components/home/CollabBreak";
import CollabTeaser from "@/components/home/CollabTeaser";
import WorksTeaser from "@/components/home/WorksTeaser";
import Clients from "@/components/home/Clients";
import AboutTeaser from "@/components/home/AboutTeaser";

export default async function Home() {
  /*
    Intro un cop per sessió de navegador: la cookie de sessió `mf-intro-seen`
    la posa l'IntroLoader al client quan comença a reproduir-se. Llegint-la
    AQUÍ (servidor), el primer HTML ja és correcte en tots dos casos:
    - Sessió nova → cortina completa des del primer byte + hero en estat
      d'espera (l'entrada arrenca sincronitzada amb el reveal de l'intro).
    - Sessió repetida → cap overlay i entrada del hero immediata, com sempre.
    La ruta ja és dinàmica (el layout llegeix la cookie del tema).
  */
  const cookieStore = await cookies();
  const playIntro = cookieStore.get("mf-intro-seen")?.value !== "1";

  /*
    Tríada de serveis: MATEIXA font que /serveis (taula `services` + pricing.ts).
    Si la home tingués el seu propi catàleg, tard o d'hora diria un preu
    diferent del hub. `productsFrom` cau al catàleg de codi si la consulta falla.
  */
  const supabase = await createClient();
  const { data: serviceRows } = await supabase
    .from("services")
    .select(SERVICE_COLUMNS)
    .eq("is_published", true)
    .order("order_index", { ascending: true });
  const products = productsFrom(serviceRows);

  return (
    <main className="flex min-h-screen flex-col overflow-x-clip">
      {/* Intro d'entrada del site (un cop per sessió, només load inicial) */}
      <IntroLoader play={playIntro} />
      {/* Hero amb camp reactiu. Substitueix l'escena cercle→franja de vídeo
          (ShowcaseVideo, retirat) mentre el showreel no està produït. */}
      <Hero introPending={playIntro} />
      {/* Cortina d'obertura del tall: CollabBreak puja 100svh per sota (-mt).
          SplitFunnel i Serveis fan de cortina junts (z-10, fons opac) perquè
          si Serveis fa menys d'una pantalla el tall no tapi el Split. */}
      <div className="relative z-10 flex flex-col bg-surface-base">
        <SplitFunnel />
        <ServicesTeaser products={products} />
      </div>
      <CollabBreak />
      {/* Cortina de tancament del tall: la resta de la home puja per sobre
          de l'escenari fixat de CollabBreak (-mt 100svh, z-10, fons opac).
          Amb reduced-motion no hi ha solapament. */}
      <div className="relative z-10 -mt-[100svh] flex flex-col bg-surface-base motion-reduce:mt-0">
        <CollabTeaser />
        <WorksTeaser />
        <AboutTeaser />
        <Clients />
      </div>
    </main>
  );
}
