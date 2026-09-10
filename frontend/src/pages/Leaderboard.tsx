import { useSearchParams } from 'react-router-dom'
import { Countdown } from '../components/Countdown'
import { LanguageToggle } from '../components/LanguageToggle'
import { LeaderboardList } from '../components/LeaderboardList'
import { useLocale } from '../context/LocaleContext'
import { useLeaderboard } from '../hooks/useLeaderboard'

export function LeaderboardPage() {
  const { t } = useLocale()
  const [params] = useSearchParams()
  const kiosk = params.get('kiosk') === '1'
  const { data, changed, loading } = useLeaderboard(20)
  const ended = data?.challenge_ended
  const top3 = data?.entries.slice(0, 3) ?? []
  const places = [t('board.champion'), t('board.runnerUp'), t('board.third')]

  return (
    <section className={`mx-auto max-w-4xl px-4 ${kiosk ? 'min-h-[100dvh] py-16' : 'py-10'}`}>
      {kiosk ? (
        <div className="mb-8 flex justify-end">
          <LanguageToggle />
        </div>
      ) : null}
      <p className="text-center font-mono text-sm tracking-[0.28em] text-accent">{t('board.kicker')}</p>
      <h1 className="mt-4 text-center text-4xl md:text-6xl">
        {ended ? t('board.final') : t('board.live')}
      </h1>
      {ended && top3.length ? (
        <div className="mx-auto mt-10 grid max-w-xl gap-4 text-center">
          {top3.map((entry, index) => (
            <div key={entry.participant_id} className="rounded-[16px] bg-raised px-6 py-5">
              <p className="text-sm text-mute">{places[index]}</p>
              <p className="mt-1 text-3xl">{entry.username}</p>
              <p className="mt-1 font-mono text-2xl text-accent">{entry.score.toFixed(2)}</p>
              <p className="mt-1 font-mono text-sm text-mute">
                pLDDT {entry.plddt?.toFixed(2) ?? '-'} · ipTM {entry.iptm?.toFixed(2) ?? '-'}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-10">
        {loading && !data ? <p className="text-center text-mute">{t('board.updating')}</p> : null}
        {data ? <LeaderboardList entries={data.entries} animate={changed} /> : null}
      </div>
      <div className="mt-12">
        <Countdown endTime={data?.challenge_end_time ?? null} />
      </div>
    </section>
  )
}
