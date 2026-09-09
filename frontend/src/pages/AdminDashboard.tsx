import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { api } from '../services/api'
import type { AdminDashboard } from '../types'
import { errorMessage } from '../types'

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    api
      .adminDashboard()
      .then(setData)
      .catch((err) => setError(errorMessage(err)))
  }, [])

  async function exportCsv() {
    if (exporting) return
    setExporting(true)
    try {
      await api.exportCsv()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setExporting(false)
    }
  }

  const cards = data
    ? [
        ['Participants', data.participants],
        ['Total Designs', data.total_designs],
        ['Pending', data.pending],
        ['Published', data.published],
      ]
    : []

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl">HEPHA-RNA Admin</h1>
        <div className="flex gap-3">
          <Link to="/admin/submissions?status=submitted" className="rounded-full bg-accent px-5 py-2.5 text-bg">
            Pending submissions
          </Link>
          <Button variant="ghost" onClick={exportCsv} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export Submissions CSV'}
          </Button>
        </div>
      </div>
      {error ? <p className="mt-4 text-danger">{error}</p> : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={String(label)} className="rounded-[16px] bg-surface p-5">
            <p className="text-sm text-mute">{label}</p>
            <p className="mt-2 font-mono text-4xl">{data ? value : '-'}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
