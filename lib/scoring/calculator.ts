// =============================================
// FIFA Fantasy 2026 — Scoring Engine
// Pro Mode — all rules implemented
// =============================================

import type { ScoringInput, Position } from '@/lib/types'

// Points for a goal by position
const GOAL_POINTS: Record<Position, number> = {
  GK:  100,
  DEF:  60,
  MID:  50,
  FWD:  40,
}

export function calculateBasePoints(s: ScoringInput): number {
  let pts = 0

  // ── Appearance ─────────────────────────────────────────────
  if (s.minutes_played > 0 && s.minutes_played < 60) pts += 10
  if (s.minutes_played >= 60) pts += 15

  // ── Goals ──────────────────────────────────────────────────
  pts += s.goals * GOAL_POINTS[s.position]
  pts += s.own_goals * -30

  // ── Clean Sheet ────────────────────────────────────────────
  // Note: clean_sheet_active flag is set per tournament phase by admin
  if (s.clean_sheet_active && s.minutes_played >= 60 && s.clean_sheet) {
    if (s.position === 'GK' || s.position === 'DEF') pts += 40
    if (s.position === 'MID') pts += 15
    // FWD: no clean sheet bonus
  }

  // Goals conceded penalty (GK + DEF regardless of minutes)
  if (s.position === 'GK' || s.position === 'DEF') {
    pts += s.goals_conceded * -5
  }

  // ── Assists & Chance Creation ───────────────────────────────
  pts += s.assists               * 25
  pts += s.big_chances_created   * 15
  pts += s.key_passes            * 8
  pts += s.accurate_crosses      * 4
  pts += s.penalties_won         * 15

  // ── Shooting ───────────────────────────────────────────────
  pts += s.shots_on_target       * 8
  pts += s.shots_off_target      * 3
  pts += s.woodwork_hits         * 10
  pts += s.big_chances_missed    * -10
  pts += s.penalties_missed      * -25

  // ── Dribbling & Possession ─────────────────────────────────
  pts += s.successful_dribbles   * 3
  pts += s.dispossessed          * -2
  pts += s.accurate_long_balls   * 3
  pts += s.possession_lost       * -2
  pts += s.offsides              * -3

  // ── Passing Bonuses (threshold, once per match) ────────────
  if (s.accurate_passes >= 40) pts += 10
  if (s.pass_accuracy >= 83 && s.accurate_passes >= 25) pts += 10

  // ── Defensive — Clearances & Blocks (outfield only) ────────
  if (s.position !== 'GK') {
    pts += s.clearances                * 4
    pts += s.blocked_shots_defensive   * 8
    // blocked_shots_own removed — not reliably tracked by any data source
    pts += s.interceptions             * 6
  }

  // ── Defensive — Tackles & Duels (outfield only) ────────────
  if (s.position !== 'GK') {
    pts += s.tackles_won               * 6
    pts += s.ground_duels_won          * 3
    pts += s.ground_duels_lost         * -2
    pts += s.aerial_duels_won          * 4
    pts += s.aerial_duels_lost         * -2
    pts += s.dribbled_past             * -4
  }

  // ── Fouls ──────────────────────────────────────────────────
  pts += s.fouls_drawn               * 3
  pts += s.fouls_committed           * -3
  pts += s.penalties_committed       * -20
  pts += s.errors_leading_to_goal    * -30

  // ── Goalkeeper specific ────────────────────────────────────
  if (s.position === 'GK') {
    pts += s.saves           * 6
    pts += s.penalty_saves   * 50
    // high_claims removed — not consistently tracked by FotMob
    // GK goals handled above by GOAL_POINTS['GK']
    // GK penalties_committed handled by fouls section above
    // GK errors_leading_to_goal handled above
  }

  // ── Discipline ─────────────────────────────────────────────
  pts += s.yellow_cards  * -10
  pts += s.red_cards     * -50

  // ── Performance Bonus (top 3 rated per match) ──────────────
  if (s.match_rating_rank === 1) pts += 15
  if (s.match_rating_rank === 2) pts += 10
  if (s.match_rating_rank === 3) pts += 5

  return Math.round(pts * 100) / 100
}

/**
 * Apply captain/vice-captain multiplier to a player's base points.
 * Captain 2×, Vice-captain 1.5× — applied to TOTAL final score.
 *
 * Captain locking rules (enforced in the API layer, not here):
 *  - When armband leaves a LOCKED player, their score is finalized here at 2×
 *    and stored; subsequent points for that player in the same matchday do NOT
 *    get doubled again.
 */
export function applyArmband(
  basePoints: number,
  isCaptain: boolean,
  isViceCaptain: boolean,
): number {
  if (isCaptain) return Math.round(basePoints * 2 * 100) / 100
  if (isViceCaptain) return Math.round(basePoints * 1.5 * 100) / 100
  return basePoints
}

/**
 * Full calculation for a single player in a single matchday.
 * Returns both base points and final (after armband).
 */
export function calculatePlayerMatchdayPoints(s: ScoringInput): {
  base: number
  final: number
} {
  const base  = calculateBasePoints(s)
  const final = applyArmband(base, s.is_captain, s.is_vice_captain)
  return { base, final }
}

/**
 * Sum up a team's total points for a matchday.
 * Includes only starting XI players (bench only scores if auto/manual sub happened).
 */
export function calculateTeamMatchdayPoints(
  playerPoints: Array<{ base: number; final: number; isPlaying: boolean }>
): { gross: number; net: number } {
  let gross = 0
  let net   = 0
  for (const p of playerPoints) {
    if (!p.isPlaying) continue
    gross += p.base
    net   += p.final
  }
  return {
    gross: Math.round(gross * 100) / 100,
    net:   Math.round(net   * 100) / 100,
  }
}
