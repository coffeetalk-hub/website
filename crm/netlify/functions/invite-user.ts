import { json, requireAdmin } from '../lib/auth'

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  try {
    const ctx = await requireAdmin(req)
    if (!ctx) return json({ error: 'Admins only' }, 403)

    const body = await req.json().catch(() => null)
    const email = String(body?.email ?? '').trim().toLowerCase()
    const fullName = String(body?.fullName ?? '').trim()
    const redirectTo = typeof body?.redirectTo === 'string' ? body.redirectTo : undefined
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Enter a valid email address' }, 400)

    const { error } = await ctx.admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: fullName ? { full_name: fullName } : undefined,
    })
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Server error' }, 500)
  }
}

export const config = { path: '/api/invite-user' }
