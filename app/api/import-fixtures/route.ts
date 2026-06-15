import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── FotMob name → our DB country code ──────────────────────────────────────
const TEAM_CODE: Record<string, string> = {
  Argentina:                  'ARG',
  Australia:                  'AUS',
  Austria:                    'AUT',
  Belgium:                    'BEL',
  'Bosnia and Herzegovina':   'BIH',
  Brazil:                     'BRA',
  Canada:                     'CAN',
  'Cape Verde':               'CPV',
  Colombia:                   'COL',
  Croatia:                    'CRO',
  Curacao:                    'CUW',
  Czechia:                    'CZE',
  'DR Congo':                 'COD',
  Ecuador:                    'ECU',
  Egypt:                      'EGY',
  England:                    'ENG',
  France:                     'FRA',
  Germany:                    'GER',
  Ghana:                      'GHA',
  Haiti:                      'HAI',
  Iran:                       'IRN',
  Iraq:                       'IRQ',
  'Ivory Coast':              'CIV',
  Japan:                      'JPN',
  Jordan:                     'JOR',
  'Saudi Arabia':             'KSA',
  'South Korea':              'KOR',
  Mexico:                     'MEX',
  Morocco:                    'MAR',
  Netherlands:                'NED',
  'New Zealand':              'NZL',
  Norway:                     'NOR',
  Panama:                     'PAN',
  Paraguay:                   'PAR',
  Portugal:                   'POR',
  Qatar:                      'QAT',
  'South Africa':             'RSA',
  Scotland:                   'SCO',
  Senegal:                    'SEN',
  Spain:                      'ESP',
  Sweden:                     'SWE',
  Switzerland:                'SUI',
  Tunisia:                    'TUN',
  Turkiye:                    'TUR',
  Uruguay:                    'URU',
  USA:                        'USA',
  Uzbekistan:                 'UZB',
}

// ── FotMob name → flag emoji ────────────────────────────────────────────────
const FLAG: Record<string, string> = {
  Argentina:                  '🇦🇷',
  Australia:                  '🇦🇺',
  Austria:                    '🇦🇹',
  Belgium:                    '🇧🇪',
  'Bosnia and Herzegovina':   '🇧🇦',
  Brazil:                     '🇧🇷',
  Canada:                     '🇨🇦',
  'Cape Verde':               '🇨🇻',
  Colombia:                   '🇨🇴',
  Croatia:                    '🇭🇷',
  Curacao:                    '🇨🇼',
  Czechia:                    '🇨🇿',
  'DR Congo':                 '🇨🇩',
  Ecuador:                    '🇪🇨',
  Egypt:                      '🇪🇬',
  England:                    '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  France:                     '🇫🇷',
  Germany:                    '🇩🇪',
  Ghana:                      '🇬🇭',
  Haiti:                      '🇭🇹',
  Iran:                       '🇮🇷',
  Iraq:                       '🇮🇶',
  'Ivory Coast':              '🇨🇮',
  Japan:                      '🇯🇵',
  Jordan:                     '🇯🇴',
  'Saudi Arabia':             '🇸🇦',
  'South Korea':              '🇰🇷',
  Mexico:                     '🇲🇽',
  Morocco:                    '🇲🇦',
  Netherlands:                '🇳🇱',
  'New Zealand':              '🇳🇿',
  Norway:                     '🇳🇴',
  Panama:                     '🇵🇦',
  Paraguay:                   '🇵🇾',
  Portugal:                   '🇵🇹',
  Qatar:                      '🇶🇦',
  'South Africa':             '🇿🇦',
  Scotland:                   '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  Senegal:                    '🇸🇳',
  Spain:                      '🇪🇸',
  Sweden:                     '🇸🇪',
  Switzerland:                '🇨🇭',
  Tunisia:                    '🇹🇳',
  Turkiye:                    '🇹🇷',
  Uruguay:                    '🇺🇾',
  USA:                        '🇺🇸',
  Uzbekistan:                 '🇺🇿',
}

