import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user's team
  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!team) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>Your account hasn't been linked to a team yet.</p>
        <p className="text-sm mt-2">Ask the admin to assign your team.</p>
      </div>
    )
  }

  // Current matchday from settings
  const { data: settings } = await supabase
    .from('app_settings')
    .select('key, value')

  const settingsMap = Object.fromEntries((settings ?? []).map(s => [s.key, s.value]))
  const currentMatchday = parseInt(settingsMap.current_matchday ?? '1')
  const currentPhase    = settingsMap.current_phase ?? 'PHASE_01'
  const leagueName      = settingsMap.league_name ?? 'FIFA 2026 Fantasy'

  // Total points
  const { data: allPoints } = await supabase
    .from('team_matchday_points')
    .select('net_points, matchday_number')
    .eq('team_id', team.id)
    .order('matchday_number')

  const totalPoints = (allPoints ?? []).reduce((sum, r) => sum + (r.net_points ?? 0), 0)

  // Leaderboard rank
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

  // My players
  const { data: players } = await supabase
    .from('players')
    .select('*, national_team_data:national_teams(code,name,flag_emoji)')
    .eq('team_id', team.id)
    .order('position')

  // This matchday captain assignment
  const { data: captainData } = await supabase
    .from('captain_assignments')
    .select('*, captain:players!captain_player_id(name,position), vc:players!vice_captain_player_id(name,position)')
    .eq('team_id', team.id)
    .eq('matchday_number', currentMatchday)
    .single()

  // Phase info
  const { data: phase } = await supabase
    .from('tournament_phases')
    .select('*')
    .eq('phase_id', currentPhase)
    .single()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <p className="text-gray-400 text-sm">{leagueName} · {phase?.name ?? currentPhase}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-brand-400">{totalPoints.toFixed(1)}</div>
          <div className="text-gray-400 text-sm">Total pts · Rank #{rank}</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card text-center">
          <div className="text-2xl font-bold">{totalPoints.toFixed(1)}</div>
          <div className="text-gray-400 text-xs mt-1">Total Points</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold">#{rank}</div>
          <div className="text-gray-400 text-xs mt-1">League Rank</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold">{team.budget_remaining}</div>
          <div className="text-gray-400 text-xs mt-1">Budget Left</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold">MD{currentMatchday}</div>
          <div className="text-gray-400 text-xs mt-1">Matchday</div>
        </div>
      </div>

      {/* Captain / VC */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Captaincy — MD{currentMatchday}</h2>
          <Link href="/squad" className="text-brand-400 text-sm hover:text-brand-300">Change →</Link>
        </div>
        {captainData ? (
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 font-bold text-lg">©</span>
              <span className="font-medium">{captainData.captain?.name ?? '—'}</span>
              <span className={`badge-${captainData.captain?.position}`}>{captainData.captain?.position}</span>
              <span className="text-xs text-gray-500">(2×)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-bold text-lg">vc</span>
              <span className="font-medium">{captainData.vc?.name ?? '—'}</span>
              <span className="text-xs text-gray-500">(1.5×)</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">
            No captain set for MD{currentMatchday}.{' '}
            <Link href="/squad" className="text-brand-400">Set now →</Link>
          </p>
        )}
        {phase && (
          <p className="text-gray-500 text-xs mt-2">
            {phase.captain_twists_per_matchday != null
              ? `${phase.captain_twists_per_matchday} captain twist${phase.captain_twists_per_matchday !== 1 ? 's' : ''} allowed this matchday`
              : 'Unlimited captain twists this phase'
            }
          </p>
        )}
      </div>

      {/* My Squad */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">My Squad ({players?.length ?? 0} players)</h2>
          <Link href="/squad" className="text-brand-400 text-sm hover:text-brand-300">Manage →</Link>
        </div>
        <div className="space-y-1">
          {(['GK','DEF','MID','FWD'] as const).map(pos => {
            const group = (players ?? []).filter(p => p.position === pos)
            if (!group.length) return null
            return (
              <div key={pos}>
                <div className="text-xs text-gray-500 uppercase tracking-wider mt-2 mb-1">{pos}</div>
                {group.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`badge-${p.position}`}>{p.position}</span>
                      <span className="font-medium text-sm">{p.name}</span>
                      <span className="text-gray-500 text-xs">
                        {p.national_team_data?.flag_emoji} {p.national_team}
                      </span>
                    </div>
                    <span className="text-gray-400 text-xs">£{p.auction_price}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Link href="/leaderboard" className="card hover:border-gray-600 transition-colors text-center py-6">
          <div className="text-2xl mb-1">🏅</div>
          <div className="font-medium text-sm">Leaderboard</div>
        </Link>
        <Link href="/fixtures" className="card hover:border-gray-600 transition-colors text-center py-6">
          <div className="text-2xl mb-1">📅</div>
          <div className="font-medium text-sm">Fixtures</div>
        </Link>
        <Link href="/transfers" className="card hover:border-gray-600 transition-colors text-center py-6">
          <div className="text-2xl mb-1">🔄</div>
          <div className="font-medium text-sm">Transfers</div>
        </Link>
      </div>
    </div>
  )
}
