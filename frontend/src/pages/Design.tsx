import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { RNAStructure } from '../components/RNAStructure'
import { SequenceEditor } from '../components/SequenceEditor'
import { useChallengeConfig } from '../hooks/useChallengeConfig'
import { api } from '../services/api'
import type { DesignPublic, FoldResult } from '../types'
import { errorMessage } from '../types'
import { validateSequence } from '../utils/rna'

type Mode = 'scratch' | 'reference'

export function DesignPage() {
  const navigate = useNavigate()
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
      setMessage('Draft saved.')
    } catch (err) {
      setError(errorMessage(err))
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
      setError(errorMessage(err))
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
      setError(errorMessage(err))
    } finally {
      setFolding(false)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl md:text-5xl">Design your HEPHA-RNA</h1>
      <p className="mt-3 max-w-[56ch] text-mute">
        Start from scratch, or edit the HEPHA reference. You can mutate bases and insert or delete
        nucleotides. Click preview to fold with ViennaRNA.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant={mode === 'scratch' ? 'primary' : 'ghost'} onClick={() => chooseMode('scratch')}>
          Design from scratch
        </Button>
        <Button
          variant={mode === 'reference' ? 'primary' : 'ghost'}
          onClick={() => chooseMode('reference')}
        >
          Edit HEPHA reference
        </Button>
        <Link to="/reference" className="inline-flex items-center text-sm text-accent">
          View HEPHA structure
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
          vs HEPHA: {lengthDelta >= 0 ? `+${lengthDelta}` : lengthDelta} nt
          {userFold && userFold.length_delta === 0
            ? `, ${userFold.substitutions ?? 0} substitution(s)`
            : ''}
        </p>
      ) : null}
      {error ? <p className="mt-4 text-danger">{error}</p> : null}
      {message ? <p className="mt-4 text-accent">{message}</p> : null}
      {!config.challenge_open ? (
        <p className="mt-4 text-warn">The challenge is closed for new submissions.</p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="quiet" onClick={previewStructure} disabled={folding || !parsed.valid}>
          {folding ? 'Folding...' : 'Preview secondary structure'}
        </Button>
        <Button variant="ghost" onClick={saveDraft} disabled={saving || !parsed.valid}>
          {saving ? 'Saving...' : 'Save draft'}
        </Button>
        <Button onClick={submit} disabled={submitting || !parsed.valid || !config.challenge_open}>
          {submitting ? 'Submitting...' : 'Submit Design'}
        </Button>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-xl">HEPHA reference</h2>
          <p className="mt-1 text-sm text-mute">ViennaRNA MFE structure</p>
          {referenceFold ? (
            <>
              <p className="mt-3 font-mono text-sm text-mute">
                {referenceFold.length} nt · {referenceFold.mfe.toFixed(2)} kcal/mol
              </p>
              <RNAStructure fold={referenceFold} className="mt-4" />
            </>
          ) : (
            <p className="mt-4 text-mute">Loading reference fold...</p>
          )}
        </div>
        <div>
          <h2 className="text-xl">Your design</h2>
          <p className="mt-1 text-sm text-mute">Click preview after you edit the sequence</p>
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
            <p className="mt-4 text-mute">No preview yet.</p>
          )}
        </div>
      </div>
    </section>
  )
}
