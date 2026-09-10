import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../components/StatusBadge'
import { useLocale } from '../context/LocaleContext'
import { api } from '../services/api'
import type { DesignPublic } from '../types'
import { formatDate, formatScore } from '../utils/rna'

export function DesignsPage() {
  const { locale, t, te } = useLocale()
  const [designs, setDesigns] = useState<DesignPublic[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .myDesigns()
      .then(setDesigns)
      .catch((err) => setError(te(err)))
      .finally(() => setLoading(false))
  }, [te])

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl">{t('designs.title')}</h1>
        <Link to="/design" className="text-accent">
          {t('designs.cta')}
        </Link>
      </div>
      {loading ? <p className="mt-8 text-mute">{t('designs.loading')}</p> : null}
      {error ? <p className="mt-8 text-danger">{error}</p> : null}
      {!loading && !designs.length ? (
        <p className="mt-8 text-mute">{t('designs.empty')}</p>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead className="text-xs tracking-[0.16em] text-mute">
              <tr>
                <th className="pb-3 font-normal">{t('designs.colDesign')}</th>
                <th className="pb-3 font-normal">{t('designs.colScore')}</th>
                <th className="pb-3 font-normal">{t('designs.colStatus')}</th>
                <th className="pb-3 font-normal">{t('designs.colDate')}</th>
                <th className="pb-3 font-normal">{t('designs.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {designs.map((design) => (
                <tr key={design.id} className="border-t border-line">
                  <td className="max-w-64 py-4 pr-4">
                    <Link to={`/designs/${design.id}`} className="block break-words text-accent">
                      {design.name || design.design_id}
                    </Link>
                    <p className="mt-1 font-mono text-xs text-mute">{design.design_id}</p>
                    <p className="mt-1 text-xs text-mute">{t('designs.version', { n: design.version })}</p>
                  </td>
                  <td className="py-4 font-mono">{formatScore(design.score)}</td>
                  <td className="py-4">
                    <StatusBadge status={design.status} />
                  </td>
                  <td className="py-4 pr-4 text-mute">{formatDate(design.submitted_at ?? design.created_at, locale)}</td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/designs/${design.id}?preview=1`} className="rounded-full border border-line px-3 py-2 text-sm hover:border-accent">
                        {t('designs.preview')}
                      </Link>
                      <Link to={`/design?from=${design.id}`} className="rounded-full bg-accent px-3 py-2 text-sm text-bg">
                        {t('designs.startHere')}
                      </Link>
                      {design.status === 'draft' ? (
                        <Link to={`/design?draft=${design.id}`} className="px-3 py-2 text-sm text-accent">
                          {t('designs.editDraft')}
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
