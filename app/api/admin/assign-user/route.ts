import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { teamId, email } = await req.json()
  if (!teamId || !email) {
    return NextResponse.json({ error: 'teamId and email are required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Look up the user by email using the admin API
  const { data: users, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) {
    return NextResponse.json({ error: listErr.message }, { status: 500 })
  }

  const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) {
    return NextResponse.json({
      error: `No user found with email ${email}. Make sure they've been invited via Supabase Auth first.`
    }, { status: 404 })
  }

  // Assign
  const { error: updateErr } = await supabase
    .from('teams')
    .update({ user_id: user.id })
    .eq('id', teamId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ message: `✓ Team assigned to ${email}` })
}
