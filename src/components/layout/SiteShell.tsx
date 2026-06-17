"use client"

import { usePathname } from 'next/navigation'
import NavigationWrapper from '@/components/layout/NavigationWrapper'
import Footer from '@/components/layout/Footer'

/**
 * SiteShell — embolcalla el contingut amb Header/Footer del portfoli públic,
 * però els amaga a les zones internes (admin, auth) on no aporten res.
 *
 * És un Client Component perquè necessitem `usePathname`. El RootLayout
 * continua sent Server Component.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isInternalArea = pathname.startsWith('/admin') || pathname.startsWith('/auth')

  if (isInternalArea) {
    // Zones internes: render minimalista, sense Header ni Footer del portfoli
    return <main>{children}</main>
  }

  return (
    <>
      <NavigationWrapper>{children}</NavigationWrapper>
      <Footer />
    </>
  )
}
