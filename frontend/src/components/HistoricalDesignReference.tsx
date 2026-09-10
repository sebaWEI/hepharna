import { DesignFoldPreview } from './DesignFoldPreview'
import { StatusBadge } from './StatusBadge'
import { useLocale } from '../context/LocaleContext'
import type { DesignPublic } from '../types'
import { formatDate, formatScore } from '../utils/rna'

export function HistoricalDesignReference({ design }: { design: DesignPublic }) {
  const { locale, t } = useLocale()
  const title = design.name || design.design_id
  return (
    <section className="min-w-0" aria-label={t('design.previousLabel', { name: title })}>
      <p className="text-xs text-mute">{t('design.previous')}</p>
      <h2 className="mt-1 break-words text-xl">{title}</h2>
      <p className="mt-1 break-words font-mono text-xs text-mute">
        {design.design_id} · {t('designs.version', { n: String(design.version).padStart(2, '0') })}
      </p>
      <DesignFoldPreview key={design.id} designId={design.id} autoLoad showHeading={false} />
      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-3">
        <div><dt className="text-xs text-mute">{t('admin.plddt')}</dt><dd className="mt-1 font-mono">{formatScore(design.scores?.plddt)}</dd></div>
        <div><dt className="text-xs text-mute">{t('admin.iptm')}</dt><dd className="mt-1 font-mono">{formatScore(design.scores?.iptm)}</dd></div>
        <div><dt className="text-xs text-mute">{t('admin.total')}</dt><dd className="mt-1 font-mono">{formatScore(design.score)}</dd></div>
        <div><dt className="text-xs text-mute">{t('designs.status')}</dt><dd className="mt-2"><StatusBadge status={design.status} /></dd></div>
        <div><dt className="text-xs text-mute">{t('designs.submitted')}</dt><dd className="mt-1 text-sm text-mute">{formatDate(design.submitted_at, locale)}</dd></div>
        <div><dt className="text-xs text-mute">{t('challenge.rank')}</dt><dd className="mt-1 font-mono">{design.rank ? `#${design.rank}` : '-'}</dd></div>
      </dl>
    </section>
  )
}
