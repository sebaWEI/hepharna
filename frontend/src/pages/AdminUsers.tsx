import { useEffect, useState } from 'react'
import { useLocale } from '../context/LocaleContext'
import { api } from '../services/api'
import type { AdminUser } from '../types'
import { formatDate, formatScore } from '../utils/rna'

export function AdminUsersPage() {
  const { locale, t, te } = useLocale()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .adminUsers()
      .then(setUsers)
      .catch((err) => setError(te(err)))
  }, [te])

  return (
    <section>
      <h1 className="text-4xl">{t('admin.users')}</h1>
      {error ? <p className="mt-4 text-danger">{error}</p> : null}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead className="text-xs tracking-[0.16em] text-mute">
            <tr>
              <th className="pb-3 font-normal">{t('admin.colNickname')}</th>
              <th className="pb-3 font-normal">{t('admin.colEmail')}</th>
              <th className="pb-3 font-normal">{t('admin.colPid')}</th>
              <th className="pb-3 font-normal">{t('admin.colRole')}</th>
              <th className="pb-3 font-normal">{t('admin.colSubs')}</th>
              <th className="pb-3 font-normal">{t('admin.colBest')}</th>
              <th className="pb-3 font-normal">{t('admin.colJoined')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-line">
                <td className="py-4">{user.username}</td>
                <td className="py-4 font-mono text-sm">{user.email || '-'}</td>
                <td className="py-4 font-mono">{user.participant_id}</td>
                <td className="py-4 text-mute">
                  {user.role === 'admin' ? t('admin.roleAdmin') : t('admin.roleUser')}
                </td>
                <td className="py-4 font-mono">{user.submission_count}</td>
                <td className="py-4 font-mono">{formatScore(user.best_score)}</td>
                <td className="py-4 text-mute">{formatDate(user.created_at, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
