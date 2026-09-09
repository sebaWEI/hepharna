import { Medal } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import { useLocale } from '../context/LocaleContext'
import type { LeaderboardEntry } from '../types'
import { formatScore } from '../utils/rna'

export function LeaderboardList({
  entries,
  animate = false,
  highlight,
}: {
  entries: LeaderboardEntry[]
  animate?: boolean
  highlight?: string
}) {
  const reduce = useReducedMotion()
  const { t } = useLocale()
  if (!entries.length) {
    return <p className="text-mute">{t('board.empty')}</p>
  }
  return (
    <ol className="grid gap-2">
      {entries.map((entry) => {
        const medal =
          entry.rank === 1 ? 'text-warn' : entry.rank === 2 ? 'text-mute' : entry.rank === 3 ? 'text-base-g' : 'text-line'
        return (
          <motion.li
            layout={!reduce}
            key={entry.participant_id}
            initial={animate && !reduce ? { opacity: 0.6, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 22 }}
            className={`grid grid-cols-[3rem_1fr_auto] items-center gap-4 rounded-[16px] px-4 py-3 ${
              highlight === entry.participant_id ? 'bg-accent/10' : 'bg-raised/70'
            }`}
          >
            <span className="flex items-center gap-2 font-mono text-lg">
              {entry.rank <= 3 ? <Medal size={18} className={medal} weight="fill" /> : null}
              {entry.rank}
            </span>
            <span>
              <span className="block text-lg">{entry.username}</span>
              <span className="font-mono text-xs text-mute">{entry.participant_id}</span>
            </span>
            <span className="font-mono text-2xl">{formatScore(entry.score)}</span>
          </motion.li>
        )
      })}
    </ol>
  )
}
