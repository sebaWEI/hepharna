import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { DesignFoldPreview } from '../components/DesignFoldPreview'
import { SequenceDisplay } from '../components/SequenceDisplay'
import { StatusBadge } from '../components/StatusBadge'
import { StructureViewer } from '../components/StructureViewer'
import { useLocale } from '../context/LocaleContext'
import { api } from '../services/api'
import type { DesignPublic } from '../types'
import { formatDate, formatScore } from '../utils/rna'

export function DesignDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { locale, t, te } = useLocale()
  const [design, setDesign] = useState<DesignPublic | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setDesign(null)
    setError('')
    api.getDesign(Number(id))
      .then((result) => { if (!cancelled) setDesign(result) })
      .catch((err) => { if (!cancelled) setError(te(err)) })
    return () => { cancelled = true }
  }, [id, te])

  if (error) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-danger">{error}</p>
        <Link to="/designs" className="mt-4 inline-block text-accent">
          {t('designs.back')}
        </Link>
      </section>
    )
  }
  if (!design) return <p className="px-4 py-16 text-mute">{t('designs.loading')}</p>

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <p className="font-mono text-sm text-accent">{design.design_id}</p>
      <h1 className="mt-2 break-words text-4xl">{design.name || design.design_id}</h1>
      <p className="mt-2 text-mute">{t('designs.version', { n: String(design.version).padStart(2, '0') })}</p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Link to={`/design?from=${design.id}`} className="rounded-full bg-accent px-5 py-2.5 text-bg">{t('designs.startHere')}</Link>
        <Link to="/designs" className="text-accent">{t('designs.back')}</Link>
      </div>
      <DesignFoldPreview key={`${design.id}-${searchParams.get('preview')}`} designId={design.id} autoLoad={searchParams.get('preview') === '1'} />
      <div className="mt-8 rounded-[16px] border border-line bg-surface p-6">
        <SequenceDisplay sequence={design.sequence} />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <p>
            {t('seq.length')}
            <span className="mt-1 block font-mono text-2xl">{design.length} nt</span>
          </p>
          <p>
            {t('seq.gc')}
            <span className="mt-1 block font-mono text-2xl">{design.gc_content.toFixed(1)}%</span>
          </p>
          <p>
            {t('admin.plddt')}
            <span className="mt-1 block font-mono text-2xl">{formatScore(design.scores?.plddt)}</span>
          </p>
          <p>
            {t('admin.iptm')}
            <span className="mt-1 block font-mono text-2xl">{formatScore(design.scores?.iptm)}</span>
          </p>
          <p>
            {t('admin.total')}
            <span className="mt-1 block font-mono text-2xl">{formatScore(design.score)}</span>
          </p>
          <p>
            {t('challenge.rank')}
            <span className="mt-1 block font-mono text-2xl">{design.rank ? `#${design.rank}` : '-'}</span>
          </p>
          <p>
            {t('designs.status')}
            <span className="mt-2 block">
              <StatusBadge status={design.status} />
            </span>
          </p>
          <p>
            {t('designs.submitted')}
            <span className="mt-1 block text-mute">{formatDate(design.submitted_at, locale)}</span>
          </p>
        </div>
      </div>
      {design.has_structure ? (
        <div className="mt-6">
          <StructureViewer designId={design.id} filename={design.structure_filename} />
        </div>
      ) : null}

    </section>
  )
}
