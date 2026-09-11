import { useEffect, useId, useState } from 'react'
import { Button } from './Button'
import { FoldDetails } from './FoldDetails'
import { useLocale } from '../context/LocaleContext'
import { api } from '../services/api'
import type { FoldResult } from '../types'

export function DesignFoldPreview({ designId, autoLoad, showHeading = true }: { designId: number; autoLoad: boolean; showHeading?: boolean }) {
  const { t, te } = useLocale()
  const titleId = useId()
  const [requested, setRequested] = useState(autoLoad)
  const [attempt, setAttempt] = useState(0)
  const [fold, setFold] = useState<FoldResult | null>(null)
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    if (!requested) return
    let cancelled = false
    setFold(null)
    setError(null)
    api.designFold(designId)
      .then((result) => { if (!cancelled) setFold(result) })
      .catch((err: unknown) => { if (!cancelled) setError(err) })
    return () => { cancelled = true }
  }, [designId, requested, attempt])

  return (
    <section className={showHeading ? 'mt-8' : 'mt-4'} aria-labelledby={showHeading ? titleId : undefined} aria-label={showHeading ? undefined : t('designs.secondary')}>
      {showHeading ? <>
        <h2 id={titleId} className="text-2xl">{t('designs.secondary')}</h2>
        <p className="mt-2 text-sm text-mute">{t('designs.secondaryHint')}</p>
      </> : null}
      {!requested ? (
        <Button className="mt-4" onClick={() => setRequested(true)}>{t('designs.preview')}</Button>
      ) : error ? (
        <div className="mt-4" role="alert">
          <p className="text-danger">{te(error)}</p>
          <Button className="mt-3" variant="ghost" onClick={() => setAttempt((n) => n + 1)}>{t('designs.retry')}</Button>
        </div>
      ) : fold ? (
        <div className={showHeading ? 'mt-4' : ''}><FoldDetails fold={fold} /></div>
      ) : <p className="mt-4 text-mute" role="status">{t('design.folding')}</p>}
    </section>
  )
}
