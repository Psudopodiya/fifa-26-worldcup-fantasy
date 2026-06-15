import { createClient } from '@/lib/supabase/server'

const POS_ORDER = ['GK', 'DEF', 'MID', 'FWD']

export default async function TeamsPage() {
  const supabase = createClient()

  // All teams + their players
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, budget_remaining')
    .order('name')

  const { data: allPlayers } = await supabase
    .from('players')
    .select('*, nt:national_teams(flag_emoji,name)')
    .not('team_id', 'is', null)
    .order('position')

  // All matchday points per team
  const { data: allPoints } = await supabase
    .from('team_matchday_points')
    .select('team_id, net_points')

  const teamTotals: Record<string, number> = {}
  for (const row of allPoints ?? []) {
    teamTotals[row.team_id] = (teamTotals[row.team_id] ?? 0) + (row.net_points ?? 0)
  }

  const playersByTeam: Record<string, typeof allPlayers> = {}
  for (const p of allPlayers ?? []) {
    if (!playersByTeam[p.team_id!]) playersByTeam[p.team_id!] = []
    playersByTeam[p.team_id!]!.push(p)
  }

  // Sort teams by total points descending
  const ranked = (teams ?? [])
    .map(t => ({ ...t, total: teamTotals[t.id] ?? 0 }))
    .sort((a, b) => b.total - a.total)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">All Teams</h1>

      <div className="grid md:grid-cols-2 gap-5">
        {ranked.map((team, rank) => {
          const players = (playersByTeam[team.id] ?? [])
            .slice()
            .sort((a, b) => POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position))

          const byPos: Record<string, typeof players> = { GK: [], DEF: [], MID: [], FWD: [] }
          for (const p of players) {
            if (byPos[p.position]) byPos[p.position].push(p)
          }

          return (
            <div key={team.id} className="card space-y-3">
              {/* Team header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      rank === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      rank === 1 ? 'bg-gray-400/20 text-gray-300' :
                      rank === 2 ? 'bg-amber-700/20 text-amber-600' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {rank + 1}
                    </span>
                    <h2 className="font-semibold text-lg">{team.name}</h2>
                  </div>
                  <p className="text-xs text-gray-500 ml-8">Budget left: £{team.budget_remaining}M</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-brand-400">{team.total.toFixed(1)}</div>
                  <div className="text-xs text-gray-400">pts</div>
                </div>
              </div>

              {/* Players by position */}
              {POS_ORDER.map(pos => {
                const grp = byPos[pos]
                if (!grp?.length) return null
                return (
                  <div key={pos}>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{pos} ({grp.length})</div>
                    <div className="space-y-1">
                      {grp.map(p => (
                        <div key={p.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{(p as any).nt?.flag_emoji}</span>
                            <span className="font-medium text-gray-100">{p.name}</span>
                          </div>
                          <span className="text-gray-500 text-xs">£{p.auction_price}M</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {players.length === 0 && (
                <p className="text-gray-600 text-sm text-center py-2">No players yet</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
