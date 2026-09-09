import { useEffect, useRef, useState } from 'react'
import { api } from '../services/api'
import type { LeaderboardResponse } from '../types'

export function useLeaderboard(limit = 20, intervalMs = 5000) {
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [changed, setChanged] = useState(false)
  const [loading, setLoading] = useState(true)
  const fingerprint = useRef('')

  useEffect(() => {
    let cancelled = false
    async function load(initial = false) {
      try {
        const next = await api.leaderboard(limit)
        if (cancelled) return
        const key = JSON.stringify(next.entries)
        if (key !== fingerprint.current) {
          setChanged(!initial && fingerprint.current !== '')
          fingerprint.current = key
          setData(next)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load(true)
    const timer = window.setInterval(() => load(false), intervalMs)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [intervalMs, limit])

  return { data, changed, loading }
}
