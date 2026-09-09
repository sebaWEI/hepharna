import { useMemo } from 'react'
import { useLocale } from '../context/LocaleContext'
import type { FoldResult, Residue } from '../types'

const BASE_COLOR: Record<string, string> = {
  A: '#d4a84b',
  U: '#5aa8b8',
  G: '#d46757',
  C: '#6f8fbf',
}

type Point = { x: number; y: number }

function median(values: number[]): number {
  if (!values.length) return 15
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

function untangle(points: Point[], paired: Array<number | null>): Point[] {
  const n = points.length
  if (n < 3) return points
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const spaces: number[] = []
  for (let i = 0; i < n - 1; i += 1) {
    spaces.push(Math.hypot(xs[i + 1] - xs[i], ys[i + 1] - ys[i]))
  }
  const ideal = median(spaces)
  const minSep = ideal * 0.92
  let crowded = false
  for (let i = 0; i < n && !crowded; i += 1) {
    for (let j = i + 2; j < n; j += 1) {
      if (Math.hypot(xs[j] - xs[i], ys[j] - ys[i]) < minSep) {
        crowded = true
        break
      }
    }
  }
  if (!crowded) return points

  const pairIdeal = ideal * 1.25
  for (let iter = 0; iter < 80; iter += 1) {
    const fx = Array.from({ length: n }, () => 0)
    const fy = Array.from({ length: n }, () => 0)
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const dx = xs[j] - xs[i]
        const dy = ys[j] - ys[i]
        const dist = Math.hypot(dx, dy) || 0.01
        const limit = j === i + 1 ? ideal * 0.72 : minSep
        if (dist < limit) {
          const push = ((limit - dist) / dist) * 0.38
          fx[i] -= dx * push
          fy[i] -= dy * push
          fx[j] += dx * push
          fy[j] += dy * push
        }
      }
    }
    for (let i = 0; i < n - 1; i += 1) {
      const dx = xs[i + 1] - xs[i]
      const dy = ys[i + 1] - ys[i]
      const dist = Math.hypot(dx, dy) || 0.01
      const pull = ((dist - ideal) / dist) * 0.22
      fx[i] += dx * pull
      fy[i] += dy * pull
      fx[i + 1] -= dx * pull
      fy[i + 1] -= dy * pull
    }
    for (let i = 0; i < n; i += 1) {
      const j = paired[i]
      if (j === null || j <= i) continue
      const dx = xs[j] - xs[i]
      const dy = ys[j] - ys[i]
      const dist = Math.hypot(dx, dy) || 0.01
      const pull = ((dist - pairIdeal) / dist) * 0.16
      fx[i] += dx * pull
      fy[i] += dy * pull
      fx[j] -= dx * pull
      fy[j] -= dy * pull
    }
    for (let i = 0; i < n; i += 1) {
      xs[i] += fx[i] * 0.55
      ys[i] += fy[i] * 0.55
    }
  }
  return xs.map((x, i) => ({ x, y: ys[i] }))
}

function labelAnchor(residues: Residue[], index: number, radius: number): Point {
  const current = residues[index]
  const prev = residues[index - 1] ?? current
  const next = residues[index + 1] ?? current
  const tx = next.x - prev.x
  const ty = next.y - prev.y
  const len = Math.hypot(tx, ty) || 1
  let nx = -ty / len
  let ny = tx / len
  const cx = residues.reduce((sum, residue) => sum + residue.x, 0) / residues.length
  const cy = residues.reduce((sum, residue) => sum + residue.y, 0) / residues.length
  if (nx * (current.x - cx) + ny * (current.y - cy) < 0) {
    nx = -nx
    ny = -ny
  }
  return {
    x: current.x + nx * radius * 2.4,
    y: current.y + ny * radius * 2.4,
  }
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
  const { t } = useLocale()
  const layout = useMemo(() => {
    const paired = fold.residues.map((residue) => residue.paired_to)
    const placed = untangle(
      fold.residues.map((residue) => ({ x: residue.x, y: residue.y })),
      paired,
    )
    const residues = fold.residues.map((residue, index) => ({
      ...residue,
      x: placed[index].x,
      y: placed[index].y,
    }))
    const xs = residues.map((residue) => residue.x)
    const ys = residues.map((residue) => residue.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const width = Math.max(maxX - minX, 1)
    const height = Math.max(maxY - minY, 1)
    const distances: number[] = []
    let minPair = Number.POSITIVE_INFINITY
    for (let i = 0; i < residues.length; i += 1) {
      if (i < residues.length - 1) {
        distances.push(Math.hypot(residues[i + 1].x - residues[i].x, residues[i + 1].y - residues[i].y))
      }
      for (let j = i + 1; j < residues.length; j += 1) {
        minPair = Math.min(minPair, Math.hypot(residues[j].x - residues[i].x, residues[j].y - residues[i].y))
      }
    }
    const spacing = median(distances)
    const radius = Math.max(2.6, Math.min(7.2, spacing * 0.34, minPair * 0.38))
    const pad = Math.max(36, radius * 4.2)
    return {
      residues,
      minX: minX - pad,
      minY: minY - pad,
      width: width + pad * 2,
      height: height + pad * 2,
      radius,
    }
  }, [fold])

  const marked = new Set(highlight)
  const backbone = layout.residues.map((residue) => `${residue.x},${residue.y}`).join(' ')

  return (
    <div className={`overflow-hidden rounded-[16px] border border-line bg-raised ${className}`}>
      <svg
        viewBox={`${layout.minX} ${layout.minY} ${layout.width} ${layout.height}`}
        className="h-auto w-full"
        role="img"
        aria-label={t('ref.structureLabel')}
      >
        <polyline
          points={backbone}
          fill="none"
          stroke="#2c3d36"
          strokeWidth={layout.radius * 0.35}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {layout.residues.map((residue) =>
          residue.paired_to !== null && residue.paired_to > residue.index ? (
            <line
              key={`pair-${residue.index}`}
              x1={residue.x}
              y1={residue.y}
              x2={layout.residues[residue.paired_to].x}
              y2={layout.residues[residue.paired_to].y}
              stroke="#3db89a"
              strokeOpacity={0.55}
              strokeWidth={layout.radius * 0.28}
            />
          ) : null,
        )}
        {layout.residues.map((residue) => {
          const number = (residue.index + 1) % 5 === 1 ? labelAnchor(layout.residues, residue.index, layout.radius) : null
          return (
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
              {number ? (
                <text
                  x={number.x}
                  y={number.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="JetBrains Mono, ui-monospace, monospace"
                  fontSize={Math.max(6, layout.radius * 0.95)}
                  fill="#8aa396"
                >
                  {residue.index + 1}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
