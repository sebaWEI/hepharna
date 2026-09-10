import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { useLocale } from '../context/LocaleContext'
import { api } from '../services/api'
import type { AdminSubmission } from '../types'
import { formatScore } from '../utils/rna'

export function AdminSubmissionsPage() {
  const { t, te } = useLocale()
  const [params, setParams] = useSearchParams()
  const [rows, setRows] = useState<AdminSubmission[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const status = params.get('status') ?? ''
  const q = params.get('q') ?? ''
  const sort = params.get('sort') ?? 'submitted_at'

  useEffect(() => {
    setLoading(true)
    api
      .adminSubmissions({ status: status || undefined, q: q || undefined, sort, order: 'desc' })
      .then(setRows)
      .catch((err) => setError(te(err)))
      .finally(() => setLoading(false))
  }, [status, q, sort, te])

  return (
    <section>
      <h1 className="text-4xl">{t('admin.submissions')}</h1>
      <div className="mt-6 flex flex-wrap gap-3">
        <input
          defaultValue={q}
          placeholder={t('admin.search')}
          className="rounded-[8px] border border-line bg-raised px-3 py-2 outline-none focus:border-accent"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              params.set('q', event.currentTarget.value)
              setParams(params)
            }
          }}
        />
        <select
          value={status}
          onChange={(event) => {
            if (event.target.value) params.set('status', event.target.value)
            else params.delete('status')
            setParams(params)
          }}
          className="rounded-[8px] border border-line bg-raised px-3 py-2"
        >
          <option value="">{t('admin.allSubmitted')}</option>
          <option value="submitted">{t('admin.filterPending')}</option>
          <option value="scored">{t('admin.filterScored')}</option>
          <option value="published">{t('admin.filterPublished')}</option>
        </select>
        <select
          value={sort}
          onChange={(event) => {
            params.set('sort', event.target.value)
            setParams(params)
          }}
          className="rounded-[8px] border border-line bg-raised px-3 py-2"
        >
          <option value="submitted_at">{t('admin.sortTime')}</option>
          <option value="design_id">{t('admin.sortId')}</option>
          <option value="status">{t('admin.sortStatus')}</option>
        </select>
      </div>
      {error ? <p className="mt-4 text-danger">{error}</p> : null}
      {loading ? <p className="mt-6 text-mute">{t('designs.loading')}</p> : null}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead className="text-xs tracking-[0.16em] text-mute">
            <tr>
              <th className="pb-3 font-normal">{t('admin.colId')}</th>
              <th className="pb-3 font-normal">{t('admin.colUser')}</th>
              <th className="pb-3 font-normal">{t('admin.colStatus')}</th>
              <th className="pb-3 font-normal">{t('admin.colScore')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="py-4">
                  <Link to={`/admin/submissions/${row.id}`} className="font-mono text-accent">
                    {row.design_id}
                  </Link>
                </td>
                <td className="py-4">{row.username}</td>
                <td className="py-4">
                  <StatusBadge status={row.status} />
                </td>
                <td className="py-4 font-mono">
                  <span className="block">{formatScore(row.score)}</span>
                  {row.scores?.plddt != null || row.scores?.iptm != null ? (
                    <span className="text-xs text-mute">
                      {formatScore(row.scores?.plddt)} / {formatScore(row.scores?.iptm)}
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
