import { buildMetadata } from "@/lib/seo";

/**
 * La ruta /contacte només obre el modal i redirigeix a la home: per a un
 * crawler sense JS és una pàgina en blanc. Es manté per als enllaços antics,
 * però fora de l'índex — si no, el canonical apunta a una pàgina buida.
 */
export const metadata = buildMetadata({
  title: "Contacte",
  description:
    "Tens una idea o un producte digital al cap? Parlem-ne. Resposta en menys de 48 hores laborables i primera trucada exploratòria sense compromís.",
  path: "/contacte",
  noIndex: true,
});

export default function ContacteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
