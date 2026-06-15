# FIFA Fantasy 2026 — Deployment Guide

## Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free)
- A [Vercel](https://vercel.com) account (free)
- A [GitHub](https://github.com) account (free)

---

## Step 1 — Supabase Setup

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name it `fifa-fantasy-2026`, choose a region close to your users, set a DB password
3. Once created, go to **SQL Editor** and run both migration files in order:
   - Paste and run `supabase/migrations/001_schema.sql`
   - Paste and run `supabase/migrations/002_seed.sql`
4. Go to **Settings → API** and copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)
5. Go to **Authentication → Email Templates** and customize the invite + password reset emails if you like

### Enable Realtime (for MSA live auction)
Go to **Database → Replication** and enable replication for:
- `msa_sessions`
- `msa_bids`
- `player_match_stats`
- `team_matchday_points`

---

## Step 2 — Add Users (Invite Your League)

For each participant:
1. Supabase Dashboard → **Authentication → Users → Invite user**
2. Enter their email — they'll get an invite link to set their password
3. Once they've signed up, go to the app's **Admin panel → Assign Teams** and link their email to their fantasy team

You can also manually set an initial password:
- In Supabase → Users → click the user → **Send password recovery email**
- Or set one directly: Users → click user → **Reset Password**

---

## Step 3 — Deploy to Vercel

1. Push this project to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create fifa-fantasy-2026 --private --push
   ```
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import the GitHub repo
3. In the **Environment Variables** section, add:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
   | `ADMIN_SECRET` | Any random string (e.g. `wc2026admin!`) — keep this private |
   | `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g. `https://fifa-fantasy-2026.vercel.app`) |

4. Click **Deploy** — Vercel builds and publishes automatically
5. Share the Vercel URL with your league

---

## Step 4 — Import All Fixtures (Automatic)

In the **Admin panel**, click **"Import All WC2026 Fixtures"**.

This fetches all 104 WC2026 matches directly from FotMob, creates all 48 national teams, and
bulk-inserts fixtures in one click. Kickoff times are stored as UTC and shown in IST (India Standard Time)
everywhere in the app. Safe to run again — existing fixtures are updated, not duplicated.

> For knockout matches where teams are still TBD (e.g. "Winner Group A"), those slots are skipped
> and picked up automatically on the next re-import once the group stage concludes.

---

## Step 5 — Syncing Match Results (FotMob)

After each match finishes:
1. Go to [fotmob.com](https://fotmob.com) and open the match
2. Copy the match ID from the URL: `fotmob.com/match/XXXXXXX` → the number is the ID
3. In the **Admin panel → Sync Match from FotMob**, select the match and paste the FotMob ID
4. Click **Sync Scores** — stats are fetched, points calculated, leaderboard updated

> ⚡ Do this once per completed match. Takes about 5 seconds.

---

## Step 6 — Mid-Season Auction (MSA)

When it's time for the MSA:
1. In Supabase SQL Editor, create the MSA session:
   ```sql
   INSERT INTO msa_sessions (is_open, max_releases_per_team, auction_order)
   VALUES (
     false,
     3,  -- teams can release up to 3 players
     '[]'::jsonb  -- admin will fill the auction order of player IDs
   );
   ```
2. Let teams release players via their Squad page (add a release button — coming in next update)
3. Build the `auction_order` array of player IDs (released + unsold pool)
4. Update the session: `UPDATE msa_sessions SET is_open = true, auction_order = '[...]', current_player_id = 'first_player_uuid', timer_end = NOW() + interval '30 seconds';`
5. All participants open the **Auction (MSA)** page — the live bidding begins

---

## Captain System — Quick Reference

| Phase | Captain Twists/MD | Manual Subs/MD |
|-------|-------------------|----------------|
| Group Stage | 2 (max 3 unique captains) | 3 |
| Round of 32 | Unlimited (Wildcard) | Unlimited |
| Round of 16+ | Unlimited | Unlimited |

**Locking rules**: A player locks at kickoff. Armband can leave a locked player (score doubles and finalizes) but cannot arrive at one. Red card = armband frozen for the matchday.

---

## Local Development

```bash
cp .env.local.example .env.local
# Fill in your Supabase keys

npm install
npm run dev
# Open http://localhost:3000
```

---

## File Structure

```
fifa-fantasy-2026/
├── app/
│   ├── (auth)/         # login, forgot-password, update-password
│   ├── (dashboard)/    # all user-facing pages
│   │   ├── page.tsx    # dashboard
│   │   ├── leaderboard/
│   │   ├── squad/      # starting XI + bench + captain
│   │   ├── transfers/
│   │   ├── teams/
│   │   ├── players/    # player pool
│   │   ├── fixtures/
│   │   └── msa/        # live Mid-Season Auction
│   ├── admin/          # admin panel
│   └── api/
│       └── sync-scores/  # FotMob sync endpoint
├── lib/
│   ├── supabase/       # client + server Supabase helpers
│   ├── scoring/        # points calculator (all 33 stats)
│   └── api-football/   # FotMob JSON parser
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql   # full DB schema
│       └── 002_seed.sql     # 6 teams + all players + unsold pool
└── DEPLOY.md           # this file
```
