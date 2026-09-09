import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LeaderboardList } from '../components/LeaderboardList'
import { SequenceDisplay } from '../components/SequenceDisplay'
import { StatusBadge } from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { api } from '../services/api'
import type { CurrentDesignResponse, DesignPublic } from '../types'
import { errorMessage } from '../types'
import { formatScore } from '../utils/rna'

export function ChallengePage() {
  const { user, refresh } = useAuth()
  const location = useLocation()
  const { data, changed } = useLeaderboard(8)
  const [current, setCurrent] = useState<CurrentDesignResponse | null>(null)
  const [error, setError] = useState('')
  const submitted = (location.state as { submitted?: DesignPublic } | null)?.submitted

  useEffect(() => {
    refresh()
    api
      .currentDesign()
      .then(setCurrent)
      .catch((err) => setError(errorMessage(err)))
  }, [refresh])

  const design = current?.design
  const score = design?.score ?? null
  const rank = design?.status === 'published' ? user?.rank ?? null : null

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[16px] border border-line bg-surface p-6 md:p-8">
        <p className="font-mono text-xs tracking-[0.22em] text-accent">HEPHA-RNA DESIGN CHALLENGE</p>
        <h1 className="mt-4 text-4xl">Hello, {user?.username}</h1>
        <p className="mt-2 font-mono text-mute">Participant #{user?.participant_id}</p>
        <div className="mt-8 border-t border-line pt-8">
          <h2 className="text-sm tracking-[0.16em] text-mute">YOUR CURRENT DESIGN</h2>
          {submitted ? (
            <div className="mt-4 rounded-[16px] border border-accent/30 bg-accent/10 p-4">
              <p>Design submitted successfully!</p>
              <p className="mt-1 font-mono text-sm">Design ID: {submitted.design_id}</p>
              <p className="text-sm text-mute">Status: Pending evaluation</p>
            </div>
          ) : null}
          {error ? <p className="mt-4 text-danger">{error}</p> : null}
          {design ? (
            <div className="mt-5 grid gap-5">
              <SequenceDisplay sequence={design.sequence} />
              <StatusBadge status={design.status} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-mute">SCORE</p>
                  <p className="font-mono text-5xl">{formatScore(score)}</p>
                </div>
                <div>
                  <p className="text-xs text-mute">RANK</p>
                  <p className="font-mono text-5xl">{rank ? `#${rank}` : '-'}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-mute">No design yet. Start with a sequence and submit it for scoring.</p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/design" className="rounded-full bg-accent px-5 py-2.5 text-bg">
              {current?.draft || design ? 'Edit Design' : 'Design RNA'}
            </Link>
            <Link to="/designs" className="rounded-full border border-line px-5 py-2.5">
              My Designs
            </Link>
          </div>
        </div>
      </div>
      <aside className="rounded-[16px] border border-line bg-surface p-6">
        <h2 className="text-sm tracking-[0.16em] text-mute">LIVE LEADERBOARD</h2>
        <div className="mt-5">
          {data ? (
            <LeaderboardList
              entries={data.entries}
              animate={changed}
              highlight={user?.participant_id}
            />
          ) : (
            <p className="text-mute">Updating leaderboard...</p>
          )}
        </div>
        <Link to="/leaderboard" className="mt-6 inline-block text-sm text-accent">
          Open full board
        </Link>
      </aside>
    </section>
  )
}
