import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { SequenceDisplay } from '../components/SequenceDisplay'
import { StatusBadge } from '../components/StatusBadge'
import { api } from '../services/api'
import type { AdminSubmission } from '../types'
import { errorMessage } from '../types'
import { formatDate, formatScore } from '../utils/rna'

export function AdminSubmissionDetailPage() {
  const { id } = useParams()
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
      .catch((err) => setError(errorMessage(err)))
  }, [id])

  async function saveScore(event: FormEvent) {
    event.preventDefault()
    if (!design || busy) return
    const value = Number(score)
    if (Number.isNaN(value)) {
      setError('Enter a numeric overall score.')
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
      setError(errorMessage(err))
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
      setError(errorMessage(err))
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
      setError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  if (!design) {
    return <p className={error ? 'text-danger' : 'text-mute'}>{error || 'Loading...'}</p>
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <Link to="/admin/submissions" className="text-sm text-mute">
          Back to submissions
        </Link>
        <h1 className="mt-3 text-4xl">Design {design.design_id}</h1>
        <div className="mt-6 rounded-[16px] border border-line bg-surface p-6">
          <p className="text-mute">Participant</p>
          <p className="text-2xl">{design.username}</p>
          <p className="mt-1 font-mono text-mute">{design.participant_id}</p>
          <div className="mt-6">
            <SequenceDisplay sequence={design.sequence} />
            <button
              type="button"
              className="mt-3 text-sm text-accent"
              onClick={() => navigator.clipboard.writeText(design.sequence)}
            >
              Copy sequence
            </button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <p>
              Length<span className="mt-1 block font-mono text-xl">{design.length} nt</span>
            </p>
            <p>
              GC content
              <span className="mt-1 block font-mono text-xl">{design.gc_content.toFixed(1)}%</span>
            </p>
            <p>
              Submitted
              <span className="mt-1 block text-mute">{formatDate(design.submitted_at)}</span>
            </p>
            <p>
              Status
              <span className="mt-2 block">
                <StatusBadge status={design.status} />
              </span>
            </p>
          </div>
        </div>
      </div>
      <form onSubmit={saveScore} className="rounded-[16px] border border-line bg-surface p-6">
        <h2 className="text-2xl">Boltz Evaluation</h2>
        <label className="mt-6 grid gap-2">
          <span>Overall Score</span>
          <input
            value={score}
            onChange={(event) => setScore(event.target.value)}
            className="rounded-[8px] border border-line bg-raised px-3 py-3 font-mono text-2xl outline-none focus:border-accent"
            inputMode="decimal"
            required
          />
        </label>
        {error ? <p className="mt-3 text-danger">{error}</p> : null}
        <p className="mt-3 text-sm text-mute">Current score: {formatScore(design.score)}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" disabled={busy !== null}>
            {busy === 'save' ? 'Saving...' : 'Save'}
          </Button>
          <Button type="button" variant="quiet" onClick={publish} disabled={busy !== null || design.score === null}>
            {busy === 'publish' ? 'Publishing...' : 'Publish Result'}
          </Button>
          {design.status === 'published' ? (
            <Button type="button" variant="ghost" onClick={unpublish} disabled={busy !== null}>
              {busy === 'unpublish' ? 'Updating...' : 'Unpublish Result'}
            </Button>
          ) : null}
        </div>
      </form>
    </section>
  )
}
