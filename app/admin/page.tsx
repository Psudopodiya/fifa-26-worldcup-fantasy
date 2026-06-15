'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminPage() {
  const supabase = createClient()
  const [teams, setTeams]         = useState<any[]>([])
  const [users, setUsers]         = useState<any[]>([])
  const [settings, setSettings]   = useState<Record<string, string>>({})
  const [phases, setPhases]       = useState<any[]>([])
  const [matches, setMatches]     = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [msg, setMsg]             = useState('')

  // Import fixtures state
  const [importing, setImporting]       = useState(false)
  const [importResult, setImportResult] = useState('')

  // Sync form state
  const [matchId, setMatchId]         = useState('')
  const [fotmobId, setFotmobId]       = useState('')
  const [syncing, setSyncing]         = useState(false)
  const [syncResult, setSyncResult]   = useState('')

  // Add fixture form
  const [fixture, setFixture] = useState({ home_team: '', away_team: '', kickoff_time: '', stage: 'Group', matchday_number: '1', phase_id: 'PHASE_01' })
  const [addingFixture, setAddingFixture] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: s }, { data: ph }, { data: m }] = await Promise.all([
        supabase.from('teams').select('*').order('name'),
        supabase.from('app_settings').select('key,value'),
        supabase.from('tournament_phases').select('*').order('phase_id'),
        supabase.from('matches').select('*').order('kickoff_time').limit(20),
      ])
      setTeams(t ?? [])
      setSettings(Object.fromEntries((s ?? []).map((x: any) => [x.key, x.value])))
      setPhases(ph ?? [])
      setMatches(m ?? [])
      setLoading(false)
    }
    load()
  }, [])

  async function saveSetting(key: string, value: string) {
    await supabase.from('app_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    setSettings(prev => ({ ...prev, [key]: value }))
    setMsg(`Saved: ${key}`)
    setTimeout(() => setMsg(''), 2000)
  }

  async function setCurrentPhase(phaseId: string) {
    await supabase.from('tournament_phases').update({ is_current: false }).neq('phase_id', phaseId)
    await supabase.from('tournament_phases').update({ is_current: true }).eq('phase_id', phaseId)
    await saveSetting('current_phase', phaseId)
  }

  async function assignTeamToUser(teamId: string, email: string) {
    // Look up user by email (admin operation)
    const res = await fetch('/api/admin/assign-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET ?? '' },
      body: JSON.stringify({ teamId, email }),
    })
    const data = await res.json()
    setMsg(data.message ?? data.error)
    setTimeout(() => setMsg(''), 3000)
  }

  async function importFixtures() {
    setImporting(true); setImportResult('')
    const res = await fetch('/api/import-fixtures', {
      method: 'POST',
      headers: { 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET ?? '' },
    })
    const data = await res.json()
    setImportResult(data.message ?? data.error ?? JSON.stringify(data))
    // Refresh matches list after import
    if (!data.error) {
      const { data: m } = await supabase.from('matches').select('*').order('kickoff_time').limit(20)
      setMatches(m ?? [])
    }
    setImporting(false)
  }

  async function syncMatch() {
    setSyncing(true); setSyncResult('')
    const res = await fetch('/api/sync-scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET ?? '' },
      body: JSON.stringify({ matchId, fotmobMatchId: fotmobId }),
    })
    const data = await res.json()
    setSyncResult(data.message ?? data.error ?? JSON.stringify(data))
    setSyncing(false)
  }

  async function addFixture() {
    setAddingFixture(true)
    const { error } = await supabase.from('matches').insert({
      home_team: fixture.home_team,
      away_team: fixture.away_team,
      kickoff_time: new Date(fixture.kickoff_time).toISOString(),
      stage: fixture.stage,
      matchday_number: parseInt(fixture.matchday_number),
      phase_id: fixture.phase_id,
    })
    if (error) setMsg(error.message)
    else { setMsg('Fixture added!'); setFixture(f => ({ ...f, home_team: '', away_team: '' })) }
    setAddingFixture(false)
    setTimeout(() => setMsg(''), 2000)
  }

  if (loading) return <div className="text-gray-400 text-center py-20">Loading admin…</div>

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-2xl font-bold">⚙️ Admin Panel</h1>
      {msg && <div className="bg-green-900/30 text-green-300 px-4 py-2 rounded-lg text-sm">{msg}</div>}

      {/* Auto-import fixtures */}
      <section className="card space-y-4">
        <h2 className="font-semibold text-lg">📥 Import All WC2026 Fixtures</h2>
        <p className="text-gray-400 text-sm">
          Fetches all 104 fixtures directly from FotMob and bulk-inserts them into the database.
          Safe to run multiple times — existing fixtures are updated, not duplicated.
          Kickoff times are stored as UTC and displayed in IST (India Standard Time).
        </p>
        <button
          onClick={importFixtures}
          disabled={importing}
          className="btn-primary"
        >
          {importing ? '⏳ Importing from FotMob…' : '📥 Import All WC2026 Fixtures'}
        </button>
        {importResult && (
          <p className={`text-sm mt-1 ${importResult.includes('error') || importResult.includes('failed') ? 'text-red-400' : 'text-green-300'}`}>
            {importResult}
          </p>
        )}
      </section>

      {/* Sync scores */}
      <section className="card space-y-4">
        <h2 className="font-semibold text-lg">🔄 Sync Match from FotMob</h2>
        <p className="text-gray-400 text-sm">
          After a match finishes, paste the FotMob match ID (from the URL on fotmob.com/match/XXXXX)
          and select the DB match to update.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">DB Match</label>
            <select
              value={matchId}
              onChange={e => setMatchId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">Select match…</option>
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  MD{m.matchday_number}: {m.home_team} vs {m.away_team}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">FotMob Match ID</label>
            <input
              type="text"
              value={fotmobId}
              onChange={e => setFotmobId(e.target.value)}
              placeholder="e.g. 4317846"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
        </div>
        <button onClick={syncMatch} disabled={syncing || !matchId || !fotmobId} className="btn-primary">
          {syncing ? 'Syncing from FotMob…' : 'Sync Scores'}
        </button>
        {syncResult && <p className="text-sm text-gray-300 mt-1">{syncResult}</p>}
      </section>

      {/* Phase management */}
      <section className="card space-y-3">
        <h2 className="font-semibold text-lg">📊 Tournament Phase</h2>
        <div className="grid grid-cols-2 gap-2">
          {phases.map(ph => (
            <button
              key={ph.phase_id}
              onClick={() => setCurrentPhase(ph.phase_id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                ph.is_current
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <div className="font-semibold">{ph.name}</div>
              <div className="text-xs opacity-70">
                {ph.max_players_per_nation != null ? `≤${ph.max_players_per_nation}/nation` : 'Unlimited'} ·
                {ph.free_transfers_per_matchday != null ? ` ${ph.free_transfers_per_matchday} free transfer(s)` : ' Wildcard'}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Settings */}
      <section className="card space-y-3">
        <h2 className="font-semibold text-lg">⚙️ League Settings</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Current Matchday</label>
            <div className="flex gap-2">
              <input
                type="number" min={1}
                value={settings.current_matchday ?? '1'}
                onChange={e => setSettings(p => ({ ...p, current_matchday: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              />
              <button onClick={() => saveSetting('current_matchday', settings.current_matchday)} className="btn-secondary text-sm px-3">Save</button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Clean Sheet Points</label>
            <button
              onClick={() => saveSetting('clean_sheet_active', settings.clean_sheet_active === 'true' ? 'false' : 'true')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                settings.clean_sheet_active === 'true'
                  ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-300'
              }`}
            >
              {settings.clean_sheet_active === 'true' ? '✓ Active' : '✗ Inactive'}
            </button>
          </div>
        </div>
      </section>

      {/* Add fixture */}
      <section className="card space-y-3">
        <h2 className="font-semibold text-lg">📅 Add Fixture</h2>
        <div className="grid grid-cols-2 gap-3">
          {(['home_team','away_team'] as const).map(field => (
            <div key={field}>
              <label className="block text-xs text-gray-400 mb-1">{field === 'home_team' ? 'Home Team Code' : 'Away Team Code'}</label>
              <input
                type="text" placeholder="e.g. ARG"
                value={fixture[field]}
                onChange={e => setFixture(f => ({ ...f, [field]: e.target.value.toUpperCase() }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Kickoff Time</label>
            <input
              type="datetime-local"
              value={fixture.kickoff_time}
              onChange={e => setFixture(f => ({ ...f, kickoff_time: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Matchday #</label>
            <input
              type="number" min={1}
              value={fixture.matchday_number}
              onChange={e => setFixture(f => ({ ...f, matchday_number: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Stage</label>
            <select
              value={fixture.stage}
              onChange={e => setFixture(f => ({ ...f, stage: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option>Group</option>
              <option>Round of 32</option>
              <option>Round of 16</option>
              <option>Quarter-Final</option>
              <option>Semi-Final</option>
              <option>Final</option>
              <option>3rd Place</option>
            </select>
          </div>
        </div>
        <button onClick={addFixture} disabled={addingFixture} className="btn-primary">
          {addingFixture ? 'Adding…' : 'Add Fixture'}
        </button>
      </section>

      {/* Team → User assignment */}
      <section className="card space-y-3">
        <h2 className="font-semibold text-lg">👤 Assign Teams to Users</h2>
        <p className="text-gray-400 text-sm">
          First invite users via Supabase Dashboard → Auth → Users → Invite user. Then assign their team here.
        </p>
        {teams.map(t => (
          <TeamAssignRow key={t.id} team={t} onAssign={assignTeamToUser} />
        ))}
      </section>
    </div>
  )
}

function TeamAssignRow({ team, onAssign }: { team: any; onAssign: (id: string, email: string) => void }) {
  const [email, setEmail] = useState('')
  return (
    <div className="flex items-center gap-3 border-b border-gray-800 pb-2 last:border-0">
      <span className="font-medium w-40 shrink-0">{team.name}</span>
      <span className="text-gray-500 text-xs w-32 shrink-0">{team.user_id ? '✓ Assigned' : 'Unassigned'}</span>
      <input
        type="email"
        placeholder="user@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
      />
      <button onClick={() => onAssign(team.id, email)} className="btn-secondary text-xs px-3 py-1">
        Assign
      </button>
    </div>
  )
}
