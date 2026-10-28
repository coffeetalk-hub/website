import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { profileName } from '../types'

export function TopBar() {
  const { profile, isAdmin, signOut } = useAuth()
  return (
    <header className="topbar">
      <div className="brand"><span className="logo" aria-hidden>▤</span> Team CRM</div>
      <nav>
        <NavLink to="/" end>Clients</NavLink>
        {isAdmin && <NavLink to="/admin">Team</NavLink>}
      </nav>
      <div className="spacer" />
      <span className="who" title={profile?.email}>{profileName(profile)}</span>
      <button className="btn small" onClick={signOut}>Sign out</button>
    </header>
  )
}
