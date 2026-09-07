import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from './icons'
import Sidebar from './Sidebar'
import { sectionTheme } from '../utils/sectionTheme'
import { SectionThemeProvider } from './SectionTheme'

/**
 * The app shell.
 *
 * On a laptop the sidebar is permanent and can be folded down to a rail of
 * icons with the button in its header — useful on a small laptop screen where
 * the wide forms need the room. On a narrow screen it slides in as a drawer
 * instead. Only the main region changes between screens.
 */
export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  // Each section of the system has its own colour, so the whole page changes
  // when you move between them — the quickest way to know where you are.
  const theme = sectionTheme(location.pathname)

  // Every screen starts at the top, the way a real page navigation would.
  useEffect(() => {
    window.scrollTo({ top: 0 })
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className={`min-h-screen transition-colors ${theme.page}`}>
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-200 lg:block ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((open) => !open)} />
      </aside>

      {/* Mobile / tablet drawer */}
      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-xl">
            <Sidebar onNavigate={() => setMenuOpen(false)} onClose={() => setMenuOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className={`transition-[padding] duration-200 ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        {/* Compact bar that only exists on small screens, to reach the menu. */}
        <div className="flex items-center gap-3 border-b border-brand-800 bg-brand-900 px-4 py-3 text-white lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-700 px-3 py-2 text-base font-semibold hover:bg-brand-800"
          >
            <Menu size={20} aria-hidden="true" />
            Menu
          </button>
          <span className="text-lg font-extrabold tracking-tight">Raso Pakistan</span>
        </div>

        <main className={`min-h-screen transition-colors ${theme.page}`}>
          <SectionThemeProvider pathname={location.pathname}>
            <Outlet />
          </SectionThemeProvider>
        </main>
      </div>
    </div>
  )
}

/** Standard padded wrapper for the body of a screen, under the page header. */
export function PageBody({ children, className = '' }) {
  return <div className={`space-y-6 px-5 py-6 sm:px-8 sm:py-8 ${className}`}>{children}</div>
}
