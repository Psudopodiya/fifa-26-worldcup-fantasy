-- =============================================
-- FIFA Fantasy 2026 — Full Database Schema
-- =============================================

-- =============================================
-- CORE LOOKUP TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS national_teams (
  code TEXT PRIMARY KEY,          -- ARG, BRA, ENG, etc.
  name TEXT NOT NULL,
  group_name TEXT,                -- Group A, B, C...
  flag_emoji TEXT
);

-- =============================================
-- TOURNAMENT PHASES
-- =============================================

CREATE TABLE IF NOT EXISTS tournament_phases (
  phase_id TEXT PRIMARY KEY,      -- PHASE_01 … PHASE_06
  name TEXT NOT NULL,
  round TEXT NOT NULL,
  max_players_per_nation INT,          -- NULL = unlimited (wildcard phases)
  free_transfers_per_matchday INT,   -- NULL = unlimited (wildcard)
  transfer_rollover_max INT DEFAULT 1,
  captain_twists_per_matchday INT,   -- NULL = unlimited
  manual_subs_per_matchday INT,      -- NULL = unlimited
  is_wildcard BOOLEAN DEFAULT FALSE,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MATCHES / FIXTURES
-- =============================================

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_match_id TEXT UNIQUE,
  home_team TEXT REFERENCES national_teams(code),
  away_team TEXT REFERENCES national_teams(code),
  kickoff_time TIMESTAMPTZ NOT NULL,
  home_score INT,
  away_score INT,
  stage TEXT NOT NULL,            -- 'Group', 'Round of 32', etc.
  matchday_number INT NOT NULL,   -- sequential across tournament
  phase_id TEXT REFERENCES tournament_phases(phase_id),
  is_completed BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TEAMS (fantasy squads)
-- =============================================

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL UNIQUE,
  budget_remaining DECIMAL(10,2) DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PLAYERS
-- =============================================

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('GK','DEF','MID','FWD')),
  national_team TEXT REFERENCES national_teams(code),
  -- Original auction
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  auction_price DECIMAL(10,2),
  is_sold BOOLEAN DEFAULT FALSE,
  -- MSA fields
  is_released BOOLEAN DEFAULT FALSE,
  released_at TIMESTAMPTZ,
  points_at_release DECIMAL(10,2) DEFAULT 0,
  msa_team_id UUID REFERENCES teams(id),
  msa_price DECIMAL(10,2),
  msa_points_from_matchday INT,    -- only count points from this matchday onward
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SQUAD SELECTIONS (starting XI + bench per matchday)
-- =============================================

CREATE TABLE IF NOT EXISTS squad_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  matchday_number INT NOT NULL,
  is_starting BOOLEAN DEFAULT TRUE,
  bench_order INT CHECK (bench_order BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, player_id, matchday_number)
);

-- =============================================
-- CAPTAIN ASSIGNMENTS
-- =============================================

CREATE TABLE IF NOT EXISTS captain_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  matchday_number INT NOT NULL,
  captain_player_id UUID REFERENCES players(id),
  vice_captain_player_id UUID REFERENCES players(id),
  unique_captains_count INT DEFAULT 1,
  manual_action_taken BOOLEAN DEFAULT FALSE,
  auto_sub_eligible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, matchday_number)
);

CREATE TABLE IF NOT EXISTS captain_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  matchday_number INT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('captain','vice_captain')),
  from_player_id UUID REFERENCES players(id),
  to_player_id UUID REFERENCES players(id),
  from_player_was_locked BOOLEAN DEFAULT FALSE,
  from_player_locked_score DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SUBSTITUTIONS
-- =============================================

CREATE TABLE IF NOT EXISTS substitution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  matchday_number INT NOT NULL,
  sub_type TEXT NOT NULL CHECK (sub_type IN ('manual','auto')),
  player_out_id UUID REFERENCES players(id),
  player_in_id UUID REFERENCES players(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TRANSFERS (between phases)
-- =============================================

CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_out_id UUID REFERENCES players(id),
  player_in_id UUID REFERENCES players(id),
  matchday_number INT NOT NULL,
  phase_id TEXT REFERENCES tournament_phases(phase_id),
  transfer_type TEXT DEFAULT 'free' CHECK (transfer_type IN ('free','wildcard')),
  price_paid DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transfer_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  matchday_number INT NOT NULL,
  phase_id TEXT REFERENCES tournament_phases(phase_id),
  free_transfers_available INT DEFAULT 1,
  free_transfers_used INT DEFAULT 0,
  banked_from_previous INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, matchday_number)
);

-- =============================================
-- PLAYER MATCH STATS
-- =============================================

