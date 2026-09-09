import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SequenceDisplay } from '../components/SequenceDisplay'
import { StatusBadge } from '../components/StatusBadge'
import { api } from '../services/api'
import type { DesignPublic } from '../types'
import { errorMessage } from '../types'
import { formatDate, formatScore } from '../utils/rna'

export function DesignDetailPage() {
  const { id } = useParams()
  const [design, setDesign] = useState<DesignPublic | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api
      .getDesign(Number(id))
      .then(setDesign)
      .catch((err) => setError(errorMessage(err)))
  }, [id])

  if (error) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-danger">{error}</p>
        <Link to="/designs" className="mt-4 inline-block text-accent">
          Back to my designs
        </Link>
      </section>
    )
  }
  if (!design) return <p className="px-4 py-16 text-mute">Loading...</p>

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <p className="font-mono text-sm text-accent">{design.design_id}</p>
      <h1 className="mt-2 text-4xl">Version {String(design.version).padStart(2, '0')}</h1>
      <div className="mt-8 rounded-[16px] border border-line bg-surface p-6">
        <SequenceDisplay sequence={design.sequence} />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <p>
            Length
            <span className="mt-1 block font-mono text-2xl">{design.length} nt</span>
          </p>
          <p>
            GC content
            <span className="mt-1 block font-mono text-2xl">{design.gc_content.toFixed(1)}%</span>
          </p>
          <p>
            Status
            <span className="mt-2 block">
              <StatusBadge status={design.status} />
            </span>
          </p>
          <p>
            Score
            <span className="mt-1 block font-mono text-2xl">{formatScore(design.score)}</span>
          </p>
          <p>
            Rank
            <span className="mt-1 block font-mono text-2xl">{design.rank ? `#${design.rank}` : '-'}</span>
          </p>
          <p>
            Submitted
            <span className="mt-1 block text-mute">{formatDate(design.submitted_at)}</span>
          </p>
        </div>
      </div>
      <Link to="/design" className="mt-6 inline-block text-accent">
        Create a new draft
      </Link>
    </section>
  )
}
