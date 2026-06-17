import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Sobre Mi",
  description:
    "Senior Product Designer amb més de 10 anys d'experiència construint solucions digitals per a corporacions i startups.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
