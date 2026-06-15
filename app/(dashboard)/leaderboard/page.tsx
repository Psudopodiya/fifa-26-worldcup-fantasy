import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LeaderboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const supabase = createClient()

  const { data: settings } = await supabase.from('app_settings').select('key, value')
  const settingsMap = Object.fromEntries((settings ?? []).map(s => [s.key, s.value]))
  const currentMatchday = parseInt(settingsMap.current_matchday ?? '1')

  const { data: myTeam }   = await supabase.from('teams').select('id').eq('user_id', userId).single()

  // All teams
  const { data: teams } = await supabase.from('teams').select('id, name, budget_remaining')

  // All matchday points
  const { data: allPoints } = await supabase
    .from('team_matchday_points')
    .select('team_id, matchday_number, net_points')
    .order('matchday_number')

  // Aggregate
  type TeamRow = { id: string; name: string; total: number; byMatchday: Record<number, number> }
  const teamMap: Record<string, TeamRow> = {}
  for (const t of teams ?? []) {
    teamMap[t.id] = { id: t.id, name: t.name, total: 0, byMatchday: {} }
  }
  for (const row of allPoints ?? []) {
    if (!teamMap[row.team_id]) continue
    teamMap[row.team_id].total += row.net_points ?? 0
    teamMap[row.team_id].byMatchday[row.matchday_number] = row.net_points ?? 0
  }

  const ranked = Object.values(teamMap).sort((a, b) => b.total - a.total)
  const matchdays = Array.from({ length: currentMatchday }, (_, i) => i + 1)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Leaderboard</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-2 px-3 text-gray-400 font-medium w-8">#</th>
              <th className="text-left py-2 px-3 text-gray-400 font-medium">Team</th>
              {matchdays.map(md => (
                <th key={md} className="text-right py-2 px-3 text-gray-400 font-medium">
                  MD{md}
                </th>
              ))}
              <th className="text-right py-2 px-3 text-gray-400 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((team, i) => {
              const isMe = team.id === myTeam?.id
              return (
                <tr
                  key={team.id}
                  className={`border-b border-gray-800/50 last:border-0 ${
                    isMe ? 'bg-brand-500/5' : 'hover:bg-gray-800/30'
                  }`}
                >
                  <td className="py-3 px-3">
                    <span className={`font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium">
                    {team.name}
                    {isMe && <span className="ml-2 text-xs text-brand-400">(you)</span>}
                  </td>
                  {matchdays.map(md => (
                    <td key={md} className="py-3 px-3 text-right text-gray-300">
                      {team.byMatchday[md] != null ? team.byMatchday[md].toFixed(1) : '—'}
                    </td>
                  ))}
                  <td className="py-3 px-3 text-right font-bold text-brand-400">
                    {team.total.toFixed(1)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
