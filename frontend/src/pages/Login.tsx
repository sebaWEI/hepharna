import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../types'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/challenge'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const user = await login(username, password)
      navigate(user.role === 'admin' ? '/admin' : from)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="mx-auto flex min-h-[80dvh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-4xl">Login</h1>
      <form onSubmit={onSubmit} className="mt-8 grid gap-4">
        <label className="grid gap-2">
          <span>Username / Nickname</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="rounded-[8px] border border-line bg-raised px-3 py-3 outline-none focus:border-accent"
            autoComplete="username"
            required
          />
        </label>
        <label className="grid gap-2">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-[8px] border border-line bg-raised px-3 py-3 outline-none focus:border-accent"
            autoComplete="current-password"
            required
          />
        </label>
        {error ? <p className="text-danger">{error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? 'Signing in...' : 'Login'}
        </Button>
      </form>
      <p className="mt-6 text-mute">
        Don't have an account?{' '}
        <Link to="/register" className="text-accent">
          Create one
        </Link>
      </p>
    </section>
  )
}
