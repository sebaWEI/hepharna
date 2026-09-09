import { CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { validateSequence } from '../utils/rna'

type Props = {
  value: string
  onChange: (value: string) => void
  minLength: number
  maxLength: number
}

export function SequenceEditor({ value, onChange, minLength, maxLength }: Props) {
  const result = validateSequence(value, minLength, maxLength)
  return (
    <div className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm text-mute">RNA sequence</span>
        <div className="rounded-[16px] border border-line bg-raised p-4">
          <div className="mb-3 flex items-center justify-between font-mono text-xs text-mute">
            <span>5'</span>
            <span>3'</span>
          </div>
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            spellCheck={false}
            rows={6}
            className="w-full resize-y bg-transparent font-mono text-lg leading-relaxed text-ink outline-none placeholder:text-mute/50"
            placeholder="AUGCCAGUCCAGUAC..."
            aria-label="RNA sequence"
          />
        </div>
      </label>
      <div className="grid gap-3 rounded-[16px] border border-line bg-surface p-4 md:grid-cols-3">
        <div>
          <p className="text-xs text-mute">Length</p>
          <p className="font-mono text-2xl">{result.length} nt</p>
        </div>
        <div>
          <p className="text-xs text-mute">GC content</p>
          <p className="font-mono text-2xl">{result.gcContent.toFixed(1)}%</p>
        </div>
        <div className="flex items-center gap-2">
          {result.valid ? (
            <CheckCircle size={22} className="text-accent" />
          ) : (
            <WarningCircle size={22} className="text-danger" />
          )}
          <p className={result.valid ? 'text-accent' : 'text-danger'}>{result.message}</p>
        </div>
      </div>
    </div>
  )
}
