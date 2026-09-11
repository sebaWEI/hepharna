import { Cube, SignOut } from '@phosphor-icons/react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LanguageToggle } from '../components/LanguageToggle'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

export function AppShell() {
  const { user, logout } = useAuth()
  const { t } = useLocale()
  const location = useLocation()
  const kiosk = new URLSearchParams(location.search).get('kiosk') === '1'
  if (kiosk) return <Outlet />

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/challenge', label: t('nav.challenge') },
    { to: '/reference', label: t('nav.hepha') },
    { to: '/leaderboard', label: t('nav.leaderboard') },
    { to: '/minecraft', label: t('nav.minecraft') },
  ]

  return (
    <div className="app-frame min-h-[100dvh] bg-bg text-ink">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-bg/90 backdrop-blur">
        <div className="site-header-inner mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <NavLink to="/" className="brand font-semibold text-accent">
            HEPHA-RNA
          </NavLink>
          <nav className="hidden items-center gap-1 text-sm text-mute xl:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="nav-link"
              >
                {link.label}
              </NavLink>
            ))}
            {user?.role === 'admin' ? (
              <NavLink to="/admin" className="nav-link">
                {t('nav.admin')}
              </NavLink>
            ) : null}
          </nav>
          <div className="flex shrink-0 items-center gap-2 text-sm sm:gap-3">
            <LanguageToggle />
            {user ? (
              <>
                <span className="hidden font-mono text-xs text-mute lg:inline">{user.participant_id}</span>
                <button onClick={logout} className="inline-flex min-h-10 items-center gap-1 whitespace-nowrap text-mute hover:text-ink">
                  <SignOut size={16} />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <NavLink to="/login" className="action-link rounded-full bg-accent px-4 py-2 text-bg">
                {t('nav.login')}
              </NavLink>
            )}
          </div>
        </div>
        <nav className="nav-scroll mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 text-sm text-mute sm:px-6 xl:hidden">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className="nav-link">
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="border-t border-line/80 px-4 py-8 text-center text-sm text-mute">
        <p className="inline-flex max-w-xl items-center justify-center gap-2 leading-relaxed">
          <Cube size={16} />
          {t('nav.footer')}
        </p>
      </footer>
    </div>
  )
}
