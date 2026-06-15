// POST /api/sync-scores
// Admin-only. Body: { matchId: string, fotmobMatchId: string }
// Fetches stats from FotMob, calculates fantasy points, upserts to DB.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchFotMobMatch, getTopRatedPlayerIds } from '@/lib/api-football/fotmob'
import { calculateBasePoints } from '@/lib/scoring/calculator'
import type { ScoringInput } from '@/lib/types'

export async function POST(req: NextRequest) {
  // Auth check — admin secret header
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { matchId, fotmobMatchId } = body

  if (!matchId || !fotmobMatchId) {
    return NextResponse.json({ error: 'matchId and fotmobMatchId required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Verify match exists
  const { data: match, error: matchErr } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single()

  if (matchErr || !match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  // Fetch from FotMob
  let fotmobData
  try {
    fotmobData = await fetchFotMobMatch(fotmobMatchId)
  } catch (err: any) {
    return NextResponse.json({ error: `FotMob fetch failed: ${err.message}` }, { status: 502 })
  }

  // Get clean_sheet_active setting
  const { data: settings } = await supabase
    .from('app_settings')
    .select('key, value')
  const settingsMap = Object.fromEntries((settings ?? []).map((s: any) => [s.key, s.value]))
  const cleanSheetActive = settingsMap.clean_sheet_active === 'true'

  // Get top-3 rated player IDs for performance bonus
  const topRated = getTopRatedPlayerIds(fotmobData.players)

  // Match all fotmob players to our DB players by name (fuzzy)
  const { data: dbPlayers } = await supabase
    .from('players')
    .select('id, name, position')

  function matchPlayerName(fotmobName: string): string | null {
    if (!dbPlayers) return null
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')
    const normFM = norm(fotmobName)
    const exact = dbPlayers.find(p => norm(p.name) === normFM)
    if (exact) return exact.id
    // partial match
    const partial = dbPlayers.find(p => norm(p.name).includes(normFM) || normFM.includes(norm(p.name)))
    return partial?.id ?? null
  }

  const upsertRows = []
  let matched = 0, unmatched = 0

  for (const fp of fotmobData.players) {
    const dbPlayerId = matchPlayerName(fp.player_name)
    if (!dbPlayerId) { unmatched++; continue }

    const dbPlayer = dbPlayers!.find(p => p.id === dbPlayerId)!
    const ratingRank = topRated.indexOf(fp.player_id) >= 0
      ? (topRated.indexOf(fp.player_id) + 1) as 1 | 2 | 3
      : null

    const scoringInput: ScoringInput = {
      ...fp,
      id: '', match_id: matchId, player_id: dbPlayerId,
      position: dbPlayer.position as any,
      match_rating_rank: ratingRank,
      is_captain: false, is_vice_captain: false,
      clean_sheet_active: cleanSheetActive,
      base_fantasy_points: 0,
    }

    const basePoints = calculateBasePoints(scoringInput)

    upsertRows.push({
      player_id: dbPlayerId,
      match_id:  matchId,
      minutes_played:          fp.minutes_played,
      goals:                   fp.goals,
      own_goals:               fp.own_goals,
      assists:                 fp.assists,
      big_chances_created:     fp.big_chances_created,
      key_passes:              fp.key_passes,
      accurate_crosses:        fp.accurate_crosses,
      penalties_won:           fp.penalties_won,
      shots_on_target:         fp.shots_on_target,
      shots_off_target:        fp.shots_off_target,
      woodwork_hits:           fp.woodwork_hits,
      big_chances_missed:      fp.big_chances_missed,
      penalties_missed:        fp.penalties_missed,
      successful_dribbles:     fp.successful_dribbles,
      dispossessed:            fp.dispossessed,
      accurate_long_balls:     fp.accurate_long_balls,
      possession_lost:         fp.possession_lost,
      offsides:                fp.offsides,
      accurate_passes:         fp.accurate_passes,
      pass_accuracy:           fp.pass_accuracy,
      clearances:              fp.clearances,
      blocked_shots_defensive: fp.blocked_shots_defensive,
      interceptions:           fp.interceptions,
      tackles_won:             fp.tackles_won,
      ground_duels_won:        fp.ground_duels_won,
      ground_duels_lost:       fp.ground_duels_lost,
      aerial_duels_won:        fp.aerial_duels_won,
      aerial_duels_lost:       fp.aerial_duels_lost,
      dribbled_past:           fp.dribbled_past,
      fouls_drawn:             fp.fouls_drawn,
      fouls_committed:         fp.fouls_committed,
      penalties_committed:     fp.penalties_committed,
      errors_leading_to_goal:  fp.errors_leading_to_goal,
      saves:                   fp.saves,
      penalty_saves:           fp.penalty_saves,
      clean_sheet:             fp.clean_sheet,
      goals_conceded:          fp.goals_conceded,
      yellow_cards:            fp.yellow_cards,
      red_cards:               fp.red_cards,
      match_rating_rank:       ratingRank,
      base_fantasy_points:     basePoints,
      updated_at:              new Date().toISOString(),
    })
    matched++
  }

  // Upsert stats
  if (upsertRows.length > 0) {
    const { error: upsertErr } = await supabase
      .from('player_match_stats')
      .upsert(upsertRows, { onConflict: 'player_id,match_id' })
    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  }

  // Mark match completed
  await supabase
    .from('matches')
    .update({ is_completed: true, is_locked: true, home_score: fotmobData.home_score, away_score: fotmobData.away_score })
    .eq('id', matchId)

  // Trigger point recalculation for all teams
  await recalculateTeamPoints(supabase, matchId, match.matchday_number)

  return NextResponse.json({
    ok: true,
    matched,
    unmatched,
    totalPlayers: fotmobData.players.length,
    message: `Synced ${matched} players. ${unmatched} unmatched (check player names).`,
  })
}

async function recalculateTeamPoints(supabase: any, matchId: string, matchdayNumber: number) {
  // Get all teams
  const { data: teams } = await supabase.from('teams').select('id')

  for (const team of teams ?? []) {
    // Get this team's squad selection for this matchday
    const { data: selection } = await supabase
      .from('squad_selections')
      .select('player_id, is_starting')
      .eq('team_id', team.id)
      .eq('matchday_number', matchdayNumber)

    // Get captain assignment
    const { data: captain } = await supabase
      .from('captain_assignments')
      .select('captain_player_id, vice_captain_player_id')
      .eq('team_id', team.id)
      .eq('matchday_number', matchdayNumber)
      .single()

    if (!selection?.length) continue

    const startingPlayerIds = selection
      .filter((s: any) => s.is_starting)
      .map((s: any) => s.player_id)

    // Get stats for all starting players in this match
    const { data: stats } = await supabase
      .from('player_match_stats')
      .select('player_id, base_fantasy_points')
      .eq('match_id', matchId)
      .in('player_id', startingPlayerIds)

    let gross = 0, net = 0, captainBonus = 0

    for (const stat of stats ?? []) {
      const base = stat.base_fantasy_points ?? 0
      gross += base

      const isCaptain   = stat.player_id === captain?.captain_player_id
      const isVC        = stat.player_id === captain?.vice_captain_player_id

      if (isCaptain) {
        net   += base * 2
        captainBonus += base // the extra base added
      } else if (isVC) {
        net   += base * 1.5
        captainBonus += base * 0.5
      } else {
        net += base
      }
    }

    // Upsert team matchday points
    await supabase
      .from('team_matchday_points')
      .upsert({
        team_id:          team.id,
        matchday_number:  matchdayNumber,
        gross_points:     Math.round(gross * 100) / 100,
        net_points:       Math.round(net   * 100) / 100,
        captain_bonus:    Math.round(captainBonus * 100) / 100,
        is_finalized:     false,
        updated_at:       new Date().toISOString(),
      }, { onConflict: 'team_id,matchday_number' })
  }
}
