'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import type { MsaSession, MsaBid, Player, Team } from '@/lib/types'
import { clsx } from 'clsx'

const INITIAL_TIMER = 30
const BID_REFRESH   = 15

export default function MsaPage() {
  const { userId } = useAuth()
  const supabase = createClient()
  const [session, setSession]     = useState<MsaSession | null>(null)
  const [bids, setBids]           = useState<MsaBid[]>([])
  const [myTeam, setMyTeam]       = useState<Team | null>(null)
  const [isAdmin, setIsAdmin]     = useState(false)
  const [timeLeft, setTimeLeft]   = useState(0)
  const [bidAmount, setBidAmount] = useState('')
  const [bidding, setBidding]     = useState(false)
  const [msg, setMsg]             = useState('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    const { data: t } = await supabase.from('teams').select('*').eq('user_id', userId).single()
    setMyTeam(t); setIsAdmin(t?.is_admin ?? false)

    const { data: s } = await supabase
      .from('msa_sessions')
      .select('*, current_player:players!current_player_id(*)')
      .order('created_at', { ascending: false })
      .limit(1).single()
    setSession(s)

    if (s?.id) {
      const { data: b } = await supabase
        .from('msa_bids').select('*, team:teams(name)')
        .eq('msa_session_id', s.id).order('created_at', { ascending: false })
      setBids(b ?? [])
    }
  }, [supabase, userId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const sessionSub = supabase.channel('msa_session_ch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'msa_sessions' }, payload => {
        const row = payload.new as any
        setSession(row)
        if (row?.timer_end) {
          const secsLeft = Math.max(0, Math.round((new Date(row.timer_end).getTime() - Date.now()) / 1000))
          setTimeLeft(secsLeft)
        }
      }).subscribe()

    const bidsSub = supabase.channel('msa_bids_ch')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'msa_bids' }, payload => {
        setBids(prev => [payload.new as any, ...prev])
        setTimeLeft(BID_REFRESH)
      }).subscribe()

    return () => { supabase.removeChannel(sessionSub); supabase.removeChannel(bidsSub) }
  }, [supabase])

  useEffect(() => {
    if (session?.timer_end) {
      const secsLeft = Math.max(0, Math.round((new Date(session.timer_end).getTime() - Date.now()) / 1000))
      setTimeLeft(secsLeft)
    }
  }, [session?.timer_end])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!session?.is_open || !session?.current_player_id) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current!); return 0 } return t - 1 })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [session?.current_player_id, session?.is_open])

  async function placeBid() {
    if (!session || !myTeam || !bidAmount) return
    const amount = parseFloat(bidAmount)
    const currentHigh = bids.find(b => b.is_winning)?.amount ?? 0
    if (amount <= currentHigh) { setMsg(`Must be higher than £${currentHigh}`); return }
    if (amount > myTeam.budget_remaining) { setMsg('Insufficient budget'); return }
    setBidding(true); setMsg('')
    await supabase.from('msa_bids').update({ is_winning: false })
      .eq('msa_session_id', session.id).eq('player_id', session.current_player_id!)
    const { error } = await supabase.from('msa_bids').insert({
      msa_session_id: session.id, player_id: session.current_player_id,
      team_id: myTeam.id, amount, is_winning: true,
    })
    if (error) { setMsg(error.message); setBidding(false); return }
    const newTimerEnd = new Date(Date.now() + BID_REFRESH * 1000).toISOString()
    await supabase.from('msa_sessions').update({ last_bid_at: new Date().toISOString(), timer_end: newTimerEnd }).eq('id', session.id)
    setBidAmount(''); setBidding(false)
  }

  async function adminAdvance() {
    if (!session) return
    const order = session.auction_order ?? []
    const nextIdx = (session.current_item_index ?? 0) + 1
    const winningBid = bids.find(b => b.is_winning && b.player_id === session.current_player_id)
    if (winningBid) {
      await supabase.from('players').update({ msa_team_id: winningBid.team_id, msa_price: winningBid.amount, is_sold: true })
        .eq('id', session.current_player_id!)
    }
    if (nextIdx >= order.length) {
      await supabase.from('msa_sessions').update({ is_open: false, is_completed: true }).eq('id', session.id)
      return
    }
    const newTimerEnd = new Date(Date.now() + INITIAL_TIMER * 1000).toISOString()
    await supabase.from('msa_sessions').update({
      current_player_id: order[nextIdx], current_item_index: nextIdx,
      timer_start: new Date().toISOString(), timer_end: newTimerEnd, last_bid_at: null,
    }).eq('id', session.id)
  }

  const winningBid    = bids.find(b => b.is_winning && b.player_id === session?.current_player_id)
  const currentPlayer = (session as any)?.current_player as Player | undefined
  const timerPercent  = Math.round((timeLeft / (winningBid ? BID_REFRESH : INITIAL_TIMER)) * 100)
  const timerColor    = timeLeft > 10 ? 'bg-green-500' : timeLeft > 5 ? 'bg-yellow-500' : 'bg-red-500'

  if (!session) return (
    <div className="text-center py-20 text-gray-400">
      <div className="text-4xl mb-4">🔨</div>
      <p className="text-xl font-semibold">Mid-Season Auction</p>
      <p className="mt-2">Not started yet. Admin will open it when ready.</p>
    </div>
  )
  if (session.is_completed) return (
    <div className="text-center py-20">
      <div className="text-4xl mb-4">✅</div>
      <h1 className="text-2xl font-bold">MSA Complete</h1>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🔨 Mid-Season Auction</h1>
        {session.is_open
          ? <span className="text-green-400 text-sm font-semibold animate-pulse">● LIVE</span>
          : <span className="text-yellow-400 text-sm">Waiting to open…</span>}
      </div>

      {session.is_open && currentPlayer ? (
        <>
          <div className="card border-2 border-brand-500">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">NOW BIDDING</p>
                <h2 className="text-2xl font-bold">{currentPlayer.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge-${currentPlayer.position}`}>{currentPlayer.position}</span>
                  <span className="text-gray-400 text-sm">{currentPlayer.national_team}</span>
                </div>
              </div>
              <div className="text-right">
                <div className={clsx('text-5xl font-bold tabular-nums', timeLeft <= 5 ? 'text-red-400 animate-pulse' : timeLeft <= 10 ? 'text-yellow-400' : 'text-white')}>
                  {timeLeft}
                </div>
                <div className="text-gray-500 text-xs">seconds</div>
              </div>
            </div>

            <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
              <div className={clsx('h-2 rounded-full transition-all duration-1000', timerColor)} style={{ width: `${Math.min(100, timerPercent)}%` }} />
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-500 text-xs">Current High</p>
                <p className="text-2xl font-bold text-brand-400">{winningBid ? `£${winningBid.amount}` : 'No bids'}</p>
                {winningBid && (
                  <p className="text-xs text-gray-400">
                    {(winningBid as any).team?.name}
                    {winningBid.team_id === myTeam?.id && <span className="text-green-400 ml-1">(you!)</span>}
                  </p>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {(session.current_item_index ?? 0) + 1} / {session.auction_order?.length ?? '?'}
              </div>
            </div>

            {timeLeft > 0 ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-gray-400 text-sm">£</span>
                  <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)}
                    placeholder={String((winningBid?.amount ?? 0) + 0.5)} min={(winningBid?.amount ?? 0) + 0.5} step={0.5}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
                <button onClick={placeBid} disabled={bidding || timeLeft === 0} className="btn-primary px-6">
                  {bidding ? '…' : 'Bid'}
                </button>
              </div>
            ) : (
              <div className="text-center py-2 text-gray-400 text-sm">
                ⏱ Time up! {winningBid ? `${(winningBid as any).team?.name} wins.` : 'No winner.'}
              </div>
            )}
            {msg && <p className="text-red-400 text-sm mt-2">{msg}</p>}
          </div>

          {isAdmin && (
            <div className="card border border-purple-700 bg-purple-900/10">
              <h3 className="font-semibold text-purple-300 mb-3">Admin</h3>
              <button onClick={adminAdvance} className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                Finalize & Next Player →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-10 text-gray-400">
          Waiting for admin to start the auction…
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-3">Bid Log</h2>
        {bids.length === 0 && <p className="text-gray-500 text-sm">No bids yet.</p>}
        {bids.slice(0, 30).map(b => (
          <div key={b.id} className={clsx('flex items-center justify-between py-2 border-b border-gray-800 last:border-0 text-sm', b.is_winning && 'bg-green-900/10')}>
            <span className="flex items-center gap-2">
              {b.is_winning && <span className="text-green-400">★</span>}
              {(b as any).team?.name}
              {b.team_id === myTeam?.id && <span className="text-brand-400 text-xs">(you)</span>}
            </span>
            <span className={clsx('font-bold', b.is_winning ? 'text-green-400' : 'text-gray-500')}>£{b.amount}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
