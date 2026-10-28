import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { supabaseConfigured } from './lib/supabase'
import { TopBar } from './components/TopBar'
import { Login } from './pages/Login'
import { SetPassword } from './pages/SetPassword'
import { Clients } from './pages/Clients'
import { Admin } from './pages/Admin'

function Protected({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { session, profile, isAdmin, loading, needsPassword, signOut } = useAuth()
  if (loading) return <div className="center-msg">Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  if (needsPassword) return <SetPassword />
  if (!profile) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="h-md">No access</h1>
          <p>You are signed in, but this account isn’t part of the team. Ask an admin to invite you.</p>
          <button className="btn" onClick={signOut}>Sign out</button>
        </div>
      </div>
    )
  }
  if (admin && !isAdmin) return <Navigate to="/" replace />
  return (
    <div className="app-shell">
      <TopBar />
      {children}
    </div>
  )
}

function Routing() {
  const { session, loading, needsPassword } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={!loading && session && !needsPassword ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<Protected><Clients /></Protected>} />
      <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  if (!supabaseConfigured) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="h-md">Setup needed</h1>
          <p>
            Missing <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>. Copy <code>.env.example</code> to <code>.env</code>,
            fill them in, then restart <code>npm run dev</code>.
          </p>
        </div>
      </div>
    )
  }
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routing />
      </AuthProvider>
    </BrowserRouter>
  )
}
