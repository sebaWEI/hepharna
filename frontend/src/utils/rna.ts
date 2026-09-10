export type SequenceIssue = {
  valid: boolean
  sequence: string
  length: number
  gcContent: number
  issue: 'empty' | 'chars' | 'short' | 'long' | null
  message: string
}

const RNA = new Set(['A', 'U', 'G', 'C'])

export function normalizeSequence(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase()
}

export function gcContent(sequence: string): number {
  if (!sequence.length) return 0
  const gc = [...sequence].filter((base) => base === 'G' || base === 'C').length
  return Math.round((gc / sequence.length) * 1000) / 10
}

export function validateSequence(
  raw: string,
  minLength: number,
  maxLength: number,
): SequenceIssue {
  const sequence = normalizeSequence(raw)
  if (!sequence) {
    return {
      valid: false,
      sequence,
      length: 0,
      gcContent: 0,
      issue: 'empty',
      message: 'Sequence cannot be empty.',
    }
  }
  const invalid = [...sequence].filter((ch) => !RNA.has(ch))
  if (invalid.length) {
    return {
      valid: false,
      sequence,
      length: sequence.length,
      gcContent: gcContent(sequence),
      issue: 'chars',
      message: 'Your sequence contains invalid characters. Only A, U, G and C are allowed.',
    }
  }
  if (sequence.length < minLength) {
    return {
      valid: false,
      sequence,
      length: sequence.length,
      gcContent: gcContent(sequence),
      issue: 'short',
      message: `Sequence is too short. Minimum length is ${minLength} nt.`,
    }
  }
  if (sequence.length > maxLength) {
    return {
      valid: false,
      sequence,
      length: sequence.length,
      gcContent: gcContent(sequence),
      issue: 'long',
      message: `Sequence is too long. Maximum length is ${maxLength} nt.`,
    }
  }
  return {
    valid: true,
    sequence,
    length: sequence.length,
    gcContent: gcContent(sequence),
    issue: null,
    message: 'Valid RNA sequence',
  }
}

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return '-'
  if (Math.abs(score) <= 1) return score.toFixed(4)
  return score.toFixed(2)
}

export function formatDate(value: string | null | undefined, locale: 'en' | 'zh' = 'en'): string {
  if (!value) return '-'
  const date = new Date(value)
  return date.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return 'Draft'
    case 'submitted':
    case 'evaluating':
      return 'Evaluation pending'
    case 'scored':
      return 'Scored'
    case 'published':
      return 'Published'
    case 'rejected':
      return 'Rejected'
    default:
      return status
  }
}
