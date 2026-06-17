"use client"

import { useCallback, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Briefcase,
  Wrench,
  UsersThree,
  SignOut,
  SidebarSimple,
} from '@phosphor-icons/react'
import { createClient } from '@/utils/supabase/client'
import Logo from '@/components/common/Logo'
import LogoSmall from '@/components/common/LogoSmall'

/**
 * Shell del dashboard /admin.
 *
 * Sidebar a l'esquerra (md+) col·lapsable per recuperar espai a pantalles
 * grans: estat persistit a localStorage. Quan està col·lapsada mostra
 * només icones + el logotip petit ("M"); expandit mostra el wordmark
 * complet i les etiquetes textuals.
 *
 * A mòbil (<md) sempre apareix com a top nav horitzontal.
 */

const NAV_ITEMS = [
  { href: '/admin/works', label: 'Treballs', icon: Briefcase },
  { href: '/admin/serveis', label: 'Serveis', icon: Wrench },
  { href: '/admin/clients', label: 'Clients', icon: UsersThree },
] as const

const STORAGE_KEY = 'admin-sidebar-collapsed'
const COLLAPSED_EVENT = 'admin-sidebar-collapsed-change'

/**
 * Subscriu canvis a la preferència del sidebar. Reacciona tant a `storage`
 * (canvis cross-tab) com a un esdeveniment custom (canvis dins la mateixa
 * tab, ja que `storage` no s'emet a la finestra que escriu).
 */
function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', callback)
  window.addEventListener(COLLAPSED_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(COLLAPSED_EVENT, callback)
  }
}

function getSnapshot(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * Server snapshot: sempre `false` (sidebar expandida) per evitar mismatch.
 * Si l'usuari tenia la sidebar col·lapsada, hi haurà un petit flicker
 * inicial — trade-off acceptable vs hydration error.
 */
function getServerSnapshot(): boolean {
  return false
}

export default function AdminShell({
  user,
  children,
}: {
  user: { email?: string }
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  /**
   * Sidebar col·lapsada o expandida. Sincronitzada amb localStorage via
   * useSyncExternalStore (React 18+) — patró correcte per llegir d'un
   * store extern de manera SSR-safe.
   */
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setCollapsed = useCallback((next: boolean | ((prev: boolean) => boolean)) => {
    if (typeof window === 'undefined') return
    const current = getSnapshot()
    const value = typeof next === 'function' ? next(current) : next
    try {
      window.localStorage.setItem(STORAGE_KEY, String(value))
    } catch {
      /* localStorage no disponible */
    }
    // Notifiquem subscriptors de la mateixa tab (storage no es dispara aquí).
    window.dispatchEvent(new Event(COLLAPSED_EVENT))
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col md:flex-row bg-surface-base">

      {/* Sidebar (md+) / Top nav (mobile).
          L'amplada a md+ es controla via Tailwind `data-*` variant:
          - Per defecte (expandit) → md:w-64
          - Si data-collapsed=true → md:data-[collapsed=true]:w-16 guanya
            per major especificitat (atribut + classe). */}
      <aside
        data-collapsed={collapsed ? 'true' : 'false'}
        className="w-full md:w-64 md:data-[collapsed=true]:w-16 md:min-h-[100dvh] flex md:flex-col flex-row md:justify-between justify-between items-stretch border-b md:border-b-0 md:border-r border-surface-border bg-surface-card transition-[width] duration-200"
      >

        {/* Top: Logo + nav */}
        <div className="flex md:flex-col flex-row items-stretch flex-1 md:flex-none">
          <Link
            href="/"
            className={`flex items-center text-text-main hover:text-accent transition-colors ${
              collapsed ? 'md:px-0 md:py-6 md:justify-center' : 'md:px-6 md:py-6'
            } px-6 py-4`}
            aria-label="Anar a la home pública"
            title="Anar a la home pública"
          >
            {collapsed ? <LogoSmall /> : <Logo />}
          </Link>

          <nav className={`flex md:flex-col flex-row gap-0 md:gap-1 ${collapsed ? 'md:px-2' : 'md:px-3'} md:py-4 flex-1`}>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 ${
                    collapsed ? 'md:px-2 md:justify-center' : 'md:px-3'
                  } md:py-2.5 px-4 py-3 rounded-none md:rounded-md text-body-md transition-colors ${
                    isActive
                      ? 'text-text-main bg-surface-base'
                      : 'text-text-secondary hover:text-text-main hover:bg-surface-base'
                  }`}
                  title={collapsed ? label : undefined}
                >
                  <Icon size={20} weight="regular" />
                  {/* Etiqueta visible només en mode expandit (i sempre a mòbil) */}
                  <span className={collapsed ? 'md:hidden' : ''}>{label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom: collapse toggle + user info + sign out (md+) */}
        <div
          className={`hidden md:flex flex-col gap-1 ${
            collapsed ? 'md:px-2' : 'md:px-3'
          } py-4 border-t border-surface-border`}
        >
          {/* Toggle collapse */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`flex items-center gap-3 ${
              collapsed ? 'md:px-2 md:justify-center' : 'md:px-3'
            } py-2.5 rounded-md text-body-md text-text-secondary hover:text-text-main hover:bg-surface-base transition-colors w-full text-left`}
            title={collapsed ? 'Expandir sidebar' : 'Col·lapsar sidebar'}
            aria-label={collapsed ? 'Expandir sidebar' : 'Col·lapsar sidebar'}
          >
            <SidebarSimple
              size={20}
              weight="regular"
              className={collapsed ? '' : 'rotate-180'}
            />
            <span className={collapsed ? 'md:hidden' : ''}>
              {collapsed ? 'Expandir' : 'Col·lapsar'}
            </span>
          </button>

          {/* Email (només expandit) */}
          {!collapsed && user.email && (
            <span className="px-3 mt-2 text-body-xs text-text-secondary truncate" title={user.email}>
              {user.email}
            </span>
          )}

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className={`flex items-center gap-3 ${
              collapsed ? 'md:px-2 md:justify-center' : 'md:px-3'
            } py-2.5 rounded-md text-body-md text-text-secondary hover:text-text-main hover:bg-surface-base transition-colors w-full text-left`}
            title="Tancar sessió"
            aria-label="Tancar sessió"
          >
            <SignOut size={20} weight="regular" />
            <span className={collapsed ? 'md:hidden' : ''}>Sortir</span>
          </button>
        </div>

        {/* Mobile sign out */}
        <button
          onClick={handleSignOut}
          className="md:hidden flex items-center justify-center px-4 py-3 text-text-secondary hover:text-text-main transition-colors"
          aria-label="Sortir"
        >
          <SignOut size={20} weight="regular" />
        </button>
      </aside>

      {/* Main content. `scroll-smooth` perquè els salts via anchor del TOC
          (clicar una secció) facin un scroll animat en lloc d'un salt
          brusc. El scroll viu dins de main (h-screen + overflow-y-auto). */}
      <main className="flex-1 w-full overflow-y-auto scroll-smooth">
        {children}
      </main>

    </div>
  )
}
