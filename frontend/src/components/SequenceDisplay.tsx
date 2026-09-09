const COLORS: Record<string, string> = {
  A: 'text-base-a',
  U: 'text-base-u',
  G: 'text-base-g',
  C: 'text-base-c',
}

export function SequenceDisplay({ sequence, compact = false }: { sequence: string; compact?: boolean }) {
  return (
    <p className={`font-mono leading-relaxed ${compact ? 'text-sm' : 'text-lg md:text-2xl'} break-all`}>
      <span className="text-mute">5' </span>
      {[...sequence].map((base, index) => (
        <span key={`${base}-${index}`} className={COLORS[base] ?? 'text-danger'}>
          {base}
        </span>
      ))}
      <span className="text-mute"> 3'</span>
    </p>
  )
}
