import { createClient } from '@supabase/supabase-js'

export function adminClient() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Server is missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

/** Returns the service-role client and caller id only if the request comes from a logged-in admin. */
export async function requireAdmin(req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const admin = adminClient()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) return null
  const { data: profile } = await admin.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
  if (profile?.role !== 'admin') return null
  return { admin, userId: data.user.id }
}
