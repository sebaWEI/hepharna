import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FoldDetails } from '../components/FoldDetails'
import { HistoricalDesignReference } from '../components/HistoricalDesignReference'
import { useLocale } from '../context/LocaleContext'
import { api } from '../services/api'
import type { DesignPublic, FoldResult } from '../types'

export function ReferencePage() {
  const { t, te } = useLocale()
  const [searchParams] = useSearchParams()
  const sourceId = searchParams.get('from')
  const [fold, setFold] = useState<FoldResult | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [sourceResult, setSourceResult] = useState<{ id: string; design?: DesignPublic; error?: unknown } | null>(null)

  useEffect(() => {
    let cancelled = false
    api.referenceFold()
      .then((value) => { if (!cancelled) setFold(value) })
      .catch((err: unknown) => { if (!cancelled) setError(err) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (sourceId === null) return
    let cancelled = false
    async function loadSource() {
      const id = Number(sourceId)
      if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Design not found.')
      return api.getDesign(id)
    }
    loadSource()
      .then((design) => { if (!cancelled) setSourceResult({ id: sourceId, design }) })
      .catch((err: unknown) => { if (!cancelled) setSourceResult({ id: sourceId, error: err }) })
    return () => { cancelled = true }
  }, [sourceId])

  const source = sourceResult?.id === sourceId ? sourceResult : null
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <p className="font-mono text-sm tracking-[0.2em] text-accent">{t('ref.kicker')}</p>
      <h1 className="mt-3 text-4xl md:text-5xl">{t('ref.title')}</h1>
      <p className="mt-4 max-w-[56ch] text-mute">{t('ref.body')}</p>
      <div className={`reference-grid mt-8 grid items-start gap-8 ${sourceId !== null ? 'lg:grid-cols-2' : ''}`}>
        <section className="min-w-0" aria-label={t('design.originalReference')}>
          {sourceId !== null ? <h2 className="mb-4 text-xl">{t('design.originalReference')}</h2> : null}
          {error ? <p className="text-danger" role="alert">{te(error)}</p> : null}
          {!fold && !error ? <p className="text-mute" role="status">{t('ref.folding')}</p> : null}
          {fold ? <FoldDetails fold={fold} /> : null}
        </section>
        {sourceId !== null ? source?.design ? (
          <HistoricalDesignReference key={source.design.id} design={source.design} />
        ) : source?.error ? (
          <p className="text-danger" role="alert">{te(source.error)}</p>
        ) : <p className="text-mute" role="status">{t('designs.loading')}</p> : null}
      </div>
      <Link to={source?.design ? `/design?from=${source.design.id}` : '/design'} className="mt-6 inline-block text-accent">
        {source?.design ? t('designs.startHere') : t('ref.designFrom')}
      </Link>
    </section>
  )
}
