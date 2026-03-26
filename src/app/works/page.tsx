import type { Metadata } from "next";
import WorksGallery from "@/components/works/WorksGallery";

export const metadata: Metadata = {
  title: "Treballs | Màrius - Portfoli Freelance",
  description: "Descobreix els meus projectes i treballs recents.",
};

export default function TreballsPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col w-full overflow-x-hidden bg-surface-base">
      <WorksGallery />
    </main>
  );
}
