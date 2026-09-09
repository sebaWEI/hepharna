import type { DesignStatus } from '../types'
import { useLocale } from '../context/LocaleContext'
import type { MessageKey } from '../i18n/messages'

const STATUS_KEYS: Record<string, MessageKey> = {
  draft: 'status.draft',
  submitted: 'status.submitted',
  evaluating: 'status.evaluating',
  scored: 'status.scored',
  published: 'status.published',
  rejected: 'status.rejected',
}

export function StatusBadge({ status }: { status: DesignStatus | string }) {
  const { t } = useLocale()
  const tone =
    status === 'published'
      ? 'text-accent border-accent/30 bg-accent/10'
      : status === 'scored'
        ? 'text-warn border-warn/30 bg-warn/10'
        : status === 'rejected'
          ? 'text-danger border-danger/30 bg-danger/10'
          : 'text-mute border-line bg-raised'
  const key = STATUS_KEYS[status]
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs tracking-wide ${tone}`}>
      {key ? t(key) : status}
    </span>
  )
}
