import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'

export function Login() {
  const { linkError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(linkError ? `${linkError}. Ask an admin to send a new invite.` : null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setError(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message)
    setBusy(false)
  }

  const forgot = async () => {
    if (!email.trim()) return setError('Type your email above first, then press “Forgot password”.')
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin })
    if (error) setError(error.message)
    else setInfo('If that email belongs to the team, a reset link is on its way.')
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand big"><span className="logo" aria-hidden>▤</span> Team CRM</div>
        <p className="muted">Sign in with your work email.</p>
        <label>Email
          <input type="email" autoComplete="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>Password
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="error-msg">{error}</p>}
        {info && <p className="ok-msg">{info}</p>}
        <button className="btn primary block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <button type="button" className="link-btn" onClick={forgot}>Forgot password?</button>
      </form>
    </div>
  )
}
