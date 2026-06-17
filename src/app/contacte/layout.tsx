import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contacte",
  description:
    "Tens una idea o un producte digital al cap? Parlem-ne. Respostes en menys de 24 hores i primera trucada exploratòria sense compromís.",
  path: "/contacte",
});

export default function ContacteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
