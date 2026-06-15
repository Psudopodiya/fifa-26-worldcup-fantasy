'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'

type Player = {
  id: string; name: string; position: string; national_team: string
  auction_price: number; team_id: string | null; is_sold: boolean
  nt?: { flag_emoji: string }; team?: { name: string }
}
type Phase = {
  phase_id: string; name: string; free_transfers_per_matchday: number | null
  max_players_per_nation: number | null; is_wildcard: boolean
}
type Transfer = {
  id: string; player_in_id: string; player_out_id: string; matchday_number: number
  player_in?: { name: string }; player_out?: { name: string }
}

export default function TransfersPage() {
  const { userId } = useAuth()
  const supabase = createClient()
  const [myTeam, setMyTeam]         = useState<any>(null)
  const [myPlayers, setMyPlayers]   = useState<Player[]>([])
  const [pool, setPool]             = useState<Player[]>([])
  const [phase, setPhase]           = useState<Phase | null>(null)
  const [matchday, setMatchday]     = useState(1)
  const [transfers, setTransfers]   = useState<Transfer[]>([])
  const [alloc, setAlloc]           = useState<any>(null)

  const [outPlayer, setOutPlayer]   = useState('')
  const [inPlayer, setInPlayer]     = useState('')
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg]               = useState('')
  const [posFilter, setPosFilter]   = useState('ALL')

  useEffect(() => {
    async function load() {
      if (!userId) return

      const [
        { data: team },
        { data: settings },
      ] = await Promise.all([
        supabase.from('teams').select('*').eq('user_id', userId).single(),
        supabase.from('app_settings').select('key,value'),
      ])

      setMyTeam(team)
      const sm = Object.fromEntries((settings ?? []).map((s: any) => [s.key, s.value]))
      const md = parseInt(sm.current_matchday ?? '1')
      setMatchday(md)

      if (!team) { setLoading(false); return }

      const [
        { data: players },
        { data: ph },
        { data: txs },
        { data: ta },
        { data: poolPlayers },
      ] = await Promise.all([
        supabase.from('players').select('*, nt:national_teams(flag_emoji)').eq('team_id', team.id),
        supabase.from('tournament_phases').select('*').eq('is_current', true).single(),
        supabase.from('transfers')
          .select('*, player_in:players!player_in_id(name), player_out:players!player_out_id(name)')
          .eq('team_id', team.id).eq('matchday_number', md),
        supabase.from('transfer_allocations').select('*').eq('team_id', team.id).eq('matchday_number', md).single(),
        supabase.from('players').select('*, nt:national_teams(flag_emoji)').is('team_id', null).eq('is_sold', false),
      ])

      setMyPlayers((players ?? []) as Player[])
      setPhase(ph as Phase)
      setTransfers((txs ?? []) as Transfer[])
      setAlloc(ta)
      setPool((poolPlayers ?? []) as Player[])
      setLoading(false)
    }
    load()
  }, [userId])

  async function makeTransfer() {
    if (!outPlayer || !inPlayer || !myTeam) return
    setSubmitting(true); setMsg('')

    // Swap: remove outPlayer from team, add inPlayer
    const out = myPlayers.find(p => p.id === outPlayer)
    const inP = pool.find(p => p.id === inPlayer)
    if (!out || !inP) { setMsg('Player not found'); setSubmitting(false); return }

    // Insert transfer record
    const { error: txErr } = await supabase.from('transfers').insert({
      team_id: myTeam.id,
      player_in_id: inPlayer,
      player_out_id: outPlayer,
      matchday_number: matchday,
      is_free: (transfers.length < (phase?.free_transfers_per_matchday ?? 1)),
    })
    if (txErr) { setMsg(txErr.message); setSubmitting(false); return }

    // Move player
    await supabase.from('players').update({ team_id: myTeam.id, is_sold: true }).eq('id', inPlayer)
    await supabase.from('players').update({ team_id: null, is_sold: false }).eq('id', outPlayer)

    // Budget
    const delta = (out.auction_price ?? 0) - (inP.auction_price ?? 0)
    await supabase.from('teams').update({ budget_remaining: (myTeam.budget_remaining ?? 0) + delta }).eq('id', myTeam.id)

    setMsg(`Transfer done: ${out.name} → ${inP.name}`)
    setOutPlayer(''); setInPlayer('')

    // Refresh
    const [{ data: p }, { data: pl }, { data: t }] = await Promise.all([
      supabase.from('players').select('*, nt:national_teams(flag_emoji)').eq('team_id', myTeam.id),
      supabase.from('players').select('*, nt:national_teams(flag_emoji)').is('team_id', null).eq('is_sold', false),
      supabase.from('transfers').select('*, player_in:players!player_in_id(name), player_out:players!player_out_id(name)').eq('team_id', myTeam.id).eq('matchday_number', matchday),
    ])
    setMyPlayers((p ?? []) as Player[])
    setPool((pl ?? []) as Player[])
    setTransfers((t ?? []) as Transfer[])
    setSubmitting(false)
  }

  if (loading) return <div className="text-gray-400 text-center py-20">Loading…</div>
  if (!myTeam) return <div className="text-gray-400 text-center py-20">No team assigned yet.</div>

  const freeLeft  = (phase?.free_transfers_per_matchday ?? 1) - transfers.length
  const isWildcard = phase?.is_wildcard ?? false
  const outPos     = myPlayers.find(p => p.id === outPlayer)?.position
  const filteredPool = pool.filter(p => (!outPos || p.position === outPos) && (posFilter === 'ALL' || p.position === posFilter))

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transfers — MD{matchday}</h1>
        <div className="text-right">
          <div className="text-brand-400 font-bold text-lg">
            {isWildcard ? '∞ Wildcard' : `${freeLeft < 0 ? 0 : freeLeft} free transfer${freeLeft !== 1 ? 's' : ''} left`}
          </div>
          <div className="text-gray-400 text-xs">Budget: £{(myTeam.budget_remaining ?? 0).toFixed(1)}M</div>
        </div>
      </div>

      {msg && (
        <div className={`px-4 py-2 rounded-lg text-sm ${msg.includes('done') ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-400'}`}>
          {msg}
        </div>
      )}

      {/* Phase info */}
      {phase && (
        <div className="card bg-brand-500/5 border-brand-500/20 text-sm text-gray-300">
          <span className="font-semibold text-brand-400">{phase.name}</span>
          {phase.max_players_per_nation && (
            <span className="ml-3 text-gray-400">Max {phase.max_players_per_nation} players/nation</span>
          )}
          {isWildcard && (
            <span className="ml-3 text-yellow-400 font-medium">⚡ Wildcard active — unlimited transfers this matchday</span>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Step 1: Pick player to sell */}
        <div className="card space-y-3">
          <h2 className="font-semibold">1. Sell — pick from your squad</h2>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {(['GK','DEF','MID','FWD'] as const).map(pos => {
              const grp = myPlayers.filter(p => p.position === pos)
              if (!grp.length) return null
              return (
                <div key={pos}>
                  <div className="text-xs text-gray-500 uppercase tracking-wider my-1">{pos}</div>
                  {grp.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setOutPlayer(p.id); setInPlayer('') }}
                      className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        outPlayer === p.id ? 'bg-red-500/20 border border-red-500/40' : 'hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`badge-${p.position}`}>{p.position}</span>
                        <span className="font-medium">{p.name}</span>
                        <span className="text-gray-500 text-xs">{(p as any).nt?.flag_emoji}</span>
                      </div>
                      <span className="text-gray-400 text-xs">£{p.auction_price}</span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step 2: Pick player to buy */}
        <div className="card space-y-3">
          <h2 className="font-semibold">2. Buy — from unsold pool</h2>
          <div className="flex gap-1 flex-wrap mb-2">
            {['ALL','GK','DEF','MID','FWD'].map(p => (
              <button
                key={p}
                onClick={() => setPosFilter(p)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${posFilter === p ? 'bg-brand-500 text-white' : 'bg-gray-800 text-gray-400'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {filteredPool.length === 0 && (
              <p className="text-gray-500 text-sm py-4 text-center">
                {outPlayer ? 'No pool players at this position' : 'Pick a player to sell first'}
              </p>
            )}
            {filteredPool.map(p => (
              <button
                key={p.id}
                onClick={() => setInPlayer(p.id)}
                className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  inPlayer === p.id ? 'bg-green-500/20 border border-green-500/40' : 'hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`badge-${p.position}`}>{p.position}</span>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-gray-500 text-xs">{(p as any).nt?.flag_emoji} {p.national_team}</span>
                </div>
                <span className="text-gray-400 text-xs">£{p.auction_price}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm */}
      {outPlayer && inPlayer && (() => {
        const out = myPlayers.find(p => p.id === outPlayer)!
        const inP = pool.find(p => p.id === inPlayer)!
        const delta = (out?.auction_price ?? 0) - (inP?.auction_price ?? 0)
        return (
          <div className="card flex items-center justify-between gap-4">
            <div className="text-sm">
              <span className="text-red-400 font-medium">OUT: {out?.name}</span>
              <span className="text-gray-500 mx-2">→</span>
              <span className="text-green-400 font-medium">IN: {inP?.name}</span>
              <span className={`ml-3 text-xs ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                Budget change: {delta >= 0 ? '+' : ''}£{delta.toFixed(1)}M
              </span>
              {!isWildcard && freeLeft <= 0 && (
                <span className="ml-3 text-yellow-400 text-xs">⚠ No free transfers left — costs -4 pts</span>
              )}
            </div>
            <button onClick={makeTransfer} disabled={submitting} className="btn-primary shrink-0">
              {submitting ? 'Confirming…' : 'Confirm Transfer'}
            </button>
          </div>
        )
      })()}

      {/* This matchday's transfers */}
      {transfers.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-3">Transfers Made — MD{matchday}</h2>
          <div className="space-y-1.5">
            {transfers.map((tx, i) => (
              <div key={tx.id} className="flex items-center gap-3 text-sm border-b border-gray-800 last:border-0 pb-2">
                <span className="text-gray-500 w-4">{i + 1}</span>
                <span className="text-red-400 font-medium">{(tx as any).player_out?.name}</span>
                <span className="text-gray-500">→</span>
                <span className="text-green-400 font-medium">{(tx as any).player_in?.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
