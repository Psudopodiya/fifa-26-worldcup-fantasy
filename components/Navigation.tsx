'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { clsx } from 'clsx'

const NAV = [
  { href: '/',             label: 'Dashboard',    icon: '🏠' },
  { href: '/leaderboard',  label: 'Leaderboard',  icon: '🏅' },
  { href: '/squad',        label: 'My Squad',     icon: '👥' },
  { href: '/transfers',    label: 'Transfers',    icon: '🔄' },
  { href: '/teams',        label: 'All Teams',    icon: '⚽' },
  { href: '/players',      label: 'Player Pool',  icon: '📋' },
  { href: '/fixtures',     label: 'Fixtures',     icon: '📅' },
  { href: '/msa',          label: 'Auction (MSA)', icon: '🔨' },
]

export default function Navigation({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-14 gap-1 overflow-x-auto scrollbar-hide">
          <Link href="/" className="flex items-center gap-2 mr-4 shrink-0">
            <span className="text-xl">🏆</span>
            <span className="font-bold text-brand-400 hidden sm:block text-sm">WC2026</span>
          </Link>
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0',
                pathname === item.href
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              )}
            >
              <span>{item.icon}</span>
              <span className="hidden md:block">{item.label}</span>
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0',
                pathname.startsWith('/admin')
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              )}
            >
              <span>⚙️</span>
              <span className="hidden md:block">Admin</span>
            </Link>
          )}
          <button
            onClick={signOut}
            className="ml-auto text-sm text-gray-500 hover:text-gray-300 shrink-0"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
