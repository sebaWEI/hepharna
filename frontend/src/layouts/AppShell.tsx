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
    <div className="min-h-[100dvh] bg-bg text-ink">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <NavLink to="/" className="font-medium tracking-[0.18em] text-accent">
            HEPHA-RNA
          </NavLink>
          <nav className="hidden items-center gap-6 text-sm text-mute md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => (isActive ? 'text-ink' : 'hover:text-ink')}
              >
                {link.label}
              </NavLink>
            ))}
            {user?.role === 'admin' ? (
              <NavLink to="/admin" className="hover:text-ink">
                {t('nav.admin')}
              </NavLink>
            ) : null}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <LanguageToggle />
            {user ? (
              <>
                <span className="hidden font-mono text-mute sm:inline">{user.participant_id}</span>
                <button onClick={logout} className="inline-flex items-center gap-1 text-mute hover:text-ink">
                  <SignOut size={16} />
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <NavLink to="/login" className="rounded-full bg-accent px-4 py-2 text-bg">
                {t('nav.login')}
              </NavLink>
            )}
          </div>
        </div>
        <nav className="flex gap-4 overflow-x-auto px-4 pb-3 text-sm text-mute md:hidden">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'text-ink' : '')}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-line/80 px-4 py-8 text-center text-sm text-mute">
        <p className="inline-flex items-center gap-2">
          <Cube size={16} />
          {t('nav.footer')}
        </p>
      </footer>
    </div>
  )
}
