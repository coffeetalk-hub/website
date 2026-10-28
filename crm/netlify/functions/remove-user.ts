import { json, requireAdmin } from '../lib/auth'

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  try {
    const ctx = await requireAdmin(req)
    if (!ctx) return json({ error: 'Admins only' }, 403)

    const body = await req.json().catch(() => null)
    const userId = String(body?.userId ?? '')
    if (!userId) return json({ error: 'Missing userId' }, 400)
    if (userId === ctx.userId) return json({ error: "You can't remove yourself" }, 400)

    // Deleting the login also deletes the profile (cascade). Their clients stay; Owner becomes empty.
    const { error } = await ctx.admin.auth.admin.deleteUser(userId)
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Server error' }, 500)
  }
}

export const config = { path: '/api/remove-user' }
