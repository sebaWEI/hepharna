import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { ChallengeConfig } from '../types'

const fallback: ChallengeConfig = {
  min_rna_length: 10,
  max_rna_length: 100,
  max_submissions_per_user: 5,
  challenge_start_time: null,
  challenge_end_time: null,
  challenge_open: true,
  minecraft_server_address: '',
  minecraft_info: '',
}

export function useChallengeConfig() {
  const [config, setConfig] = useState<ChallengeConfig>(fallback)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .config()
      .then(setConfig)
      .finally(() => setLoading(false))
  }, [])

  return { config, loading }
}
