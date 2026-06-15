import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { teamId, email } = await req.json()
  if (!teamId || !email) {
    return NextResponse.json({ error: 'teamId and email are required' }, { status: 400 })
  }

  // Look up user in Clerk by email
  const client = await clerkClient()
  const { data: users } = await client.users.getUserList({ emailAddress: [email] })

  if (!users || users.length === 0) {
    return NextResponse.json({
      error: `No Clerk user found with email ${email}. Make sure they have been invited via the Clerk dashboard first.`
    }, { status: 404 })
  }

  const clerkUser = users[0]

  // Assign the Clerk user ID (string like "user_2abc...") to the team
  const supabase = createAdminClient()
  const { error: updateErr } = await supabase
    .from('teams')
    .update({ user_id: clerkUser.id })
    .eq('id', teamId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({
    message: `✓ Team ${teamId} assigned to ${email} (Clerk ID: ${clerkUser.id})`
  })
}
