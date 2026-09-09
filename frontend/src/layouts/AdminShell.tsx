import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/submissions', label: 'Submissions', end: false },
  { to: '/admin/users', label: 'Users', end: false },
]

export function AdminShell() {
  const { user } = useAuth()
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
              Back to challenge
            </NavLink>
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
