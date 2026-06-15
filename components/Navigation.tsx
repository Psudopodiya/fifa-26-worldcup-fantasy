'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Trophy, Shield, ArrowLeftRight,
  Users, BarChart3, Calendar, Gavel, LogOut, Settings, Globe2,
} from 'lucide-react'

const NAV = [
  { href: '/',            label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/squad',       label: 'My Squad',    icon: Shield },
  { href: '/transfers',   label: 'Transfers',   icon: ArrowLeftRight },
  { href: '/teams',       label: 'All Teams',   icon: Users },
  { href: '/players',     label: 'Player Pool', icon: BarChart3 },
  { href: '/fixtures',    label: 'Fixtures',    icon: Calendar },
  { href: '/msa',         label: 'Auction',     icon: Gavel },
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
    <nav className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-14 gap-1">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 mr-3 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Globe2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm hidden sm:block tracking-tight">
              <span className="text-white">WC</span>
              <span className="text-brand-400"> 2026</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-0.5 overflow-x-auto flex-1 min-w-0">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 shrink-0',
                    active
                      ? 'bg-brand-500/15 text-brand-400 ring-1 ring-inset ring-brand-500/25'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden md:block">{label}</span>
                </Link>
              )
            })}

            {isAdmin && (
              <Link
                href="/admin"
                className={clsx(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 shrink-0',
                  pathname.startsWith('/admin')
                    ? 'bg-purple-500/15 text-purple-400 ring-1 ring-inset ring-purple-500/25'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                )}
              >
                <Settings className="w-4 h-4 shrink-0" />
                <span className="hidden md:block">Admin</span>
              </Link>
            )}
          </div>

          {/* Sign out */}
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 shrink-0 ml-1"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:block">Sign out</span>
          </button>

        </div>
      </div>
    </nav>
  )
}