CREATE TABLE IF NOT EXISTS player_match_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  -- Appearance
  minutes_played INT DEFAULT 0,
  -- Goals
  goals INT DEFAULT 0,
  own_goals INT DEFAULT 0,
  -- Assists & Chance Creation
  assists INT DEFAULT 0,
  big_chances_created INT DEFAULT 0,
  key_passes INT DEFAULT 0,
  accurate_crosses INT DEFAULT 0,
  penalties_won INT DEFAULT 0,
  -- Shooting
  shots_on_target INT DEFAULT 0,
  shots_off_target INT DEFAULT 0,
  woodwork_hits INT DEFAULT 0,
  big_chances_missed INT DEFAULT 0,
  penalties_missed INT DEFAULT 0,
  -- Dribbling & Possession
  successful_dribbles INT DEFAULT 0,
  dispossessed INT DEFAULT 0,
  accurate_long_balls INT DEFAULT 0,
  possession_lost INT DEFAULT 0,
  offsides INT DEFAULT 0,
  -- Passing
  accurate_passes INT DEFAULT 0,
  pass_accuracy DECIMAL(5,2) DEFAULT 0,
  -- Defensive (outfield)
  clearances INT DEFAULT 0,
  blocked_shots_defensive INT DEFAULT 0,
  interceptions INT DEFAULT 0,
  tackles_won INT DEFAULT 0,
  ground_duels_won INT DEFAULT 0,
  ground_duels_lost INT DEFAULT 0,
  aerial_duels_won INT DEFAULT 0,
  aerial_duels_lost INT DEFAULT 0,
  dribbled_past INT DEFAULT 0,
  -- Fouls
  fouls_drawn INT DEFAULT 0,
  fouls_committed INT DEFAULT 0,
  penalties_committed INT DEFAULT 0,
  errors_leading_to_goal INT DEFAULT 0,
  -- GK specific
  saves INT DEFAULT 0,
  penalty_saves INT DEFAULT 0,
  -- Clean sheet
  clean_sheet BOOLEAN DEFAULT FALSE,
  goals_conceded INT DEFAULT 0,
  -- Discipline
  yellow_cards INT DEFAULT 0,
  red_cards INT DEFAULT 0,
  -- Performance bonus (1=best, 2=second, 3=third)
  match_rating_rank INT CHECK (match_rating_rank IN (1,2,3)),
  -- Calculated
  base_fantasy_points DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, match_id)
);

-- =============================================
-- TEAM POINTS (aggregated per matchday)
-- =============================================

CREATE TABLE IF NOT EXISTS team_matchday_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  matchday_number INT NOT NULL,
  gross_points DECIMAL(10,2) DEFAULT 0,
  net_points DECIMAL(10,2) DEFAULT 0,   -- after captain 2x / vc 1.5x
  captain_bonus DECIMAL(10,2) DEFAULT 0,
  is_finalized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, matchday_number)
);

-- =============================================
-- MID-SEASON AUCTION (MSA)
-- =============================================

CREATE TABLE IF NOT EXISTS msa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_open BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  max_releases_per_team INT DEFAULT 3,
  current_player_id UUID REFERENCES players(id),
  auction_order JSONB DEFAULT '[]',      -- ordered list of player_ids to be auctioned
  current_item_index INT DEFAULT 0,
  timer_start TIMESTAMPTZ,
  timer_end TIMESTAMPTZ,                 -- 30s initial, reset to +15s on each new bid
  last_bid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS msa_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  msa_session_id UUID REFERENCES msa_sessions(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  points_at_release DECIMAL(10,2) DEFAULT 0,
  released_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id)
);

CREATE TABLE IF NOT EXISTS msa_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  msa_session_id UUID REFERENCES msa_sessions(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  is_winning BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- APP SETTINGS (global config flags)
-- =============================================

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE captain_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE captain_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE substitution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_match_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_matchday_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE msa_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE msa_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE msa_bids ENABLE ROW LEVEL SECURITY;

-- Everyone can read public data
CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read players" ON players FOR SELECT USING (true);
CREATE POLICY "Public read stats" ON player_match_stats FOR SELECT USING (true);
CREATE POLICY "Public read points" ON team_matchday_points FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read squad" ON squad_selections FOR SELECT USING (true);
CREATE POLICY "Public read captain" ON captain_assignments FOR SELECT USING (true);
CREATE POLICY "Public read msa" ON msa_sessions FOR SELECT USING (true);
CREATE POLICY "Public read msa_bids" ON msa_bids FOR SELECT USING (true);
CREATE POLICY "Public read transfers" ON transfers FOR SELECT USING (true);
CREATE POLICY "Public read transfer_alloc" ON transfer_allocations FOR SELECT USING (true);

-- Users can only mutate their own team's data
CREATE POLICY "Own team squad writes" ON squad_selections
  FOR ALL USING (
    team_id IN (SELECT id FROM teams WHERE user_id = auth.uid())
  );

CREATE POLICY "Own team captain writes" ON captain_assignments
  FOR ALL USING (
    team_id IN (SELECT id FROM teams WHERE user_id = auth.uid())
  );

CREATE POLICY "Own team captain log writes" ON captain_change_log
  FOR ALL USING (
    team_id IN (SELECT id FROM teams WHERE user_id = auth.uid())
  );

CREATE POLICY "Own team sub writes" ON substitution_log
  FOR ALL USING (
    team_id IN (SELECT id FROM teams WHERE user_id = auth.uid())
  );

CREATE POLICY "Own team transfer writes" ON transfers
  FOR ALL USING (
    team_id IN (SELECT id FROM teams WHERE user_id = auth.uid())
  );

CREATE POLICY "Own team msa releases" ON msa_releases
  FOR ALL USING (
    team_id IN (SELECT id FROM teams WHERE user_id = auth.uid())
  );

CREATE POLICY "Own team msa bids" ON msa_bids
  FOR ALL USING (
    team_id IN (SELECT id FROM teams WHERE user_id = auth.uid())
  );

-- Enable Realtime for MSA
ALTER PUBLICATION supabase_realtime ADD TABLE msa_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE msa_bids;
ALTER PUBLICATION supabase_realtime ADD TABLE player_match_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE team_matchday_points;
