import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { RNAStructure } from '../components/RNAStructure'
import { SequenceDisplay } from '../components/SequenceDisplay'
import { api } from '../services/api'
import type { FoldResult } from '../types'
import { errorMessage } from '../types'

export function ReferencePage() {
  const [fold, setFold] = useState<FoldResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .referenceFold()
      .then(setFold)
      .catch((err) => setError(errorMessage(err)))
  }, [])

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <p className="font-mono text-sm tracking-[0.2em] text-accent">HEPHA REFERENCE</p>
      <h1 className="mt-3 text-4xl md:text-5xl">HEPHA RNA structure</h1>
      <p className="mt-4 max-w-[56ch] text-mute">
        This is the wild-type HEPHA sequence. You can copy it into the designer, then mutate bases
        or change the length. Secondary structure is predicted with ViennaRNA.
      </p>
      {error ? <p className="mt-6 text-danger">{error}</p> : null}
      {!fold && !error ? <p className="mt-6 text-mute">Folding HEPHA with ViennaRNA...</p> : null}
      {fold ? (
        <div className="mt-8 grid gap-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[16px] bg-surface p-4">
              <p className="text-xs text-mute">Length</p>
              <p className="font-mono text-3xl">{fold.length} nt</p>
            </div>
            <div className="rounded-[16px] bg-surface p-4">
              <p className="text-xs text-mute">MFE</p>
              <p className="font-mono text-3xl">{fold.mfe.toFixed(2)} kcal/mol</p>
            </div>
            <div className="rounded-[16px] bg-surface p-4">
              <p className="text-xs text-mute">GC content</p>
              <p className="font-mono text-3xl">{fold.gc_content.toFixed(1)}%</p>
            </div>
          </div>
          <RNAStructure fold={fold} />
          <div className="rounded-[16px] border border-line bg-surface p-5">
            <SequenceDisplay sequence={fold.sequence} compact />
            <p className="mt-4 break-all font-mono text-xs text-mute">{fold.structure}</p>
          </div>
          <Link to="/design" className="text-accent">
            Design from this sequence
          </Link>
        </div>
      ) : null}
    </section>
  )
}