// ── FotMob round → stage / phase / matchday ─────────────────────────────────
function roundInfo(round: string): { stage: string; phaseId: string; matchday: number } {
  switch (round) {
    case '1':      return { stage: 'Group Stage',  phaseId: 'PHASE_01', matchday: 1 }
    case '2':      return { stage: 'Group Stage',  phaseId: 'PHASE_01', matchday: 2 }
    case '3':      return { stage: 'Group Stage',  phaseId: 'PHASE_01', matchday: 3 }
    case '1/16':   return { stage: 'Round of 32',  phaseId: 'PHASE_02', matchday: 4 }
    case '1/8':    return { stage: 'Round of 16',  phaseId: 'PHASE_03', matchday: 5 }
    case '1/4':    return { stage: 'Quarter-Final', phaseId: 'PHASE_04', matchday: 6 }
    case '1/2':    return { stage: 'Semi-Final',   phaseId: 'PHASE_05', matchday: 7 }
    case 'bronze': return { stage: '3rd Place',    phaseId: 'PHASE_06', matchday: 8 }
    case 'final':  return { stage: 'Final',        phaseId: 'PHASE_06', matchday: 9 }
    default:       return { stage: round,          phaseId: 'PHASE_01', matchday: 1 }
  }
}

export async function POST(req: NextRequest) {
  // Admin auth
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── 1. Fetch from FotMob ──────────────────────────────────────────────────
  let fotmobData: any
  try {
    const res = await fetch('https://www.fotmob.com/api/data/leagues?id=77', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 0 },
    })
    if (!res.ok) throw new Error(`FotMob returned ${res.status}`)
    fotmobData = await res.json()
  } catch (e: any) {
    return NextResponse.json({ error: `Failed to fetch FotMob: ${e.message}` }, { status: 502 })
  }

  const allMatches: any[] = fotmobData?.fixtures?.allMatches ?? []
  if (allMatches.length === 0) {
    return NextResponse.json({ error: 'No matches found in FotMob response' }, { status: 500 })
  }

  // ── 2. Collect real teams (skip placeholder "1A", "2B", "1C/2F" etc.) ─────
  const teamMap = new Map<string, { group: string }>() // name → group letter
  for (const m of allMatches) {
    const group = m.group ?? ''
    if (m.home?.name && TEAM_CODE[m.home.name]) {
      teamMap.set(m.home.name, { group })
    }
    if (m.away?.name && TEAM_CODE[m.away.name]) {
      teamMap.set(m.away.name, { group })
    }
  }

  // ── 3. Upsert national_teams ──────────────────────────────────────────────
  const teamRows = Array.from(teamMap.entries()).map(([name, { group }]) => ({
    code: TEAM_CODE[name],
    name,
    flag_emoji: FLAG[name] ?? '🏳️',
    group_name: group ? `Group ${group}` : null,
  }))

  const { error: teamErr } = await supabase
    .from('national_teams')
    .upsert(teamRows, { onConflict: 'code' })

  if (teamErr) {
    return NextResponse.json({ error: `national_teams upsert failed: ${teamErr.message}` }, { status: 500 })
  }

  // ── 4. Build match rows (only where both teams are resolved) ──────────────
  const matchRows: any[] = []
  let skipped = 0

  for (const m of allMatches) {
    const homeCode = TEAM_CODE[m.home?.name]
    const awayCode = TEAM_CODE[m.away?.name]

    if (!homeCode || !awayCode) {
      skipped++
      continue // knockout TBD slot — skip for now
    }

    const { stage, phaseId, matchday } = roundInfo(m.round ?? '')
    const kickoff = m.status?.utcTime ?? null
    if (!kickoff) { skipped++; continue }

    matchRows.push({
      api_match_id: String(m.id),
      home_team: homeCode,
      away_team: awayCode,
      kickoff_time: kickoff,              // stored as UTC
      stage,
      matchday_number: matchday,
      phase_id: phaseId,
      is_completed: m.status?.finished === true,
      home_score: m.status?.scoreStr
        ? parseInt(m.status.scoreStr.split('-')[0].trim(), 10) || null
        : null,
      away_score: m.status?.scoreStr
        ? parseInt(m.status.scoreStr.split('-')[1]?.trim(), 10) || null
        : null,
    })
  }

  // ── 5. Upsert matches ─────────────────────────────────────────────────────
  // Batch in chunks of 50 to avoid request limits
  let imported = 0
  for (let i = 0; i < matchRows.length; i += 50) {
    const chunk = matchRows.slice(i, i + 50)
    const { error: matchErr } = await supabase
      .from('matches')
      .upsert(chunk, { onConflict: 'api_match_id' })

    if (matchErr) {
      return NextResponse.json({
        error: `matches upsert failed at row ${i}: ${matchErr.message}`,
        imported,
      }, { status: 500 })
    }
    imported += chunk.length
  }

  return NextResponse.json({
    message: `Imported ${imported} fixtures, skipped ${skipped} TBD knockout slots, upserted ${teamRows.length} national teams.`,
    imported,
    skipped,
    teams: teamRows.length,
  })
}
