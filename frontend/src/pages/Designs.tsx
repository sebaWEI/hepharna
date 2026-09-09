import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { api } from '../services/api'
import type { DesignPublic } from '../types'
import { errorMessage } from '../types'
import { formatDate, formatScore } from '../utils/rna'

export function DesignsPage() {
  const [designs, setDesigns] = useState<DesignPublic[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .myDesigns()
      .then(setDesigns)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-4xl">My Designs</h1>
        <Link to="/design" className="text-accent">
          Design RNA
        </Link>
      </div>
      {loading ? <p className="mt-8 text-mute">Loading...</p> : null}
      {error ? <p className="mt-8 text-danger">{error}</p> : null}
      {!loading && !designs.length ? (
        <p className="mt-8 text-mute">You have not created a design yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="text-xs tracking-[0.16em] text-mute">
              <tr>
                <th className="pb-3 font-normal">Design</th>
                <th className="pb-3 font-normal">Score</th>
                <th className="pb-3 font-normal">Status</th>
                <th className="pb-3 font-normal">Date</th>
              </tr>
            </thead>
            <tbody>
              {designs.map((design) => (
                <tr key={design.id} className="border-t border-line">
                  <td className="py-4">
                    <Link to={`/designs/${design.id}`} className="font-mono text-accent">
                      {design.design_id}
                    </Link>
                  </td>
                  <td className="py-4 font-mono">{formatScore(design.score)}</td>
                  <td className="py-4">
                    <StatusBadge status={design.status} />
                  </td>
                  <td className="py-4 text-mute">{formatDate(design.submitted_at ?? design.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
