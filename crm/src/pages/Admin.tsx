import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { Modal } from '../components/Modal'
import { formatDate } from '../lib/format'
import { profileName, type Profile } from '../types'

async function callApi(path: string, body: unknown) {
  const { data } = await supabase.auth.getSession()
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${data.session?.access_token ?? ''}` },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.error ?? 'The server function is not available. Locally, start the app with "npx netlify dev" instead of "npm run dev".')
  }
}

export function Admin() {
  const { profiles, profile: me, reloadProfiles } = useAuth()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [removing, setRemoving] = useState<Profile | null>(null)

  const invite = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      await callApi('/api/invite-user', { email, fullName: name, redirectTo: window.location.origin })
      setMsg({ ok: true, text: `Invitation sent to ${email}.` })
      setEmail('')
      setName('')
      await reloadProfiles()
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed' })
    }
    setBusy(false)
  }

  const remove = async () => {
    if (!removing) return
    setBusy(true)
    try {
      await callApi('/api/remove-user', { userId: removing.id })
      setMsg({ ok: true, text: `${profileName(removing)} was removed.` })
      await reloadProfiles()
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed' })
    }
    setRemoving(null)
    setBusy(false)
  }

  const setRole = async (p: Profile, role: 'admin' | 'member') => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', p.id)
    if (error) setMsg({ ok: false, text: error.message })
    await reloadProfiles()
  }

  return (
    <main className="page narrow">
      <h1 className="h-lg">Team</h1>

      <section className="card">
        <h2 className="h-md">Invite someone</h2>
        <form className="invite-form" onSubmit={invite}>
          <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} dir="auto" />
          <input type="email" placeholder="work@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn primary" disabled={busy}>Send invite</button>
        </form>
        {msg && <p className={msg.ok ? 'ok-msg' : 'error-msg'}>{msg.text}</p>}
      </section>

      <section className="card">
        <h2 className="h-md">Team members ({profiles.length})</h2>
        <div className="table-wrap">
          <table className="plain">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Added</th><th /></tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td dir="auto">{profileName(p)}</td>
                  <td dir="ltr">{p.email}</td>
                  <td>
                    <select value={p.role} disabled={p.id === me?.id} onChange={(e) => setRole(p, e.target.value as 'admin' | 'member')}>
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{formatDate(p.created_at)}</td>
                  <td>
                    {p.id !== me?.id && <button className="btn small danger-outline" onClick={() => setRemoving(p)}>Remove</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={removing !== null}
        title="Remove this person?"
        onClose={() => setRemoving(null)}
        footer={
          <>
            <button className="btn" onClick={() => setRemoving(null)}>Cancel</button>
            <button className="btn danger" onClick={remove} disabled={busy}>Yes, remove</button>
          </>
        }
      >
        <p>
          <strong dir="auto">{profileName(removing)}</strong> will lose access immediately. Their clients stay in the table (Owner becomes empty).
        </p>
      </Modal>
    </main>
  )
}
