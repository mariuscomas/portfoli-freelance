"use client"

import { usePathname } from 'next/navigation'
import NavigationWrapper from '@/components/layout/NavigationWrapper'
import Footer from '@/components/layout/Footer'
import SiteControls from '@/components/common/SiteControls'
import { FooterRevealProvider } from '@/context/FooterRevealContext'
import { ContactModalProvider } from '@/context/ContactModalContext'

/**
 * SiteShell — embolcalla el contingut amb Header/Footer del portfoli públic,
 * però els amaga a les zones internes (admin, auth) on no aporten res.
 *
 * És un Client Component perquè necessitem `usePathname`. El RootLayout
 * continua sent Server Component.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Zones sense Header/Footer del portfoli: l'admin, l'auth i les propostes
  // (qui obre /proposta ve d'un enllaç privat i ja té capçalera pròpia;
  // un menú de màrqueting només li oferiria sortides).
  const isInternalArea =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/proposta')

  if (isInternalArea) {
    // Zones internes: render minimalista, sense Header ni Footer del portfoli
    return <main>{children}</main>
  }

  // FooterRevealProvider permet que el Header sàpiga quan el footer es revela
  // i faci fade-out.
  //
  // EFECTE CORTINA: el contingut va en una capa opaca (bg-surface-base) amb
  // `relative z-[1]` PER SOBRE del footer (sticky z-0) i el tapa mentre
  // s'aixeca amb el scroll.
  // IMPORTANT: la cortina té z POSITIU i el footer z-0 (no -z-10): amb z
  // negatiu el footer queda darrere del fons del body en el hit-testing i
  // els seus inputs/links no reben clics. Dins del stacking context de la
  // cortina, el Header (fixed z-50) i el menú (z-[100]) segueixen per sobre
  // del contingut; el ContactModal (z-[110]) és germà al context arrel i
  // queda per sobre de tot.
  // ContactModalProvider munta el modal de contacte (cortina) una única
  // vegada per a tota l'àrea pública: Header, menú, footer i pàgines poden
  // obrir-lo via useContactModal().
  return (
    <FooterRevealProvider>
      <ContactModalProvider>
        <div className="relative z-[1] bg-surface-base transition-colors duration-[800ms] ease-in-out">
          <NavigationWrapper>{children}</NavigationWrapper>
          {/* Controls d'utilitat globals (idioma + tema), fixos a baix a
              l'esquerra a totes les pàgines públiques. Dins de la cortina
              perquè el menú (z-[100]) i el Header (z-50) quedin per sobre. */}
          <SiteControls />
        </div>
        <Footer />
      </ContactModalProvider>
    </FooterRevealProvider>
  )
}

