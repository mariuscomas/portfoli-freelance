import Link from "next/link";
import Logo from "@/components/common/Logo";
import ThemeToggle from "@/components/common/ThemeToggle";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 md:px-[3vw] lg:px-[4vw] h-[80px] md:h-[120px] bg-surface-base">
      
      {/* Esquerra (Logo) */}
      <Link href="/" aria-label="Inici" className="hover:opacity-80 transition-opacity">
        <Logo />
      </Link>

      {/* Centre (Navegació Absoluta per simetria perfecta) */}
      <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-6 lg:gap-10">
        {["Treballs", "Serveis", "Mètode", "About"].map((item) => (
          <Link
            key={item}
            href={`#${item.toLowerCase().replace('è', 'e')}`}
            className="font-sans text-[14px] lg:text-[15px] font-medium text-text-main hover:text-text-secondary transition-colors"
          >
            {item}
          </Link>
        ))}
      </nav>

      {/* Dreta (Accions) */}
      <div className="flex items-center gap-4 lg:gap-6">
        <Link
          href="#contacte"
          className="group relative hidden md:inline-block font-sans text-[14px] lg:text-[15px] font-medium text-text-main pb-[2px] overflow-hidden"
        >
          Comencem?
          {/* Underline permanent que desapareix cap a la dreta i torna per l'esquerra al fer hover */}
          <span className="absolute left-0 bottom-0 w-full h-[1.5px] bg-text-main origin-right transition-transform duration-300 ease-out group-hover:scale-x-0" />
          <span className="absolute left-0 bottom-0 w-full h-[1.5px] bg-text-main origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 delay-[0.1s]" />
        </Link>
        <ThemeToggle />
      </div>

    </header>
  );
}
