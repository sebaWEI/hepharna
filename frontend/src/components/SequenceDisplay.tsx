const COLORS: Record<string, string> = {
  A: 'text-base-a',
  U: 'text-base-u',
  G: 'text-base-g',
  C: 'text-base-c',
}

const GROUP = 5

export function SequenceDisplay({ sequence, compact = false }: { sequence: string; compact?: boolean }) {
  const groups: string[] = []
  for (let i = 0; i < sequence.length; i += GROUP) {
    groups.push(sequence.slice(i, i + GROUP))
  }
  return (
    <div className={`font-mono ${compact ? 'text-sm' : 'text-lg'}`}>
      <p className="mb-3 text-xs text-mute">5'</p>
      <div className="flex flex-wrap gap-x-4 gap-y-3">
        {groups.map((group, groupIndex) => {
          const start = groupIndex * GROUP + 1
          return (
            <span key={start} className="grid gap-1">
              <span className="text-[11px] text-mute">{start}</span>
              <span className="tracking-[0.14em]">
                {[...group].map((base, offset) => (
                  <span key={`${start}-${offset}`} className={COLORS[base] ?? 'text-danger'}>
                    {base}
                  </span>
                ))}
              </span>
            </span>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-mute">3'</p>
    </div>
  )
}
