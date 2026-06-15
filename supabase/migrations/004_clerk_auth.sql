-- ============================================================
-- 004_clerk_auth.sql
-- Switch from Supabase Auth to Clerk
-- ============================================================
-- Clerk user IDs look like "user_2abc123xyz" (text, not uuid)

-- 1. Drop the FK constraint that references auth.users
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_user_id_fkey;

-- 2. Change teams.user_id from UUID to TEXT
--    (cast existing UUIDs to text, harmless for rows with no real auth user)
ALTER TABLE teams ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- 3. Disable RLS on all writable tables
--    Supabase RLS uses auth.uid() which only works with Supabase Auth.
--    For a private 6-user app, disabling RLS is safe.
ALTER TABLE teams                DISABLE ROW LEVEL SECURITY;
ALTER TABLE players              DISABLE ROW LEVEL SECURITY;
ALTER TABLE squad_selections     DISABLE ROW LEVEL SECURITY;
ALTER TABLE captain_assignments  DISABLE ROW LEVEL SECURITY;
ALTER TABLE captain_change_log   DISABLE ROW LEVEL SECURITY;
ALTER TABLE transfers            DISABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE national_teams       DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches              DISABLE ROW LEVEL SECURITY;
ALTER TABLE player_match_stats   DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_matchday_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings         DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_phases    DISABLE ROW LEVEL SECURITY;

-- Tables that may not exist yet — wrapped in DO blocks for safety
DO $$ BEGIN
  ALTER TABLE msa_sessions     DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE msa_bids         DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE msa_results      DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
