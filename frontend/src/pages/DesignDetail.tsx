import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SequenceDisplay } from '../components/SequenceDisplay'
import { StatusBadge } from '../components/StatusBadge'
import { StructureViewer } from '../components/StructureViewer'
import { useLocale } from '../context/LocaleContext'
import { api } from '../services/api'
import type { DesignPublic } from '../types'
import { formatDate, formatScore } from '../utils/rna'

export function DesignDetailPage() {
  const { id } = useParams()
  const { locale, t, te } = useLocale()
  const [design, setDesign] = useState<DesignPublic | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api
      .getDesign(Number(id))
      .then(setDesign)
      .catch((err) => setError(te(err)))
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
      <h1 className="mt-2 text-4xl">{t('designs.version', { n: String(design.version).padStart(2, '0') })}</h1>
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
      <Link to="/design" className="mt-6 inline-block text-accent">
        {t('designs.newDraft')}
      </Link>
    </section>
  )
}
