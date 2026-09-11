import { useLayoutEffect, useRef } from 'react'
import { CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { useLocale } from '../context/LocaleContext'
import { validateSequence } from '../utils/rna'

const GROUP = 5

type Props = {
  value: string
  onChange: (value: string) => void
  minLength: number
  maxLength: number
}

function cleanBases(raw: string): string {
  return raw.replace(/[^AUGCaugc]/g, '').toUpperCase()
}

function splitGroups(sequence: string): string[] {
  const groups: string[] = []
  for (let i = 0; i < sequence.length; i += GROUP) {
    groups.push(sequence.slice(i, i + GROUP))
  }
  if (groups.length === 0 || groups[groups.length - 1].length === GROUP) {
    groups.push('')
  }
  return groups
}

export function SequenceEditor({ value, onChange, minLength, maxLength }: Props) {
  const { t } = useLocale()
  const result = validateSequence(value, minLength, maxLength)
  const sequence = result.sequence
  const groups = splitGroups(sequence)
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  const caret = useRef<number | null>(null)
  const status =
    result.issue === 'empty'
      ? t('seq.empty')
      : result.issue === 'chars'
        ? t('seq.chars')
        : result.issue === 'short'
          ? t('seq.short', { min: minLength })
          : result.issue === 'long'
            ? t('seq.long', { max: maxLength })
            : t('seq.valid')

  useLayoutEffect(() => {
    if (caret.current === null) return
    const abs = Math.max(0, Math.min(caret.current, sequence.length))
    caret.current = null
    const groupIndex = Math.min(Math.floor(abs / GROUP), groups.length - 1)
    const offset = abs - groupIndex * GROUP
    const el = inputs.current[groupIndex]
    if (!el) return
    el.focus()
    const pos = Math.min(offset, el.value.length)
    el.setSelectionRange(pos, pos)
  }, [groups.length, sequence])

  function commit(next: string, nextCaret: number) {
    caret.current = nextCaret
    onChange(next)
  }

  function editGroup(groupIndex: number, nextRaw: string, localCaret: number) {
    const cleaned = cleanBases(nextRaw)
    const before = sequence.slice(0, groupIndex * GROUP)
    const after = sequence.slice(groupIndex * GROUP + (groups[groupIndex]?.length ?? 0))
    const next = before + cleaned + after
    commit(next, before.length + localCaret)
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-mute">
          <span>{t('seq.label')}</span>
          <span className="font-mono text-xs">{t('seq.group')}</span>
        </div>
        <div className="rounded-[16px] border border-line bg-raised p-4">
          <div className="mb-4 flex items-center justify-between font-mono text-xs text-mute">
            <span>5'</span>
            <span>3'</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 min-[400px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
            {groups.map((group, groupIndex) => {
              const start = groupIndex * GROUP + 1
              return (
                <label key={start} className="grid gap-1">
                  <span className="font-mono text-[11px] text-mute">{start}</span>
                  <input
                    ref={(el) => {
                      inputs.current[groupIndex] = el
                    }}
                    value={group}
                    spellCheck={false}
                    autoCapitalize="characters"
                    autoCorrect="off"
                    aria-label={t('seq.bases', { start, end: start + GROUP - 1 })}
                    className="w-full rounded-[8px] border border-line bg-bg px-1.5 py-2 text-center font-mono text-base uppercase tracking-[0.18em] text-ink outline-none focus:border-accent"
                    onChange={(event) => {
                      const raw = event.target.value
                      const sel = event.target.selectionStart ?? raw.length
                      const cleaned = cleanBases(raw)
                      const localCaret = cleanBases(raw.slice(0, sel)).length
                      editGroup(groupIndex, cleaned, localCaret)
                    }}
                    onPaste={(event) => {
                      event.preventDefault()
                      const pasted = cleanBases(event.clipboardData.getData('text'))
                      const el = event.currentTarget
                      const selStart = el.selectionStart ?? group.length
                      const selEnd = el.selectionEnd ?? group.length
                      const absStart = groupIndex * GROUP + selStart
                      const absEnd = groupIndex * GROUP + selEnd
                      const next = sequence.slice(0, absStart) + pasted + sequence.slice(absEnd)
                      commit(next, absStart + pasted.length)
                    }}
                    onKeyDown={(event) => {
                      const el = event.currentTarget
                      const pos = el.selectionStart ?? 0
                      if (event.key === 'ArrowLeft' && pos === 0 && groupIndex > 0) {
                        event.preventDefault()
                        const prev = inputs.current[groupIndex - 1]
                        if (prev) {
                          prev.focus()
                          prev.setSelectionRange(prev.value.length, prev.value.length)
                        }
                      }
                      if (event.key === 'ArrowRight' && pos === group.length && groupIndex < groups.length - 1) {
                        event.preventDefault()
                        const nextInput = inputs.current[groupIndex + 1]
                        if (nextInput) {
                          nextInput.focus()
                          nextInput.setSelectionRange(0, 0)
                        }
                      }
                      if (event.key === 'Backspace' && pos === 0 && groupIndex > 0 && el.selectionStart === el.selectionEnd) {
                        event.preventDefault()
                        const abs = groupIndex * GROUP
                        commit(sequence.slice(0, abs - 1) + sequence.slice(abs), abs - 1)
                      }
                    }}
                  />
                </label>
              )
            })}
          </div>
        </div>
      </div>
      <div className="editor-status grid gap-4 rounded-[16px] border border-line bg-surface p-5">
        <div>
          <p className="text-xs text-mute">{t('seq.length')}</p>
          <p className="font-mono text-2xl">{result.length} nt</p>
        </div>
        <div>
          <p className="text-xs text-mute">{t('seq.gc')}</p>
          <p className="font-mono text-2xl">{result.gcContent.toFixed(1)}%</p>
        </div>
        <div className="flex items-center gap-2">
          {result.valid ? (
            <CheckCircle size={22} className="text-accent" />
          ) : (
            <WarningCircle size={22} className="text-danger" />
          )}
          <p className={result.valid ? 'text-accent' : 'text-danger'}>{status}</p>
        </div>
      </div>
    </div>
  )
}
