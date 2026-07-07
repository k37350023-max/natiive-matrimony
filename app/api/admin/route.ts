import { NextResponse } from 'next/server'
import { supabaseAdmin, assertAdminConfigured } from '@/lib/supabaseAdmin'

/* Admin actions, gated by a SERVER-only secret (never shipped to the browser).
   Replaces the old client-side password + anon-key writes, which anyone could
   bypass. Set ADMIN_SECRET in the host env. */
export async function POST(req: Request) {
  try {
    assertAdminConfigured()
    const { secret, action, id, status, text } = await req.json()

    const expected = process.env.ADMIN_SECRET
    if (!expected || secret !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (action === 'list') {
      let q = supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false })
      if (status) q = q.eq('status', status)
      const { data, error } = await q
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ profiles: data ?? [] })
    }

    if (action === 'listReports') {
      const { data, error } = await supabaseAdmin.from('reports').select('reported, reason')
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ reports: data ?? [] })
    }

    if (action === 'updateStatus' && id && (status === 'approved' || status === 'rejected')) {
      const { error } = await supabaseAdmin.from('profiles')
        .update({ status, verified: status === 'approved' }).eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      return NextResponse.json({ ok: true })
    }

    if (action === 'delete' && id) {
      await supabaseAdmin.from('profiles').delete().eq('id', id)
      return NextResponse.json({ ok: true })
    }

    if (action === 'announce' && typeof text === 'string' && text.trim()) {
      const { data: users } = await supabaseAdmin.from('profiles').select('user_id').not('user_id', 'is', null)
      const rows = (users || []).map(u => ({
        user_id: u.user_id, type: 'announcement', message: text.trim(), link: '/', read: false,
      }))
      if (rows.length) await supabaseAdmin.from('notifications').insert(rows)
      return NextResponse.json({ ok: true, sent: rows.length })
    }

    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
