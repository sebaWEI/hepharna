export type Role = 'user' | 'admin'

export type DesignStatus =
  | 'draft'
  | 'submitted'
  | 'evaluating'
  | 'scored'
  | 'published'
  | 'rejected'

export type UserPublic = {
  id: number
  username: string
  participant_id: string
  role: Role
  rank: number | null
  best_score: number | null
  submission_count: number
  max_submissions: number
}

export type ScorePublic = {
  overall_score: number
  structure_score: number | null
  interface_score: number | null
  clash_score: number | null
  confidence_score: number | null
  published_at: string | null
  updated_at: string | null
}

export type DesignPublic = {
  id: number
  design_id: string
  version: number
  sequence: string
  status: DesignStatus
  length: number
  gc_content: number
  score: number | null
  scores: ScorePublic | null
  rank: number | null
  submitted_at: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export type CurrentDesignResponse = {
  design: DesignPublic | null
  draft: DesignPublic | null
}

export type LeaderboardEntry = {
  rank: number
  username: string
  participant_id: string
  score: number
  design_id: string
  published_at: string | null
}

export type LeaderboardResponse = {
  entries: LeaderboardEntry[]
  challenge_start_time: string | null
  challenge_end_time: string | null
  challenge_ended: boolean
  generated_at: string
}

export type ChallengeConfig = {
  min_rna_length: number
  max_rna_length: number
  max_submissions_per_user: number
  challenge_start_time: string | null
  challenge_end_time: string | null
  challenge_open: boolean
  minecraft_server_address: string
  minecraft_info: string
}

export type AdminDashboard = {
  participants: number
  total_designs: number
  pending: number
  published: number
  scored: number
  drafts: number
}

export type AdminSubmission = DesignPublic & {
  username: string
  participant_id: string
  user_id: number
}

export type AdminUser = {
  id: number
  username: string
  participant_id: string
  role: Role
  created_at: string
  submission_count: number
  best_score: number | null
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}
