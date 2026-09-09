import { NavLink, Outlet } from 'react-router-dom'
import { LanguageToggle } from '../components/LanguageToggle'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

export function AdminShell() {
  const { user } = useAuth()
  const { t } = useLocale()
  const links = [
    { to: '/admin', label: t('admin.navDashboard'), end: true },
    { to: '/admin/submissions', label: t('admin.navSubmissions'), end: false },
    { to: '/admin/users', label: t('admin.navUsers'), end: false },
  ]
  return (
    <div className="min-h-[100dvh] bg-bg text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <NavLink to="/admin" className="tracking-[0.16em] text-accent">
            HEPHA-RNA ADMIN
          </NavLink>
          <div className="flex items-center gap-5 text-sm text-mute">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? 'text-ink' : 'hover:text-ink')}
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink to="/challenge" className="hover:text-ink">
              {t('admin.backChallenge')}
            </NavLink>
            <LanguageToggle />
            <span className="font-mono">{user?.username}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
