import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/Navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const supabase = createClient()
  const { data: team } = await supabase
    .from('teams')
    .select('is_admin')
    .eq('user_id', userId)
    .single()

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation isAdmin={team?.is_admin ?? false} />
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
