import { createClient } from '@/lib/supabase/server'

const IST = 'Asia/Kolkata'

function toIST(utcString: string): { date: string; time: string } {
  const d = new Date(utcString)
  const date = d.toLocaleDateString('en-IN', { timeZone: IST, day: '2-digit', month: 'short', weekday: 'short' })
  const time = d.toLocaleTimeString('en-IN', { timeZone: IST, hour: '2-digit', minute: '2-digit', hour12: true })
  return { date, time }
}

const STAGE_LABEL: Record<string, string> = {
  'Group Stage':  'MD',
  'Round of 32':  'R32',
  'Round of 16':  'R16',
  'Quarter-Final':'QF',
  'Semi-Final':   'SF',
  '3rd Place':    '3rd',
  'Final':        'Final',
}

export default async function FixturesPage() {
  const supabase = createClient()

  const { data: matches } = await supabase
    .from('matches')
    .select('*, home:national_teams!home_team(name,flag_emoji,group_name), away:national_teams!away_team(name,flag_emoji,group_name)')
    .order('kickoff_time')

  // Group by stage label (e.g. "Group Stage — Matchday 1", "Round of 32")
  type MatchGroup = { label: string; sortKey: number; games: any[] }
  const groups: Record<string, MatchGroup> = {}

  for (const m of matches ?? []) {
    const key = `${m.matchday_number}-${m.stage}`
    if (!groups[key]) {
      const stagePrefix = m.stage === 'Group Stage' ? `Matchday ${m.matchday_number}` : m.stage
      groups[key] = { label: stagePrefix, sortKey: m.matchday_number, games: [] }
    }
    groups[key].games.push(m)
  }

  const sortedGroups = Object.values(groups).sort((a, b) => a.sortKey - b.sortKey)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fixtures <span className="text-sm font-normal text-gray-400 ml-1">All times in IST</span></h1>

      {sortedGroups.length === 0 && (
        <div className="card text-gray-400 text-center py-10">
          No fixtures yet — admin can import all WC2026 fixtures from the Admin panel.
        </div>
      )}

      {sortedGroups.map(({ label, games }) => (
        <div key={label} className="card">
          <h2 className="font-semibold mb-3 text-brand-400">{label}</h2>
          <div className="space-y-0">
            {games.map(m => {
              const home = (m as any).home
              const away = (m as any).away
              const { date, time } = toIST(m.kickoff_time)
              return (
                <div key={m.id} className="flex items-center gap-2 py-2.5 border-b border-gray-800/60 last:border-0">
                  {/* Home */}
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    <span className="text-sm font-medium text-gray-100 text-right hidden sm:block">
                      {home?.name ?? m.home_team}
                    </span>
                    <span className="text-sm font-medium text-gray-100 sm:hidden">{m.home_team}</span>
                    <span className="text-base">{home?.flag_emoji ?? '🏳️'}</span>
                  </div>

                  {/* Score / Time */}
                  <div className="w-28 text-center shrink-0">
                    {m.is_completed ? (
                      <span className="font-bold text-white tabular-nums">
                        {m.home_score ?? 0} – {m.away_score ?? 0}
                      </span>
                    ) : m.is_locked ? (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-semibold">LIVE</span>
                    ) : (
                      <div className="text-gray-400 text-xs leading-tight">
                        <div>{date}</div>
                        <div className="font-medium text-gray-300">{time}</div>
                      </div>
                    )}
                  </div>

                  {/* Away */}
                  <div className="flex items-center gap-1.5 flex-1 justify-start">
                    <span className="text-base">{away?.flag_emoji ?? '🏳️'}</span>
                    <span className="text-sm font-medium text-gray-100 hidden sm:block">
                      {away?.name ?? m.away_team}
                    </span>
                    <span className="text-sm font-medium text-gray-100 sm:hidden">{m.away_team}</span>
                  </div>

                  {/* Status / Group */}
                  <div className="w-16 text-right shrink-0">
                    {m.is_completed && <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded">FT</span>}
                    {!m.is_completed && !m.is_locked && (
                      <span className="text-xs text-gray-600">
                        {home?.group_name?.replace('Group ', 'Grp ') ?? ''}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
