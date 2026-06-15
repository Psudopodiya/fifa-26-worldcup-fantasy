import { createClient } from '@/lib/supabase/server'

export default async function PlayersPage() {
  const supabase = createClient()

  const { data: players } = await supabase
    .from('players')
    .select('*, team:teams(name), nt:national_teams(name,flag_emoji)')
    .order('name')

  const { data: statsByPlayer } = await supabase
    .from('player_match_stats')
    .select('player_id, base_fantasy_points')

  const totalPts: Record<string, number> = {}
  for (const s of statsByPlayer ?? []) {
    totalPts[s.player_id] = (totalPts[s.player_id] ?? 0) + (s.base_fantasy_points ?? 0)
  }

  const sold   = (players ?? []).filter(p => p.is_sold && !p.is_released)
  const pool   = (players ?? []).filter(p => !p.is_sold)
  const released = (players ?? []).filter(p => p.is_released)

  function PlayerTable({ list, title }: { list: typeof players; title: string }) {
    return (
      <div className="card">
        <h2 className="font-semibold mb-3">{title} ({list?.length ?? 0})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="py-2 pr-4 text-gray-400 font-medium">Player</th>
                <th className="py-2 pr-4 text-gray-400 font-medium">Pos</th>
                <th className="py-2 pr-4 text-gray-400 font-medium">Nation</th>
                <th className="py-2 pr-4 text-gray-400 font-medium">Team</th>
                <th className="py-2 text-right text-gray-400 font-medium">Pts</th>
              </tr>
            </thead>
            <tbody>
              {(list ?? [])
                .sort((a, b) => (totalPts[b.id] ?? 0) - (totalPts[a.id] ?? 0))
                .map(p => (
                <tr key={p.id} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/20">
                  <td className="py-2 pr-4 font-medium">{p.name}</td>
                  <td className="py-2 pr-4"><span className={`badge-${p.position}`}>{p.position}</span></td>
                  <td className="py-2 pr-4 text-gray-300">
                    {(p as any).nt?.flag_emoji} {p.national_team}
                  </td>
                  <td className="py-2 pr-4 text-gray-400 text-xs">
                    {(p as any).team?.name ?? <span className="text-gray-600 italic">Unsold</span>}
                    {p.is_released && <span className="ml-1 text-orange-400">(Released)</span>}
                  </td>
                  <td className="py-2 text-right font-bold text-brand-400">
                    {(totalPts[p.id] ?? 0).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Player Pool</h1>
      <PlayerTable list={sold}    title="Sold Players" />
      <PlayerTable list={pool}    title="Unsold Pool (available for MSA)" />
      {released.length > 0 && <PlayerTable list={released} title="Released (MSA)" />}
    </div>
  )
}
