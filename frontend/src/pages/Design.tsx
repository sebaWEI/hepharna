import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { SequenceEditor } from '../components/SequenceEditor'
import { useChallengeConfig } from '../hooks/useChallengeConfig'
import { api } from '../services/api'
import type { DesignPublic } from '../types'
import { errorMessage } from '../types'
import { validateSequence } from '../utils/rna'

export function DesignPage() {
  const navigate = useNavigate()
  const { config } = useChallengeConfig()
  const [sequence, setSequence] = useState('')
  const [draft, setDraft] = useState<DesignPublic | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.currentDesign().then((current) => {
      if (current.draft) {
        setDraft(current.draft)
        setSequence(current.draft.sequence)
      } else if (current.design) {
        setSequence(current.design.sequence)
      }
    })
  }, [])

  const parsed = validateSequence(sequence, config.min_rna_length, config.max_rna_length)

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

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-4xl md:text-5xl">Design your HEPHA-RNA</h1>
      <p className="mt-3 max-w-[50ch] text-mute">
        Only A, U, G and C are allowed. Submitted designs are locked. Edit creates a new draft.
      </p>
      <div className="mt-8">
        <SequenceEditor
          value={sequence}
          onChange={setSequence}
          minLength={config.min_rna_length}
          maxLength={config.max_rna_length}
        />
      </div>
      {error ? <p className="mt-4 text-danger">{error}</p> : null}
      {message ? <p className="mt-4 text-accent">{message}</p> : null}
      {!config.challenge_open ? (
        <p className="mt-4 text-warn">The challenge is closed for new submissions.</p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="ghost" onClick={saveDraft} disabled={saving || !parsed.valid}>
          {saving ? 'Saving...' : 'Save draft'}
        </Button>
        <Button onClick={submit} disabled={submitting || !parsed.valid || !config.challenge_open}>
          {submitting ? 'Submitting...' : 'Submit Design'}
        </Button>
      </div>
    </section>
  )
}
