import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { SequenceDisplay } from '../components/SequenceDisplay'
import { StatusBadge } from '../components/StatusBadge'
import { useLocale } from '../context/LocaleContext'
import { api } from '../services/api'
import type { AdminSubmission } from '../types'
import { formatDate, formatScore } from '../utils/rna'

export function AdminSubmissionDetailPage() {
  const { id } = useParams()
  const { locale, t, te } = useLocale()
  const [design, setDesign] = useState<AdminSubmission | null>(null)
  const [score, setScore] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'save' | 'publish' | 'unpublish' | null>(null)

  useEffect(() => {
    if (!id) return
    api
      .adminSubmission(Number(id))
      .then((row) => {
        setDesign(row)
        setScore(row.score !== null ? String(row.score) : '')
      })
      .catch((err) => setError(te(err)))
  }, [id, te])

  async function saveScore(event: FormEvent) {
    event.preventDefault()
    if (!design || busy) return
    const value = Number(score)
    if (Number.isNaN(value)) {
      setError(t('admin.numeric'))
      return
    }
    setBusy('save')
    setError('')
    try {
      const updated = design.score === null
        ? await api.saveScore(design.id, value)
        : await api.updateScore(design.id, value)
      setDesign(updated)
    } catch (err) {
      setError(te(err))
    } finally {
      setBusy(null)
    }
  }

  async function publish() {
    if (!design || busy) return
    setBusy('publish')
    setError('')
    try {
      setDesign(await api.publish(design.id))
    } catch (err) {
      setError(te(err))
    } finally {
      setBusy(null)
    }
  }

  async function unpublish() {
    if (!design || busy) return
    setBusy('unpublish')
    setError('')
    try {
      setDesign(await api.unpublish(design.id))
    } catch (err) {
      setError(te(err))
    } finally {
      setBusy(null)
    }
  }

  if (!design) {
    return <p className={error ? 'text-danger' : 'text-mute'}>{error || t('designs.loading')}</p>
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <Link to="/admin/submissions" className="text-sm text-mute">
          {t('admin.backList')}
        </Link>
        <h1 className="mt-3 text-4xl">{t('admin.design', { id: design.design_id })}</h1>
        <div className="mt-6 rounded-[16px] border border-line bg-surface p-6">
          <p className="text-mute">{t('admin.participant')}</p>
          <p className="text-2xl">{design.username}</p>
          <p className="mt-1 font-mono text-mute">{design.participant_id}</p>
          <div className="mt-6">
            <SequenceDisplay sequence={design.sequence} />
            <button
              type="button"
              className="mt-3 text-sm text-accent"
              onClick={() => navigator.clipboard.writeText(design.sequence)}
            >
              {t('admin.copy')}
            </button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <p>
              {t('seq.length')}
              <span className="mt-1 block font-mono text-xl">{design.length} nt</span>
            </p>
            <p>
              {t('seq.gc')}
              <span className="mt-1 block font-mono text-xl">{design.gc_content.toFixed(1)}%</span>
            </p>
            <p>
              {t('designs.submitted')}
              <span className="mt-1 block text-mute">{formatDate(design.submitted_at, locale)}</span>
            </p>
            <p>
              {t('designs.status')}
              <span className="mt-2 block">
                <StatusBadge status={design.status} />
              </span>
            </p>
          </div>
        </div>
      </div>
      <form onSubmit={saveScore} className="rounded-[16px] border border-line bg-surface p-6">
        <h2 className="text-2xl">{t('admin.boltz')}</h2>
        <label className="mt-6 grid gap-2">
          <span>{t('admin.overall')}</span>
          <input
            value={score}
            onChange={(event) => setScore(event.target.value)}
            className="rounded-[8px] border border-line bg-raised px-3 py-3 font-mono text-2xl outline-none focus:border-accent"
            inputMode="decimal"
            required
          />
        </label>
        {error ? <p className="mt-3 text-danger">{error}</p> : null}
        <p className="mt-3 text-sm text-mute">{t('admin.currentScore', { score: formatScore(design.score) })}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" disabled={busy !== null}>
            {busy === 'save' ? t('admin.saving') : t('admin.save')}
          </Button>
          <Button type="button" variant="quiet" onClick={publish} disabled={busy !== null || design.score === null}>
            {busy === 'publish' ? t('admin.publishing') : t('admin.publish')}
          </Button>
          {design.status === 'published' ? (
            <Button type="button" variant="ghost" onClick={unpublish} disabled={busy !== null}>
              {busy === 'unpublish' ? t('admin.updating') : t('admin.unpublish')}
            </Button>
          ) : null}
        </div>
      </form>
    </section>
  )
}
