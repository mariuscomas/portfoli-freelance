import type { Metadata } from 'next'

/*
  Layout per a la zona /admin.
  Volem que aquesta zona NO mostri:
  - El Header del portfolio (logo + menu)
  - El Footer del portfolio
  Però el RootLayout ja els munta sempre. La solució més neta és que el
  RootLayout ja exclou /admin/* del Header/Footer. Per ara aquest layout
  només defineix metadata i estructura bàsica.
*/

export const metadata: Metadata = {
  title: 'Dashboard | Màrius',
  robots: { index: false, follow: false }, // No indexem la zona admin
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] w-full bg-surface-base text-text-main">
      {children}
    </div>
  )
}
