import Hero from "@/components/home/Hero";
import ShowcaseVideo from "@/components/home/ShowcaseVideo";
import WorksTeaser from "@/components/home/WorksTeaser";
import Clients from "@/components/home/Clients";
import AboutTeaser from "@/components/home/AboutTeaser";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col overflow-hidden">
      <Hero />
      <ShowcaseVideo />
      <WorksTeaser />
      <Clients />
      <AboutTeaser />
    </main>
  );
}
