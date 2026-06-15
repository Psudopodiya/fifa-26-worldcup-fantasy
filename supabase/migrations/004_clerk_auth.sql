-- ============================================================
-- 004_clerk_auth.sql
-- Switch from Supabase Auth to Clerk
-- ============================================================

-- Step 1: Drop ALL RLS policies (they reference auth.uid() / user_id)
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Step 2: Disable RLS on all tables
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

DO $$ BEGIN ALTER TABLE msa_sessions  DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE msa_bids      DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE msa_results   DISABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Step 3: Drop the FK constraint on teams.user_id (references auth.users)
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_user_id_fkey;

-- Step 4: Change teams.user_id from UUID to TEXT
--         Clerk IDs look like "user_2abc123xyz"
ALTER TABLE teams ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
