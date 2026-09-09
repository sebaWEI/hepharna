import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { AdminUser } from '../types'
import { errorMessage } from '../types'
import { formatDate, formatScore } from '../utils/rna'

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .adminUsers()
      .then(setUsers)
      .catch((err) => setError(errorMessage(err)))
  }, [])

  return (
    <section>
      <h1 className="text-4xl">Users</h1>
      {error ? <p className="mt-4 text-danger">{error}</p> : null}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead className="text-xs tracking-[0.16em] text-mute">
            <tr>
              <th className="pb-3 font-normal">Nickname</th>
              <th className="pb-3 font-normal">Participant ID</th>
              <th className="pb-3 font-normal">Role</th>
              <th className="pb-3 font-normal">Submissions</th>
              <th className="pb-3 font-normal">Best score</th>
              <th className="pb-3 font-normal">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-line">
                <td className="py-4">{user.username}</td>
                <td className="py-4 font-mono">{user.participant_id}</td>
                <td className="py-4 text-mute">{user.role}</td>
                <td className="py-4 font-mono">{user.submission_count}</td>
                <td className="py-4 font-mono">{formatScore(user.best_score)}</td>
                <td className="py-4 text-mute">{formatDate(user.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
