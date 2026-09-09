import type { DesignStatus } from '../types'
import { statusLabel } from '../utils/rna'

export function StatusBadge({ status }: { status: DesignStatus | string }) {
  const tone =
    status === 'published'
      ? 'text-accent border-accent/30 bg-accent/10'
      : status === 'scored'
        ? 'text-warn border-warn/30 bg-warn/10'
        : status === 'rejected'
          ? 'text-danger border-danger/30 bg-danger/10'
          : 'text-mute border-line bg-raised'
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs tracking-wide ${tone}`}>
      {statusLabel(status)}
    </span>
  )
}
