import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { clsx } from 'clsx'
import {
  Star, Trophy, Wallet, Calendar,
  Crown, ChevronRight, Medal, ArrowLeftRight,
} from 'lucide-react'

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'] as const

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const supabase = createClient()
  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!team) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>Your account hasn&apos;t been linked to a team yet.</p>
        <p className="text-sm mt-2">Ask the admin to assign your team.</p>
      </div>
    )
  }

  const { data: settings } = await supabase.from('app_settings').select('key, value')
  const settingsMap      = Object.fromEntries((settings ?? []).map(s => [s.key, s.value]))
  const currentMatchday  = parseInt(settingsMap.current_matchday ?? '1')
  const currentPhase     = settingsMap.current_phase ?? 'PHASE_01'
  const leagueName       = settingsMap.league_name ?? 'FIFA 2026 Fantasy'

  const { data: allPoints } = await supabase
    .from('team_matchday_points')
    .select('net_points, matchday_number')
    .eq('team_id', team.id)
    .order('matchday_number')

  const totalPoints = (allPoints ?? []).reduce((sum, r) => sum + (r.net_points ?? 0), 0)

  const { data: leaderboard } = await supabase
    .from('team_matchday_points')
    .select('team_id, net_points')

  const teamTotals: Record<string, number> = {}
  for (const row of leaderboard ?? []) {
    teamTotals[row.team_id] = (teamTotals[row.team_id] ?? 0) + (row.net_points ?? 0)
  }
  const rank = Object.values(teamTotals)
    .sort((a, b) => b - a)
    .findIndex(pts => pts <= totalPoints) + 1

  const { data: players } = await supabase
    .from('players')
    .select('*, national_team_data:national_teams(code,name,flag_emoji)')
    .eq('team_id', team.id)
    .order('position')

  const { data: captainData } = await supabase
    .from('captain_assignments')
    .select('*, captain:players!captain_player_id(name,position), vc:players!vice_captain_player_id(name,position)')
    .eq('team_id', team.id)
    .eq('matchday_number', currentMatchday)
    .single()

  const { data: phase } = await supabase
    .from('tournament_phases')
    .select('*')
    .eq('phase_id', currentPhase)
    .single()

  const STATS = [
    { icon: Star,          label: 'Total Points', value: totalPoints.toFixed(1), color: 'text-brand-400', ring: 'bg-brand-500/10' },
    { icon: Trophy,        label: 'League Rank',  value: `#${rank}`,             color: 'text-yellow-400', ring: 'bg-yellow-500/10' },
    { icon: Wallet,        label: 'Budget Left',  value: `£${team.budget_remaining}`, color: 'text-green-400', ring: 'bg-green-500/10' },
    { icon: Calendar,      label: 'Matchday',     value: `MD${currentMatchday}`, color: 'text-blue-400',  ring: 'bg-blue-500/10'  },
  ]

  const QUICK_LINKS = [
    { href: '/leaderboard', icon: Medal,          label: 'Leaderboard', accent: 'text-yellow-400', hover: 'hover:bg-yellow-500/10 hover:border-yellow-500/20' },
    { href: '/fixtures',    icon: Calendar,       label: 'Fixtures',    accent: 'text-blue-400',   hover: 'hover:bg-blue-500/10 hover:border-blue-500/20'   },
    { href: '/transfers',   icon: ArrowLeftRight, label: 'Transfers',   accent: 'text-green-400',  hover: 'hover:bg-green-500/10 hover:border-green-500/20'  },
  ]

  return (
    <div className="space-y-5">

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{leagueName}</p>
            <h1 className="text-xl font-bold text-white mt-1 truncate">{team.name}</h1>
            <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full">
              {phase?.name ?? currentPhase}
            </span>
          </div>
          <div className="text-right shrink-0">
            <div className="text-4xl font-bold gradient-text">{totalPoints.toFixed(1)}</div>
            <div className="text-xs text-gray-500 mt-1">
              pts · Rank <span className="text-white font-semibold">#{rank}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATS.map(({ icon: Icon, label, value, color, ring }) => (
          <div key={label} className="card flex flex-col items-center text-center py-5">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', ring)}>
              <Icon className={clsx('w-5 h-5', color)} />
            </div>
            <div className={clsx('text-2xl font-bold', color)}>{value}</div>
            <div className="text-gray-500 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Captain / VC */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            <h2 className="font-semibold text-sm">Captaincy — MD{currentMatchday}</h2>
          </div>
          <Link href="/squad" className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-0.5 transition-colors">
            Change <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {captainData ? (
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
              <span className="text-yellow-400 font-bold text-xs bg-yellow-500/20 rounded px-1 py-0.5">C</span>
              <span className="font-medium text-sm">{captainData.captain?.name ?? '—'}</span>
              <span className={`badge-${captainData.captain?.position}`}>{captainData.captain?.position}</span>
              <span className="text-xs text-gray-500">2×</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
              <span className="text-blue-400 font-bold text-xs bg-blue-500/20 rounded px-1 py-0.5">VC</span>
              <span className="font-medium text-sm">{captainData.vc?.name ?? '—'}</span>
              <span className="text-xs text-gray-500">1.5×</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">
            No captain set for MD{currentMatchday}.{' '}
            <Link href="/squad" className="text-brand-400 hover:text-brand-300">Set now →</Link>
          </p>
        )}

        {phase && (
          <p className="text-gray-600 text-xs mt-3">
            {phase.captain_twists_per_matchday != null
              ? `${phase.captain_twists_per_matchday} captain twist${phase.captain_twists_per_matchday !== 1 ? 's' : ''} allowed this matchday`
              : 'Unlimited captain twists this phase'}
          </p>
        )}
      </div>

      {/* My Squad */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">
            My Squad{' '}
            <span className="text-gray-500 font-normal">({players?.length ?? 0} players)</span>
          </h2>
          <Link href="/squad" className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-0.5 transition-colors">
            Manage <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-3">
          {POSITIONS.map(pos => {
            const group = (players ?? []).filter(p => p.position === pos)
            if (!group.length) return null
            return (
              <div key={pos}>
                <div className="mb-1.5">
                  <span className={`badge-${pos}`}>{pos}</span>
                </div>
                <div className="space-y-0.5">
                  {group.map(p => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-800/60 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-sm truncate">{p.name}</span>
                        <span className="text-gray-500 text-xs shrink-0">
                          {p.national_team_data?.flag_emoji} {p.national_team}
                        </span>
                      </div>
                      <span className="text-gray-500 text-xs font-mono shrink-0 ml-2">£{p.auction_price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {QUICK_LINKS.map(({ href, icon: Icon, label, accent, hover }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'card text-center py-6 border-gray-800 transition-all duration-200 group',
              hover
            )}
          >
            <Icon className={clsx('w-6 h-6 mx-auto mb-2 transition-transform duration-200 group-hover:scale-110', accent)} />
            <div className="font-medium text-sm">{label}</div>
          </Link>
        ))}
      </div>

    </div>
  )
}
