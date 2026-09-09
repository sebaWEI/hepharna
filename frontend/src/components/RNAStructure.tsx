import { useMemo } from 'react'
import type { FoldResult } from '../types'

const BASE_COLOR: Record<string, string> = {
  A: '#d4a84b',
  U: '#5aa8b8',
  G: '#d46757',
  C: '#6f8fbf',
}

export function RNAStructure({
  fold,
  highlight = [],
  className = '',
}: {
  fold: FoldResult
  highlight?: number[]
  className?: string
}) {
  const layout = useMemo(() => {
    const xs = fold.residues.map((residue) => residue.x)
    const ys = fold.residues.map((residue) => residue.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const width = Math.max(maxX - minX, 1)
    const height = Math.max(maxY - minY, 1)
    const pad = 18
    const distances: number[] = []
    for (let i = 0; i < fold.residues.length - 1; i += 1) {
      const dx = fold.residues[i + 1].x - fold.residues[i].x
      const dy = fold.residues[i + 1].y - fold.residues[i].y
      distances.push(Math.hypot(dx, dy))
    }
    const spacing = distances.length ? distances.reduce((a, b) => a + b, 0) / distances.length : 12
    const radius = Math.max(3.2, Math.min(7, spacing * 0.32))
    return {
      minX: minX - pad,
      minY: minY - pad,
      width: width + pad * 2,
      height: height + pad * 2,
      radius,
    }
  }, [fold])

  const marked = new Set(highlight)
  const backbone = fold.residues.map((residue) => `${residue.x},${residue.y}`).join(' ')

  return (
    <div className={`overflow-hidden rounded-[16px] border border-line bg-raised ${className}`}>
      <svg
        viewBox={`${layout.minX} ${layout.minY} ${layout.width} ${layout.height}`}
        className="h-auto w-full"
        role="img"
        aria-label="RNA secondary structure"
      >
        <polyline
          points={backbone}
          fill="none"
          stroke="#2c3d36"
          strokeWidth={layout.radius * 0.35}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {fold.residues.map((residue) =>
          residue.paired_to !== null && residue.paired_to > residue.index ? (
            <line
              key={`pair-${residue.index}`}
              x1={residue.x}
              y1={residue.y}
              x2={fold.residues[residue.paired_to].x}
              y2={fold.residues[residue.paired_to].y}
              stroke="#3db89a"
              strokeOpacity={0.55}
              strokeWidth={layout.radius * 0.28}
            />
          ) : null,
        )}
        {fold.residues.map((residue) => (
          <g key={residue.index}>
            <circle
              cx={residue.x}
              cy={residue.y}
              r={layout.radius}
              fill={BASE_COLOR[residue.base] ?? '#8aa396'}
              stroke={marked.has(residue.index) ? '#e7f1ec' : 'transparent'}
              strokeWidth={marked.has(residue.index) ? layout.radius * 0.28 : 0}
            />
            <text
              x={residue.x}
              y={residue.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize={layout.radius * 1.15}
              fill="#0c1210"
            >
              {residue.base}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
