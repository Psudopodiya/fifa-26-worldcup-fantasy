'use client'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import type { Player, CaptainAssignment, SquadSelection, TournamentPhase } from '@/lib/types'
import { clsx } from 'clsx'

type PlayerWithSelection = Player & { is_starting: boolean; bench_order: number | null }

export default function SquadPage() {
  const { userId } = useAuth()
  const supabase = createClient()
  const [team, setTeam]           = useState<any>(null)
  const [players, setPlayers]     = useState<PlayerWithSelection[]>([])
  const [captain, setCaptain]     = useState<CaptainAssignment | null>(null)
  const [phase, setPhase]         = useState<TournamentPhase | null>(null)
  const [matchday, setMatchday]   = useState(1)
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState('')
  const [loading, setLoading]     = useState(true)

  const load = useCallback(async () => {
    if (!userId) return

    const { data: t } = await supabase.from('teams').select('*').eq('user_id', userId).single()
    setTeam(t)

    const { data: settings } = await supabase.from('app_settings').select('key,value')
    const sm = Object.fromEntries((settings ?? []).map((s: any) => [s.key, s.value]))
    const md = parseInt(sm.current_matchday ?? '1')
    setMatchday(md)

    const { data: ph } = await supabase
      .from('tournament_phases').select('*').eq('phase_id', sm.current_phase).single()
    setPhase(ph)

    const { data: allPlayers } = await supabase
      .from('players')
      .select('*, national_team_data:national_teams(flag_emoji,name)')
      .eq('team_id', t.id)

    const { data: selections } = await supabase
      .from('squad_selections')
      .select('player_id, is_starting, bench_order')
      .eq('team_id', t.id)
      .eq('matchday_number', md)

    const selMap: Record<string, { is_starting: boolean; bench_order: number | null }> = {}
    for (const s of selections ?? []) selMap[s.player_id] = { is_starting: s.is_starting, bench_order: s.bench_order }

    const withSel: PlayerWithSelection[] = (allPlayers ?? []).map(p => ({
      ...p,
      is_starting: selMap[p.id]?.is_starting ?? true,
      bench_order: selMap[p.id]?.bench_order ?? null,
    }))
    setPlayers(withSel)

    const { data: cap } = await supabase
      .from('captain_assignments')
      .select('*')
      .eq('team_id', t.id)
      .eq('matchday_number', md)
      .single()
    setCaptain(cap)

    setLoading(false)
  }, [supabase, userId])

  useEffect(() => { load() }, [load])

  async function saveSquad() {
    setSaving(true); setMsg('')
    const starting = players.filter(p => p.is_starting)
    const bench    = players.filter(p => !p.is_starting)
    if (starting.length !== 11) { setMsg('You must have exactly 11 starters.'); setSaving(false); return }
    if (bench.length > 5)       { setMsg('Max 5 bench players.'); setSaving(false); return }

    const rows = [
      ...starting.map(p => ({ team_id: team.id, player_id: p.id, matchday_number: matchday, is_starting: true,  bench_order: null })),
      ...bench.map((p, i) => ({ team_id: team.id, player_id: p.id, matchday_number: matchday, is_starting: false, bench_order: i + 1 })),
    ]
    await supabase.from('squad_selections').upsert(rows, { onConflict: 'team_id,player_id,matchday_number' })
    setMsg('Squad saved!')
    setSaving(false)
  }

  async function setCaptainPlayer(playerId: string, type: 'captain' | 'vc') {
    if (!team || !captain) return

    // Validate captain twists limit (group stage = 2 twists = 3 unique captains)
    const isGroupStage = phase?.phase_id === 'PHASE_01'
    if (isGroupStage && phase?.captain_twists_per_matchday != null) {
      const twistsUsed = (captain.unique_captains_count ?? 1) - 1
      if (twistsUsed >= phase.captain_twists_per_matchday) {
        setMsg(`Captain twist limit reached (${phase.captain_twists_per_matchday} max this matchday).`)
        return
      }
    }

    const update: any = { updated_at: new Date().toISOString() }
    if (type === 'captain') {
      update.captain_player_id    = playerId
      update.unique_captains_count = (captain.unique_captains_count ?? 1) + 1
    } else {
      update.vice_captain_player_id = playerId
    }
    update.manual_action_taken = true
    update.auto_sub_eligible   = false

    const { error } = await supabase
      .from('captain_assignments')
      .upsert({ team_id: team.id, matchday_number: matchday, ...update },
               { onConflict: 'team_id,matchday_number' })

    if (error) { setMsg(error.message); return }

    // Log captain change
    if (type === 'captain') {
      await supabase.from('captain_change_log').insert({
        team_id:         team.id,
        matchday_number: matchday,
        change_type:     'captain',
        from_player_id:  captain.captain_player_id,
        to_player_id:    playerId,
      })
    }

    setCaptain(prev => prev ? { ...prev, ...update } : null)
    setMsg(`${type === 'captain' ? 'Captain' : 'Vice-captain'} updated!`)
  }

  function toggleStarting(pid: string) {
    setPlayers(prev => prev.map(p =>
      p.id === pid ? { ...p, is_starting: !p.is_starting } : p
    ))
  }

  if (loading) return <div className="text-gray-400 text-center py-20">Loading squad…</div>

  const starting = players.filter(p => p.is_starting)
  const bench    = players.filter(p => !p.is_starting)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Squad — MD{matchday}</h1>
          <p className="text-gray-400 text-sm">
            {phase?.name} · {starting.length}/11 starters · {bench.length}/5 bench
          </p>
        </div>
        <button onClick={saveSquad} disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save Squad'}
        </button>
      </div>

      {msg && (
        <div className={clsx('px-4 py-2 rounded-lg text-sm', msg.includes('!') ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300')}>
          {msg}
        </div>
      )}

      {/* Captain info */}
      {phase && (
        <div className="card text-sm text-gray-400">
          {phase.captain_twists_per_matchday != null
            ? `Group Stage: ${phase.captain_twists_per_matchday} captain twists allowed · ${captain?.unique_captains_count ?? 1} unique captain(s) used this matchday`
            : 'Knockout Stage: unlimited captain changes'
          }
        </div>
      )}

      {/* Starting XI */}
      <div className="card">
        <h2 className="font-semibold mb-3">Starting XI ({starting.length})</h2>
        {(['GK','DEF','MID','FWD'] as const).map(pos => {
          const group = starting.filter(p => p.position === pos)
          return group.length > 0 ? (
            <div key={pos} className="mb-3">
              <div className="text-xs text-gray-500 uppercase mb-1">{pos}</div>
              {group.map(p => (
                <PlayerRow
                  key={p.id} player={p}
                  isCaptain={captain?.captain_player_id === p.id}
                  isVC={captain?.vice_captain_player_id === p.id}
                  onToggle={() => toggleStarting(p.id)}
                  onSetCaptain={() => setCaptainPlayer(p.id, 'captain')}
                  onSetVC={() => setCaptainPlayer(p.id, 'vc')}
                  actionLabel="→ Bench"
                />
              ))}
            </div>
          ) : null
        })}
      </div>

      {/* Bench */}
      <div className="card">
        <h2 className="font-semibold mb-3">Bench ({bench.length})</h2>
        {bench.length === 0 && <p className="text-gray-500 text-sm">No bench players — click → Bench on any starter.</p>}
        {bench.map(p => (
          <PlayerRow
            key={p.id} player={p}
            isCaptain={false} isVC={false}
            onToggle={() => toggleStarting(p.id)}
            onSetCaptain={() => {}}
            onSetVC={() => {}}
            actionLabel="→ Start"
          />
        ))}
      </div>
    </div>
  )
}

function PlayerRow({ player, isCaptain, isVC, onToggle, onSetCaptain, onSetVC, actionLabel }: {
  player: PlayerWithSelection
  isCaptain: boolean; isVC: boolean
  onToggle: () => void
  onSetCaptain: () => void; onSetVC: () => void
  actionLabel: string
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className={`badge-${player.position}`}>{player.position}</span>
        <span className="font-medium text-sm truncate">{player.name}</span>
        <span className="text-gray-500 text-xs">{(player as any).national_team_data?.flag_emoji} {player.national_team}</span>
        {isCaptain && <span className="text-yellow-400 text-xs font-bold">(C)</span>}
        {isVC      && <span className="text-blue-400   text-xs font-bold">(VC)</span>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!isCaptain && <button onClick={onSetCaptain} className="text-xs text-yellow-500 hover:text-yellow-300 px-1">C</button>}
        {!isVC      && <button onClick={onSetVC}      className="text-xs text-blue-500   hover:text-blue-300   px-1">VC</button>}
        <button onClick={onToggle} className="text-xs text-gray-400 hover:text-gray-200 px-2 py-1 bg-gray-800 rounded">
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
