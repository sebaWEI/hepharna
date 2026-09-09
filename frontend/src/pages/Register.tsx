import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../types'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setPending(true)
    setError('')
    try {
      await register(username, password, confirm)
      navigate('/challenge')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="mx-auto flex min-h-[80dvh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-4xl">Create account</h1>
      <form onSubmit={onSubmit} className="mt-8 grid gap-4">
        <label className="grid gap-2">
          <span>Nickname</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="rounded-[8px] border border-line bg-raised px-3 py-3 outline-none focus:border-accent"
            autoComplete="username"
            minLength={2}
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
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>
        <label className="grid gap-2">
          <span>Confirm Password</span>
          <input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="rounded-[8px] border border-line bg-raised px-3 py-3 outline-none focus:border-accent"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>
        {error ? <p className="text-danger">{error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating...' : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-mute">
        Already registered?{' '}
        <Link to="/login" className="text-accent">
          Login
        </Link>
      </p>
    </section>
  )
}
