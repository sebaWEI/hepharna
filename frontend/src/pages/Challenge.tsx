import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LeaderboardList } from '../components/LeaderboardList'
import { SequenceDisplay } from '../components/SequenceDisplay'
import { StatusBadge } from '../components/StatusBadge'
import { StructureViewer } from '../components/StructureViewer'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { api } from '../services/api'
import type { CurrentDesignResponse, DesignPublic } from '../types'
import { formatScore } from '../utils/rna'

export function ChallengePage() {
  const { user, refresh } = useAuth()
  const { t, te } = useLocale()
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
      .catch((err) => setError(te(err)))
  }, [refresh, te])

  const design = current?.design
  const score = design?.score ?? null
  const rank = design?.status === 'published' ? user?.rank ?? null : null

  return (
    <section className="mx-auto grid max-w-7xl items-start gap-6 px-4 py-10 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="workspace-panel rounded-[16px] border border-line bg-surface p-6 md:p-8">
        <p className="font-mono text-xs tracking-[0.22em] text-accent">{t('challenge.kicker')}</p>
        <h1 className="page-heading mt-4">{t('challenge.hello', { name: user?.username ?? '' })}</h1>
        <p className="mt-2 font-mono text-mute">{t('challenge.participant', { id: user?.participant_id ?? '' })}</p>
        <div className="mt-8 border-t border-line pt-8">
          <h2 className="section-label text-sm text-mute">{t('challenge.current')}</h2>
          {submitted ? (
            <div className="mt-4 rounded-[16px] border border-accent/30 bg-accent/10 p-4">
              <p>{t('challenge.submitted')}</p>
              <p className="mt-1 font-mono text-sm">{t('challenge.designId', { id: submitted.design_id })}</p>
              <p className="text-sm text-mute">{t('challenge.pendingEval')}</p>
            </div>
          ) : null}
          {error ? <p className="mt-4 text-danger">{error}</p> : null}
          {design ? (
            <div className="mt-5 grid gap-5">
              <h3 className="break-words text-xl">{design.name || design.design_id}</h3>
              <SequenceDisplay sequence={design.sequence} />
              <StatusBadge status={design.status} />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-mute">{t('admin.plddt')}</p>
                  <p className="font-mono text-3xl">{formatScore(design.scores?.plddt)}</p>
                </div>
                <div>
                  <p className="text-xs text-mute">{t('admin.iptm')}</p>
                  <p className="font-mono text-3xl">{formatScore(design.scores?.iptm)}</p>
                </div>
                <div>
                  <p className="text-xs text-mute">{t('admin.total')}</p>
                  <p className="font-mono text-3xl text-accent">{formatScore(score)}</p>
                </div>
                <div>
                  <p className="text-xs text-mute">{t('challenge.rank')}</p>
                  <p className="font-mono text-3xl">{rank ? `#${rank}` : '-'}</p>
                </div>
              </div>
              {design.has_structure ? (
                <StructureViewer designId={design.id} filename={design.structure_filename} />
              ) : null}
            </div>
          ) : (
            <p className="mt-5 text-mute">{t('challenge.empty')}</p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/design" className="action-link rounded-full bg-accent px-5 py-2.5 text-bg">
              {current?.draft || design ? t('challenge.edit') : t('challenge.design')}
            </Link>
            <Link to="/designs" className="action-link rounded-full border border-line px-5 py-2.5">
              {t('challenge.mine')}
            </Link>
          </div>
        </div>
      </div>
      <aside className="workspace-panel rounded-[16px] border border-line bg-surface p-6">
        <h2 className="section-label text-sm text-mute">{t('challenge.live')}</h2>
        <div className="mt-5">
          {data ? (
            <LeaderboardList
              entries={data.entries}
              animate={changed}
              highlight={user?.participant_id}
            />
          ) : (
            <p className="text-mute">{t('challenge.updating')}</p>
          )}
        </div>
        <Link to="/leaderboard" className="mt-6 inline-block text-sm text-accent">
          {t('challenge.openBoard')}
        </Link>
      </aside>
    </section>
  )
}
