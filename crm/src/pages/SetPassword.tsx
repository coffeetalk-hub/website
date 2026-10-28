import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'

export function SetPassword() {
  const { finishPassword } = useAuth()
  const navigate = useNavigate()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (pw.length < 8) return setError('Use at least 8 characters.')
    if (pw !== pw2) return setError('The two passwords do not match.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    if (error) return setError(error.message)
    finishPassword()
    navigate('/', { replace: true })
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand big"><span className="logo" aria-hidden>▤</span> Team CRM</div>
        <h1 className="h-md">Choose your password</h1>
        <label>New password
          <input type="password" autoComplete="new-password" required autoFocus value={pw} onChange={(e) => setPw(e.target.value)} />
        </label>
        <label>Repeat password
          <input type="password" autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </label>
        {error && <p className="error-msg">{error}</p>}
        <button className="btn primary block" disabled={busy}>{busy ? 'Saving…' : 'Save and continue'}</button>
      </form>
    </div>
  )
}
