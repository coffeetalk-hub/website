import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

// Invite / password-reset emails open the app with a token in the URL. Capture it before Supabase clears it.
const bootHash = window.location.hash
const bootNeedsPassword = /type=(invite|recovery)/.test(bootHash)
const bootLinkError = /error_description=([^&]+)/.exec(bootHash)?.[1]?.replace(/\+/g, ' ')

interface AuthState {
  session: Session | null
  profile: Profile | null
  profiles: Profile[]
  isAdmin: boolean
  loading: boolean
  needsPassword: boolean
  linkError: string | null
  finishPassword: () => void
  reloadProfiles: () => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [profileReady, setProfileReady] = useState(false)
  const [needsPassword, setNeedsPassword] = useState(bootNeedsPassword)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionReady(true)
    })
    // Keep this callback free of Supabase calls (they can deadlock inside it).
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setNeedsPassword(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const reloadProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('full_name', { ascending: true })
    setProfiles((data as Profile[]) ?? [])
  }, [])

  const uid = session?.user.id
  useEffect(() => {
    if (!sessionReady) return
    if (!uid) {
      setProfile(null)
      setProfiles([])
      setProfileReady(true)
      return
    }
    setProfileReady(false)
    let cancelled = false
    supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return
        const list = (data as Profile[]) ?? []
        setProfiles(list)
        setProfile(list.find((p) => p.id === uid) ?? null)
        setProfileReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [uid, sessionReady])

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      profiles,
      isAdmin: profile?.role === 'admin',
      loading: !sessionReady || !profileReady,
      needsPassword,
      linkError: bootLinkError ? decodeURIComponent(bootLinkError) : null,
      finishPassword: () => {
        setNeedsPassword(false)
        history.replaceState(null, '', window.location.pathname)
      },
      reloadProfiles,
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }),
    [session, profile, profiles, sessionReady, profileReady, needsPassword, reloadProfiles],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth outside AuthProvider')
  return v
}
