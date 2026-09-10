import { RNAStructure } from './RNAStructure'
import { SequenceDisplay } from './SequenceDisplay'
import { useLocale } from '../context/LocaleContext'
import type { FoldResult } from '../types'

// All previews use the same values and drawing; editing a new sequence never changes a saved fold.
export function FoldDetails({ fold, highlight = [] }: { fold: FoldResult; highlight?: number[] }) {
  const { t } = useLocale()
  return (
    <div className="grid min-w-0 gap-4">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-mute">{t('seq.length')}</dt>
          <dd className="mt-1 font-mono text-xl">{fold.length} nt</dd>
        </div>
        <div>
          <dt className="text-xs text-mute">{t('ref.mfe')}</dt>
          <dd className="mt-1 font-mono text-xl">{fold.mfe.toFixed(2)} kcal/mol</dd>
        </div>
        <div>
          <dt className="text-xs text-mute">{t('seq.gc')}</dt>
          <dd className="mt-1 font-mono text-xl">{fold.gc_content.toFixed(1)}%</dd>
        </div>
      </dl>
      <RNAStructure fold={fold} highlight={highlight} />
      <div className="min-w-0 border-t border-line pt-4" aria-label={t('ref.sequence')}>
        <SequenceDisplay sequence={fold.sequence} compact />
      </div>
      <details className="min-w-0">
        <summary className="cursor-pointer rounded text-sm text-mute hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
          {t('ref.viewStructureText')}
        </summary>
        <p className="mt-3 text-xs text-mute">{t('ref.dotBracket')}</p>
        <p className="mt-2 break-all font-mono text-xs text-mute">{fold.structure}</p>
      </details>
    </div>
  )
}
