import { ApiError } from '../types'
import type {
  AdminDashboard,
  AdminSubmission,
  AdminUser,
  ChallengeConfig,
  CurrentDesignResponse,
  DesignPublic,
  FoldResult,
  LeaderboardResponse,
  UserPublic,
} from '../types'

const TOKEN_KEY = 'hepha_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function detailMessage(payload: unknown): string {
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail[0] && typeof detail[0] === 'object' && 'msg' in detail[0]) {
      return String((detail[0] as { msg: string }).msg)
    }
  }
  return 'Something went wrong. Please try again.'
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(path, { ...init, headers })
  } catch {
    throw new ApiError(0, 'Something went wrong. Please try again.')
  }

  if (response.status === 204) return undefined as T
  const text = await response.text()
  const payload = text ? JSON.parse(text) : null
  if (!response.ok) {
    throw new ApiError(response.status, detailMessage(payload))
  }
  return payload as T
}

export const api = {
  register(username: string, password: string, confirmPassword: string) {
    return request<{ access_token: string; user: UserPublic }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        confirm_password: confirmPassword,
      }),
    })
  },
  login(username: string, password: string) {
    return request<{ access_token: string; user: UserPublic }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },
  me() {
    return request<UserPublic>('/api/me')
  },
  config() {
    return request<ChallengeConfig>('/api/challenge/config')
  },
  fold(sequence: string) {
    return request<FoldResult>('/api/rna/fold', {
      method: 'POST',
      body: JSON.stringify({ sequence }),
    })
  },
  referenceFold() {
    return request<FoldResult>('/api/rna/reference')
  },
  currentDesign() {
    return request<CurrentDesignResponse>('/api/me/current-design')
  },
  myDesigns() {
    return request<DesignPublic[]>('/api/me/designs')
  },
  getDesign(id: number) {
    return request<DesignPublic>(`/api/designs/${id}`)
  },
  saveDraft(sequence: string) {
    return request<DesignPublic>('/api/designs', {
      method: 'POST',
      body: JSON.stringify({ sequence }),
    })
  },
  updateDraft(id: number, sequence: string) {
    return request<DesignPublic>(`/api/designs/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ sequence }),
    })
  },
  submit(id: number) {
    return request<{ message: string; design: DesignPublic }>(`/api/designs/${id}/submit`, {
      method: 'POST',
    })
  },
  leaderboard(limit = 20) {
    return request<LeaderboardResponse>(`/api/leaderboard?limit=${limit}`)
  },
  adminDashboard() {
    return request<AdminDashboard>('/api/admin/dashboard')
  },
  adminUsers() {
    return request<AdminUser[]>('/api/admin/users')
  },
  adminSubmissions(params: { status?: string; q?: string; sort?: string; order?: string } = {}) {
    const query = new URLSearchParams()
    if (params.status) query.set('status', params.status)
    if (params.q) query.set('q', params.q)
    if (params.sort) query.set('sort', params.sort)
    if (params.order) query.set('order', params.order)
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return request<AdminSubmission[]>(`/api/admin/submissions${suffix}`)
  },
  adminSubmission(id: number) {
    return request<AdminSubmission>(`/api/admin/submissions/${id}`)
  },
  saveScore(id: number, overallScore: number) {
    return request<AdminSubmission>(`/api/admin/submissions/${id}/score`, {
      method: 'POST',
      body: JSON.stringify({ overall_score: overallScore }),
    })
  },
  updateScore(id: number, overallScore: number) {
    return request<AdminSubmission>(`/api/admin/submissions/${id}/score`, {
      method: 'PUT',
      body: JSON.stringify({ overall_score: overallScore }),
    })
  },
  publish(id: number) {
    return request<AdminSubmission>(`/api/admin/submissions/${id}/publish`, {
      method: 'POST',
    })
  },
  unpublish(id: number) {
    return request<AdminSubmission>(`/api/admin/submissions/${id}/unpublish`, {
      method: 'POST',
    })
  },
  async exportCsv() {
    const token = getToken()
    const response = await fetch('/api/admin/export', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    if (!response.ok) {
      throw new ApiError(response.status, 'Could not export submissions.')
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'hepha-rna-submissions.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
}
