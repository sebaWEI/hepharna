import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { RNAStructure } from '../components/RNAStructure'
import { SequenceEditor } from '../components/SequenceEditor'
import { useLocale } from '../context/LocaleContext'
import { useChallengeConfig } from '../hooks/useChallengeConfig'
import { api } from '../services/api'
import type { DesignPublic, FoldResult } from '../types'
import { validateSequence } from '../utils/rna'

type Mode = 'scratch' | 'reference'

export function DesignPage() {
  const navigate = useNavigate()
  const { t, te } = useLocale()
  const { config } = useChallengeConfig()
  const [mode, setMode] = useState<Mode>('scratch')
  const [sequence, setSequence] = useState('')
  const [draft, setDraft] = useState<DesignPublic | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [folding, setFolding] = useState(false)
  const [userFold, setUserFold] = useState<FoldResult | null>(null)
  const [referenceFold, setReferenceFold] = useState<FoldResult | null>(null)

  useEffect(() => {
    api.referenceFold().then(setReferenceFold).catch(() => undefined)
    api.currentDesign().then((current) => {
      if (current.draft) {
        setDraft(current.draft)
        setSequence(current.draft.sequence)
        if (current.draft.sequence === config.reference_rna_sequence) setMode('reference')
      } else if (current.design) {
        setSequence(current.design.sequence)
      }
    })
  }, [config.reference_rna_sequence])

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
    setSaving(true)
    setError('')
    try {
      const saved = draft
        ? await api.updateDraft(draft.id, sequence)
        : await api.saveDraft(sequence)
      setDraft(saved)
      setSequence(saved.sequence)
      setMessage(t('design.saved'))
    } catch (err) {
      setError(te(err))
    } finally {
      setSaving(false)
    }
  }

  async function submit() {
    if (!parsed.valid || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const saved = draft
        ? await api.updateDraft(draft.id, sequence)
        : await api.saveDraft(sequence)
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

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl md:text-5xl">{t('design.title')}</h1>
      <p className="mt-3 max-w-[56ch] text-mute">{t('design.intro')}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant={mode === 'scratch' ? 'primary' : 'ghost'} onClick={() => chooseMode('scratch')}>
          {t('design.scratch')}
        </Button>
        <Button
          variant={mode === 'reference' ? 'primary' : 'ghost'}
          onClick={() => chooseMode('reference')}
        >
          {t('design.reference')}
        </Button>
        <Link to="/reference" className="inline-flex items-center text-sm text-accent">
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
      {error ? <p className="mt-4 text-danger">{error}</p> : null}
      {message ? <p className="mt-4 text-accent">{message}</p> : null}
      {!config.challenge_open ? (
        <p className="mt-4 text-warn">{t('design.closed')}</p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="quiet" onClick={previewStructure} disabled={folding || !parsed.valid}>
          {folding ? t('design.folding') : t('design.preview')}
        </Button>
        <Button variant="ghost" onClick={saveDraft} disabled={saving || !parsed.valid}>
          {saving ? t('design.saving') : t('design.save')}
        </Button>
        <Button onClick={submit} disabled={submitting || !parsed.valid || !config.challenge_open}>
          {submitting ? t('design.submitting') : t('design.submit')}
        </Button>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-xl">{t('design.refTitle')}</h2>
          <p className="mt-1 text-sm text-mute">{t('design.refHint')}</p>
          {referenceFold ? (
            <>
              <p className="mt-3 font-mono text-sm text-mute">
                {referenceFold.length} nt · {referenceFold.mfe.toFixed(2)} kcal/mol
              </p>
              <RNAStructure fold={referenceFold} className="mt-4" />
            </>
          ) : (
            <p className="mt-4 text-mute">{t('design.refLoading')}</p>
          )}
        </div>
        <div>
          <h2 className="text-xl">{t('design.yours')}</h2>
          <p className="mt-1 text-sm text-mute">{t('design.yoursHint')}</p>
          {userFold ? (
            <>
              <p className="mt-3 font-mono text-sm text-mute">
                {userFold.length} nt · {userFold.mfe.toFixed(2)} kcal/mol
              </p>
              <RNAStructure
                fold={userFold}
                highlight={userFold.changed_positions ?? []}
                className="mt-4"
              />
            </>
          ) : (
            <p className="mt-4 text-mute">{t('design.noPreview')}</p>
          )}
        </div>
      </div>
    </section>
  )
}
