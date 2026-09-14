import { cookies } from "next/headers";
import IntroLoader from "@/components/common/IntroLoader";
import Hero from "@/components/home/Hero";
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

  return (
    <main className="flex min-h-screen flex-col overflow-x-clip">
      {/* Intro d'entrada del site (un cop per sessió, només load inicial) */}
      <IntroLoader play={playIntro} />
      {/* Hero amb camp reactiu. Substitueix l'escena cercle→franja de vídeo
          (ShowcaseVideo, retirat) mentre el showreel no està produït. */}
      <Hero introPending={playIntro} />
      <WorksTeaser />
      <AboutTeaser />
      <Clients />
    </main>
  );
}
