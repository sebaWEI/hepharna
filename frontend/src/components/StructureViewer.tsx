import { useEffect, useRef, useState } from 'react'
import { DownloadSimple } from '@phosphor-icons/react'
import { useLocale } from '../context/LocaleContext'
import { api } from '../services/api'

type Props = {
  designId: number
  filename?: string | null
  className?: string
}

type MolViewer = {
  addModel: (data: string, format: string) => unknown
  setStyle: (sel: object, style: object) => void
  zoomTo: () => void
  render: () => void
  clear: () => void
  resize?: () => void
}

export function StructureViewer({ designId, filename, className = '' }: Props) {
  const { t } = useLocale()
  const host = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let viewer: MolViewer | null = null

    async function load() {
      if (!host.current) return
      setLoading(true)
      setError('')
      try {
        const mod = await import('3dmol')
        const createViewer =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((mod as any).createViewer ?? (mod as any).default?.createViewer ?? (mod as any).$3Dmol?.createViewer) as
            | ((element: HTMLElement, config?: object) => MolViewer)
            | undefined
        if (!createViewer) throw new Error('3dmol createViewer missing')
        const text = await api.structureText(designId)
        if (cancelled || !host.current) return
        host.current.innerHTML = ''
        viewer = createViewer(host.current, {
          backgroundColor: '#101816',
          antialias: true,
        })
        const fmt = (filename || '').toLowerCase().endsWith('.pdb') ? 'pdb' : 'cif'
        viewer.addModel(text, fmt)
        viewer.setStyle({}, { cartoon: { color: 'spectrum' }, stick: { radius: 0.12 } })
        viewer.zoomTo()
        viewer.render()
        // Ensure canvas size matches the relative host after layout.
        requestAnimationFrame(() => {
          try {
            viewer?.resize?.()
            viewer?.render()
          } catch {
            /* ignore */
          }
        })
      } catch {
        if (!cancelled) setError(t('structure.loadFailed'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      try {
        viewer?.clear()
      } catch {
        /* ignore */
      }
    }
  }, [designId, filename, t])

  return (
    <div className={`overflow-hidden rounded-[16px] border border-line bg-raised ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm">{t('structure.title')}</p>
          <p className="truncate font-mono text-xs text-mute">{filename || t('structure.unnamed')}</p>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1 text-sm text-accent"
          onClick={() => api.downloadStructure(designId, filename)}
        >
          <DownloadSimple size={16} />
          {t('structure.download')}
        </button>
      </div>
      <div className="relative h-[360px] w-full">
        {loading ? (
          <p className="absolute inset-0 z-10 flex items-center justify-center bg-raised text-sm text-mute">
            {t('structure.loading')}
          </p>
        ) : null}
        {error ? (
          <p className="absolute inset-0 z-10 flex items-center justify-center bg-raised px-4 text-center text-sm text-danger">
            {error}
          </p>
        ) : null}
        {/* position:relative is required — 3Dmol canvas is absolute;top/left:0 */}
        <div ref={host} className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  )
}
