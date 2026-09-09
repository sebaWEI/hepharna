import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { useLocale } from '../context/LocaleContext'
import { api } from '../services/api'
import type { AdminDashboard } from '../types'

export function AdminDashboardPage() {
  const { t, te } = useLocale()
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    api
      .adminDashboard()
      .then(setData)
      .catch((err) => setError(te(err)))
  }, [te])

  async function exportCsv() {
    if (exporting) return
    setExporting(true)
    try {
      await api.exportCsv()
    } catch (err) {
      setError(te(err))
    } finally {
      setExporting(false)
    }
  }

  const cards = data
    ? [
        [t('admin.participants'), data.participants],
        [t('admin.totalDesigns'), data.total_designs],
        [t('admin.pendingCount'), data.pending],
        [t('admin.published'), data.published],
      ]
    : []

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl">{t('admin.title')}</h1>
        <div className="flex gap-3">
          <Link to="/admin/submissions?status=submitted" className="rounded-full bg-accent px-5 py-2.5 text-bg">
            {t('admin.pending')}
          </Link>
          <Button variant="ghost" onClick={exportCsv} disabled={exporting}>
            {exporting ? t('admin.exporting') : t('admin.export')}
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
