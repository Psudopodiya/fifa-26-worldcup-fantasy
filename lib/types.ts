// =============================================
// FIFA Fantasy 2026 — Shared TypeScript Types
// =============================================

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD'

export type PhaseId = 'PHASE_01' | 'PHASE_02' | 'PHASE_03' | 'PHASE_04' | 'PHASE_05' | 'PHASE_06'

export interface NationalTeam {
  code: string
  name: string
  group_name: string | null
  flag_emoji: string | null
}

export interface TournamentPhase {
  phase_id: PhaseId
  name: string
  round: string
  max_players_per_nation: number | null
  free_transfers_per_matchday: number | null
  transfer_rollover_max: number
  captain_twists_per_matchday: number | null
  manual_subs_per_matchday: number | null
  is_wildcard: boolean
  is_current: boolean
}

export interface Team {
  id: string
  name: string
  user_id: string | null
  budget_remaining: number
  is_admin: boolean
  created_at: string
}

export interface Player {
  id: string
  name: string
  position: Position
  national_team: string
  team_id: string | null
  auction_price: number | null
  is_sold: boolean
  is_released: boolean
  released_at: string | null
  points_at_release: number
  msa_team_id: string | null
  msa_price: number | null
  msa_points_from_matchday: number | null
  created_at: string
  // joined
  national_team_data?: NationalTeam
  effective_team_id?: string | null  // msa_team_id ?? team_id
}

export interface Match {
  id: string
  api_match_id: string | null
  home_team: string
  away_team: string
  kickoff_time: string
  home_score: number | null
  away_score: number | null
  stage: string
  matchday_number: number
  phase_id: string | null
  is_completed: boolean
  is_locked: boolean
}

export interface SquadSelection {
  id: string
  team_id: string
  player_id: string
  matchday_number: number
  is_starting: boolean
  bench_order: number | null
  player?: Player
}

export interface CaptainAssignment {
  id: string
  team_id: string
  matchday_number: number
  captain_player_id: string | null
  vice_captain_player_id: string | null
  unique_captains_count: number
  manual_action_taken: boolean
  auto_sub_eligible: boolean
}

export interface PlayerMatchStats {
  id: string
  player_id: string
  match_id: string
  minutes_played: number
  goals: number
  own_goals: number
  assists: number
  big_chances_created: number
  key_passes: number
  accurate_crosses: number
  penalties_won: number
  shots_on_target: number
  shots_off_target: number
  woodwork_hits: number
  big_chances_missed: number
  penalties_missed: number
  successful_dribbles: number
  dispossessed: number
  accurate_long_balls: number
  possession_lost: number
  offsides: number
  accurate_passes: number
  pass_accuracy: number
  clearances: number
  blocked_shots_defensive: number
  interceptions: number
  tackles_won: number
  ground_duels_won: number
  ground_duels_lost: number
  aerial_duels_won: number
  aerial_duels_lost: number
  dribbled_past: number
  fouls_drawn: number
  fouls_committed: number
  penalties_committed: number
  errors_leading_to_goal: number
  saves: number
  penalty_saves: number
  clean_sheet: boolean
  goals_conceded: number
  yellow_cards: number
  red_cards: number
  match_rating_rank: 1 | 2 | 3 | null
  base_fantasy_points: number
  // joined
  player?: Player
  match?: Match
}

export interface TeamMatchdayPoints {
  id: string
  team_id: string
  matchday_number: number
  gross_points: number
  net_points: number
  captain_bonus: number
  is_finalized: boolean
  // joined
  team?: Team
}

export interface MsaSession {
  id: string
  is_open: boolean
  is_completed: boolean
  max_releases_per_team: number
  current_player_id: string | null
  auction_order: string[]
  current_item_index: number
  timer_start: string | null
  timer_end: string | null
  last_bid_at: string | null
  // joined
  current_player?: Player
}

export interface MsaBid {
  id: string
  msa_session_id: string
  player_id: string
  team_id: string
  amount: number
  is_winning: boolean
  created_at: string
  // joined
  team?: Team
}

export interface AppSettings {
  clean_sheet_active: boolean
  current_matchday: number
  current_phase: PhaseId
  league_name: string
  msa_max_releases: number
}

// ── Scoring input (maps to PlayerMatchStats + position)
export interface ScoringInput extends PlayerMatchStats {
  position: Position
  is_captain: boolean
  is_vice_captain: boolean
  clean_sheet_active: boolean
}
