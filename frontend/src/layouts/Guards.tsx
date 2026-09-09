import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'

export function RequireAuth() {
  const { user, loading } = useAuth()
  const { t } = useLocale()
  const location = useLocation()
  if (loading) return <p className="p-10 text-mute">{t('designs.loading')}</p>
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

export function RequireAdmin() {
  const { user, loading } = useAuth()
  const { t } = useLocale()
  if (loading) return <p className="p-10 text-mute">{t('designs.loading')}</p>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/forbidden" replace />
  return <Outlet />
}
