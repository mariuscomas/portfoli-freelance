import Hero from "@/components/sections/Hero";
import ShowcaseVideo from "@/components/sections/ShowcaseVideo";
import Works from "@/components/sections/Works";
import Clients from "@/components/sections/Clients";
import AboutTeaser from "@/components/sections/AboutTeaser";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col overflow-hidden">
      <Hero />
      <ShowcaseVideo />
      <Works />
      <Clients />
      <AboutTeaser />
    </main>
  );
}
