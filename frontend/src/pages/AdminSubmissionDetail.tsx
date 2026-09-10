import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { SequenceDisplay } from '../components/SequenceDisplay'
import { StatusBadge } from '../components/StatusBadge'
import { StructureViewer } from '../components/StructureViewer'
import { useLocale } from '../context/LocaleContext'
import { api } from '../services/api'
import type { AdminSubmission } from '../types'
import { formatDate, formatScore } from '../utils/rna'

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through */
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.left = '-9999px'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
}

export function AdminSubmissionDetailPage() {
  const { id } = useParams()
  const { locale, t, te } = useLocale()
  const [design, setDesign] = useState<AdminSubmission | null>(null)
  const [plddt, setPlddt] = useState('')
  const [iptm, setIptm] = useState('')
  const [error, setError] = useState('')
  const [copyMsg, setCopyMsg] = useState('')
  const [busy, setBusy] = useState<'save' | 'publish' | 'unpublish' | 'upload' | 'deleteStruct' | null>(
    null,
  )
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!id) return
    api
      .adminSubmission(Number(id))
      .then((row) => {
        setDesign(row)
        setPlddt(row.scores?.plddt != null ? String(row.scores.plddt) : '')
        setIptm(row.scores?.iptm != null ? String(row.scores.iptm) : '')
      })
      .catch((err) => setError(te(err)))
  }, [id, te])

  const previewTotal = useMemo(() => {
    const a = Number(plddt)
    const b = Number(iptm)
    if (Number.isNaN(a) || Number.isNaN(b)) return null
    return Math.round((0.5 * a + 0.5 * b) * 1_000_000) / 1_000_000
  }, [plddt, iptm])

  async function onCopy() {
    if (!design) return
    const ok = await copyText(design.sequence)
    setCopyMsg(ok ? t('admin.copied') : t('admin.copyFailed'))
    window.setTimeout(() => setCopyMsg(''), 2000)
  }

  async function saveScore(event: FormEvent) {
    event.preventDefault()
    if (!design || busy) return
    const plddtValue = Number(plddt)
    const iptmValue = Number(iptm)
    if (Number.isNaN(plddtValue) || Number.isNaN(iptmValue)) {
      setError(t('admin.numeric'))
      return
    }
    setBusy('save')
    setError('')
    try {
      const updated =
        design.score === null
          ? await api.saveScore(design.id, plddtValue, iptmValue)
          : await api.updateScore(design.id, plddtValue, iptmValue)
      setDesign(updated)
      setPlddt(updated.scores?.plddt != null ? String(updated.scores.plddt) : '')
      setIptm(updated.scores?.iptm != null ? String(updated.scores.iptm) : '')
    } catch (err) {
      setError(te(err))
    } finally {
      setBusy(null)
    }
  }

  async function onUploadStructure(file: File | null) {
    if (!design || !file || busy) return
    setBusy('upload')
    setError('')
    try {
      setDesign(await api.uploadStructure(design.id, file))
    } catch (err) {
      setError(te(err))
    } finally {
      setBusy(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function onDeleteStructure() {
    if (!design || busy) return
    setBusy('deleteStruct')
    setError('')
    try {
      setDesign(await api.deleteStructure(design.id))
    } catch (err) {
      setError(te(err))
    } finally {
      setBusy(null)
    }
  }

  async function publish() {
    if (!design || busy) return
    setBusy('publish')
    setError('')
    try {
      setDesign(await api.publish(design.id))
    } catch (err) {
      setError(te(err))
    } finally {
      setBusy(null)
    }
  }

  async function unpublish() {
    if (!design || busy) return
    setBusy('unpublish')
    setError('')
    try {
      setDesign(await api.unpublish(design.id))
    } catch (err) {
      setError(te(err))
    } finally {
      setBusy(null)
    }
  }

  if (!design) {
    return <p className={error ? 'text-danger' : 'text-mute'}>{error || t('designs.loading')}</p>
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <Link to="/admin/submissions" className="text-sm text-mute">
          {t('admin.backList')}
        </Link>
        <h1 className="mt-3 text-4xl">{t('admin.design', { id: design.design_id })}</h1>
        <div className="mt-6 rounded-[16px] border border-line bg-surface p-6">
          <p className="text-mute">{t('admin.participant')}</p>
          <p className="text-2xl">{design.username}</p>
          <p className="mt-1 font-mono text-mute">{design.participant_id}</p>
          <div className="mt-6">
            <SequenceDisplay sequence={design.sequence} />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" className="text-sm text-accent" onClick={onCopy}>
                {t('admin.copy')}
              </button>
              {copyMsg ? <span className="text-sm text-mute">{copyMsg}</span> : null}
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <p>
              {t('seq.length')}
              <span className="mt-1 block font-mono text-xl">{design.length} nt</span>
            </p>
            <p>
              {t('seq.gc')}
              <span className="mt-1 block font-mono text-xl">{design.gc_content.toFixed(1)}%</span>
            </p>
            <p>
              {t('designs.submitted')}
              <span className="mt-1 block text-mute">{formatDate(design.submitted_at, locale)}</span>
            </p>
            <p>
              {t('designs.status')}
              <span className="mt-2 block">
                <StatusBadge status={design.status} />
              </span>
            </p>
          </div>
        </div>
        {design.has_structure ? (
          <div className="mt-6">
            <StructureViewer designId={design.id} filename={design.structure_filename} />
          </div>
        ) : null}
      </div>
      <div className="grid gap-6">
        <form onSubmit={saveScore} className="rounded-[16px] border border-line bg-surface p-6">
          <h2 className="text-2xl">{t('admin.boltz')}</h2>
          <p className="mt-2 text-sm text-mute">{t('admin.scoreHint')}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span>{t('admin.plddt')}</span>
              <input
                value={plddt}
                onChange={(event) => setPlddt(event.target.value)}
                className="rounded-[8px] border border-line bg-raised px-3 py-3 font-mono text-2xl outline-none focus:border-accent"
                inputMode="decimal"
                step="any"
                min={0}
                max={1}
                required
              />
            </label>
            <label className="grid gap-2">
              <span>{t('admin.iptm')}</span>
              <input
                value={iptm}
                onChange={(event) => setIptm(event.target.value)}
                className="rounded-[8px] border border-line bg-raised px-3 py-3 font-mono text-2xl outline-none focus:border-accent"
                inputMode="decimal"
                step="any"
                min={0}
                max={1}
                required
              />
            </label>
          </div>
          <div className="mt-4 rounded-[12px] bg-raised px-4 py-3">
            <p className="text-xs text-mute">{t('admin.total')}</p>
            <p className="font-mono text-3xl">{formatScore(previewTotal ?? design.score)}</p>
          </div>
          {error ? <p className="mt-3 text-danger">{error}</p> : null}
          <p className="mt-3 text-sm text-mute">
            {t('admin.currentScore', { score: formatScore(design.score) })}
            {design.scores?.plddt != null && design.scores?.iptm != null
              ? ` · pLDDT ${formatScore(design.scores.plddt)} · ipTM ${formatScore(design.scores.iptm)}`
              : ''}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit" disabled={busy !== null}>
              {busy === 'save' ? t('admin.saving') : t('admin.save')}
            </Button>
            <Button type="button" variant="quiet" onClick={publish} disabled={busy !== null || design.score === null}>
              {busy === 'publish' ? t('admin.publishing') : t('admin.publish')}
            </Button>
            {design.status === 'published' ? (
              <Button type="button" variant="ghost" onClick={unpublish} disabled={busy !== null}>
                {busy === 'unpublish' ? t('admin.updating') : t('admin.unpublish')}
              </Button>
            ) : null}
          </div>
        </form>

        <div className="rounded-[16px] border border-line bg-surface p-6">
          <h2 className="text-2xl">{t('structure.uploadTitle')}</h2>
          <p className="mt-2 text-sm text-mute">{t('structure.uploadHint')}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".pdb,.cif,.mmcif,chemical/x-pdb,chemical/x-cif"
              className="text-sm text-mute file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-bg"
              disabled={busy !== null}
              onChange={(event) => onUploadStructure(event.target.files?.[0] ?? null)}
            />
            {design.has_structure ? (
              <Button type="button" variant="ghost" onClick={onDeleteStructure} disabled={busy !== null}>
                {busy === 'deleteStruct' ? t('structure.deleting') : t('structure.delete')}
              </Button>
            ) : null}
          </div>
          {busy === 'upload' ? <p className="mt-3 text-sm text-mute">{t('structure.uploading')}</p> : null}
          {design.has_structure ? (
            <p className="mt-3 font-mono text-sm text-mute">{design.structure_filename}</p>
          ) : (
            <p className="mt-3 text-sm text-mute">{t('structure.none')}</p>
          )}
        </div>
      </div>
    </section>
  )
}
