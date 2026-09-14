"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import ContactModal from "@/components/contact/ContactModal"

/**
 * ContactModalContext
 * -------------------
 * La pàgina /contacte ja no existeix com a destí: el contacte és un modal
 * full-screen (cortina) accessible des de qualsevol CTA de la web
 * ("Comencem?", menú, footer, empty states...).
 *
 * Aquest context exposa `open()/close()` i munta el <ContactModal /> una
 * única vegada a l'arrel (SiteShell), de manera que qualsevol component
 * públic pot obrir-lo sense navegar.
 */

interface ContactModalContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
}

const ContactModalContext = createContext<ContactModalContextValue | null>(null)

export function ContactModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close])

  return (
    <ContactModalContext.Provider value={value}>
      {children}
      <ContactModal isOpen={isOpen} onClose={close} />
    </ContactModalContext.Provider>
  )
}

export function useContactModal(): ContactModalContextValue {
  const ctx = useContext(ContactModalContext)
  if (!ctx) {
    throw new Error("useContactModal s'ha d'usar dins de <ContactModalProvider>")
  }
  return ctx
}
