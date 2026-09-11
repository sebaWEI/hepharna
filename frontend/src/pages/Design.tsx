import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { FoldDetails } from '../components/FoldDetails'
import { HistoricalDesignReference } from '../components/HistoricalDesignReference'
import { SequenceEditor } from '../components/SequenceEditor'
import { useLocale } from '../context/LocaleContext'
import { useChallengeConfig } from '../hooks/useChallengeConfig'
import { api } from '../services/api'
import type { DesignPublic, FoldResult } from '../types'
import { validateSequence } from '../utils/rna'

type Mode = 'scratch' | 'reference'

export function DesignPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const sourceId = searchParams.get('from')
  const editId = searchParams.get('draft')
  const { t, te } = useLocale()
  const { config, loading: configLoading } = useChallengeConfig()
  const [mode, setMode] = useState<Mode>('scratch')
  const [sequence, setSequence] = useState('')
  const [name, setName] = useState('')
  const [source, setSource] = useState<DesignPublic | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [draft, setDraft] = useState<DesignPublic | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [folding, setFolding] = useState(false)
  const [userFold, setUserFold] = useState<FoldResult | null>(null)
  const [referenceFold, setReferenceFold] = useState<FoldResult | null>(null)

  useEffect(() => {
    let cancelled = false
    api.referenceFold().then((result) => { if (!cancelled) setReferenceFold(result) }).catch(() => undefined)
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (configLoading) return
    let cancelled = false
    setInitializing(true)
    setLoadError(null)
    setUserFold(null)
    async function load() {
      let selected: DesignPublic | null = null
      let editable: DesignPublic | null = null
      let original: DesignPublic | null = null
      async function readDesign(value: string) {
        const id = Number(value)
        if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Design not found.')
        return api.getDesign(id)
      }
      if (sourceId !== null || editId !== null) {
        const [historical, currentDraft] = await Promise.all([
          sourceId !== null ? readDesign(sourceId) : Promise.resolve(null),
          editId !== null ? readDesign(editId) : Promise.resolve(null),
        ])
        original = historical
        if (currentDraft && currentDraft.status !== 'draft') throw new Error('Submitted designs cannot be edited. Create a new draft instead.')
        editable = currentDraft
        selected = currentDraft ?? historical
      } else {
        const current = await api.currentDesign()
        selected = current.draft ?? current.design
        editable = current.draft
      }
      if (cancelled) return
      setSource(original)
      setDraft(editable)
      setSequence(selected?.sequence ?? '')
      setName(selected?.name ?? '')
      setMode(selected?.sequence === config.reference_rna_sequence ? 'reference' : 'scratch')
    }
    load().catch((err: unknown) => { if (!cancelled) setLoadError(err) })
      .finally(() => { if (!cancelled) setInitializing(false) })
    return () => { cancelled = true }
  }, [sourceId, editId, configLoading, config.reference_rna_sequence])

  const parsed = validateSequence(sequence, config.min_rna_length, config.max_rna_length)
  const lengthDelta = parsed.sequence.length - (config.reference_rna_sequence?.length ?? 0)
  const deltaLabel = `${lengthDelta >= 0 ? `+${lengthDelta}` : lengthDelta}`

  function chooseMode(next: Mode) {
    setMode(next)
    setUserFold(null)
    if (next === 'reference' && config.reference_rna_sequence) {
      setSequence(config.reference_rna_sequence)
    }
    if (next === 'scratch') {
      setSequence('')
    }
  }

  async function saveDraft() {
    if (!parsed.valid || saving || submitting) return
    setSaving(true)
    setError('')
    try {
      const saved = draft
        ? await api.updateDraft(draft.id, sequence, name)
        : await api.saveDraft(sequence, name, sourceId !== null)
      setDraft(saved)
      setSequence(saved.sequence)
      setName(saved.name ?? '')
      setMessage(t('design.saved'))
      setSearchParams({ draft: String(saved.id), ...(sourceId !== null ? { from: sourceId } : {}) }, { replace: true })
    } catch (err) {
      setError(te(err))
    } finally {
      setSaving(false)
    }
  }

  async function submit() {
    if (!parsed.valid || submitting || saving) return
    setSubmitting(true)
    setError('')
    try {
      const saved = draft
        ? await api.updateDraft(draft.id, sequence, name)
        : await api.saveDraft(sequence, name, sourceId !== null)
      setDraft(saved)
      const result = await api.submit(saved.id)
      navigate('/challenge', { state: { submitted: result.design } })
    } catch (err) {
      setError(te(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function previewStructure() {
    if (!parsed.valid || folding) return
    setFolding(true)
    setError('')
    try {
      setUserFold(await api.fold(sequence))
    } catch (err) {
      setError(te(err))
    } finally {
      setFolding(false)
    }
  }

  if (configLoading || initializing) return <p className="px-4 py-16 text-mute" role="status">{t('designs.loading')}</p>
  if (loadError) return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-danger" role="alert">{te(loadError)}</p>
      <Link to="/designs" className="mt-4 inline-block text-accent">{t('designs.back')}</Link>
    </section>
  )

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl md:text-5xl">{t('design.title')}</h1>
      <p className="design-intro mt-4 whitespace-pre-line text-mute">{t('design.intro')}</p>
      {source ? (
        <p className="mt-4 break-words border-l-2 border-accent pl-3 text-sm text-mute">
          {t('design.fromVersion', { name: source.name || source.design_id, version: source.version })}
        </p>
      ) : null}
      <div className="mt-6 max-w-xl">
        <label htmlFor="design-name" className="block text-sm">{t('design.name')}</label>
        <input id="design-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80}
          disabled={saving || submitting} placeholder={t('design.namePlaceholder')} aria-describedby="design-name-hint"
          className="mt-2 w-full rounded-lg border border-line bg-surface px-4 py-3 text-ink focus:border-accent focus:outline-none" />
        <p id="design-name-hint" className="mt-2 text-xs text-mute">{t('design.nameHint')}</p>
      </div>
      <fieldset disabled={saving || submitting} className="min-w-0 border-0 p-0">
      <div className="design-actions mt-6 flex flex-wrap gap-3">
        <Button variant={mode === 'scratch' ? 'primary' : 'ghost'} onClick={() => chooseMode('scratch')}>
          {t('design.scratch')}
        </Button>
        <Button
          variant={mode === 'reference' ? 'primary' : 'ghost'}
          onClick={() => chooseMode('reference')}
        >
          {t('design.reference')}
        </Button>
        <Link to={source ? `/reference?from=${source.id}` : '/reference'} className="inline-flex items-center text-sm text-accent">
          {t('design.viewStructure')}
        </Link>
      </div>
      <div className="mt-8">
        <SequenceEditor
          value={sequence}
          onChange={(value) => {
            setSequence(value)
            setUserFold(null)
          }}
          minLength={config.min_rna_length}
          maxLength={config.max_rna_length}
        />
      </div>
      {mode === 'reference' && config.reference_rna_sequence ? (
        <p className="mt-3 text-sm text-mute">
          {t('design.vsHepha', { delta: deltaLabel })}
          {userFold && userFold.length_delta === 0
            ? t('design.substitutions', { n: userFold.substitutions ?? 0 })
            : ''}
        </p>
      ) : null}
      </fieldset>
      {error ? <p className="mt-4 text-danger">{error}</p> : null}
      {message ? <p className="mt-4 text-accent">{message}</p> : null}
      {!config.challenge_open ? (
        <p className="mt-4 text-warn">{t('design.closed')}</p>
      ) : null}
      <div className="design-actions mt-6 flex flex-wrap gap-3">
        <Button variant="quiet" onClick={previewStructure} disabled={folding || !parsed.valid}>
          {folding ? t('design.folding') : t('design.preview')}
        </Button>
        <Button variant="ghost" onClick={saveDraft} disabled={saving || submitting || !parsed.valid}>
          {saving ? t('design.saving') : t('design.save')}
        </Button>
        <Button onClick={submit} disabled={submitting || saving || !parsed.valid || !config.challenge_open}>
          {submitting ? t('design.submitting') : t('design.submit')}
        </Button>
      </div>
      <div className="reference-grid mt-12 grid items-start gap-8 lg:grid-cols-2" aria-label={t('design.referenceInfo')}>
        <section className="min-w-0" aria-label={t('design.originalReference')}>
          <h2 className="text-xl">{source ? t('design.originalReference') : t('design.refTitle')}</h2>
          <p className="mt-1 text-sm text-mute">{t('design.refHint')}</p>
          {referenceFold ? (
            <div className="mt-4"><FoldDetails fold={referenceFold} /></div>
          ) : (
            <p className="mt-4 text-mute">{t('design.refLoading')}</p>
          )}
        </section>
        {source ? <HistoricalDesignReference key={source.id} design={source} /> : null}
        <section className={`min-w-0 ${source ? 'lg:col-span-2' : ''}`} aria-label={t('design.yours')}>
          <h2 className="text-xl">{t('design.yours')}</h2>
          <p className="mt-1 text-sm text-mute">{t('design.yoursHint')}</p>
          {userFold ? (
            <div className="mt-4"><FoldDetails fold={userFold} highlight={userFold.changed_positions ?? []} /></div>
          ) : (
            <p className="mt-4 text-mute">{t('design.noPreview')}</p>
          )}
        </section>
      </div>
    </section>
  )
}
