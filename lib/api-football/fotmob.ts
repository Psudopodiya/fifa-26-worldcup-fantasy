// =============================================
// FotMob Unofficial JSON API — Match Data Parser
// No API key required. Endpoint: fotmob.com/api/matchDetails?matchId=XXX
// Find match IDs in the URL when viewing any match on fotmob.com
// =============================================

export interface FotMobPlayerStats {
  player_id:              string
  player_name:            string
  position:               string   // raw from FotMob
  minutes_played:         number
  goals:                  number
  own_goals:              number
  assists:                number
  big_chances_created:    number
  key_passes:             number
  accurate_crosses:       number
  penalties_won:          number
  shots_on_target:        number
  shots_off_target:       number
  woodwork_hits:          number
  big_chances_missed:     number
  penalties_missed:       number
  successful_dribbles:    number
  dispossessed:           number
  accurate_long_balls:    number
  possession_lost:        number
  offsides:               number
  accurate_passes:        number
  pass_accuracy:          number
  clearances:             number
  blocked_shots_defensive:number
  interceptions:          number
  tackles_won:            number
  ground_duels_won:       number
  ground_duels_lost:      number
  aerial_duels_won:       number
  aerial_duels_lost:      number
  dribbled_past:          number
  fouls_drawn:            number
  fouls_committed:        number
  penalties_committed:    number
  errors_leading_to_goal: number
  saves:                  number
  penalty_saves:          number
  clean_sheet:            boolean
  goals_conceded:         number
  yellow_cards:           number
  red_cards:              number
  match_rating:           number | null
}

/** Safely grab a numeric stat from FotMob's nested stats array */
function getStat(stats: any[], key: string): number {
  const entry = stats?.find((s: any) =>
    s?.key === key || s?.title?.toLowerCase() === key.toLowerCase()
  )
  return entry?.value?.total ?? entry?.value ?? 0
}

/** Parse a single player's lineupElement from FotMob matchDetails response */
function parsePlayer(p: any, goalsAgainst: number): FotMobPlayerStats {
  const stats  = p?.stats?.flatMap((group: any) => group?.stats ?? []) ?? []
  const rating = p?.ratingProps?.num ?? null

  const minutesPlayed = p?.timeSubbedIn
    ? (p?.minutesPlayed ?? getStat(stats, 'minutesPlayed'))
    : (p?.minutesPlayed ?? 0)

  const cleanSheet = goalsAgainst === 0 && (minutesPlayed >= 60)

  return {
    player_id:               String(p.id ?? p.playerId ?? ''),
    player_name:             p.name ?? p.shortName ?? '',
    position:                p.role ?? p.positionStringShort ?? '',
    minutes_played:          minutesPlayed,
    goals:                   getStat(stats, 'goals'),
    own_goals:               getStat(stats, 'ownGoals'),
    assists:                 getStat(stats, 'goalAssist'),
    big_chances_created:     getStat(stats, 'bigChanceCreated'),
    key_passes:              getStat(stats, 'keyPass'),
    accurate_crosses:        getStat(stats, 'accurateCross'),
    penalties_won:           getStat(stats, 'penaltyWon'),
    shots_on_target:         getStat(stats, 'onTargetScoringAttempt'),
    shots_off_target:        getStat(stats, 'missedShots'),
    woodwork_hits:           getStat(stats, 'hitWoodwork'),
    big_chances_missed:      getStat(stats, 'bigChanceMissed'),
    penalties_missed:        getStat(stats, 'penaltyMiss'),
    successful_dribbles:     getStat(stats, 'wonContest'),
    dispossessed:            getStat(stats, 'dispossessed'),
    accurate_long_balls:     getStat(stats, 'accurateLongBalls'),
    possession_lost:         getStat(stats, 'possessionLostCtrl'),
    offsides:                getStat(stats, 'offsideGiven'),
    accurate_passes:         getStat(stats, 'accuratePass'),
    pass_accuracy:           getStat(stats, 'passAccuracy'),
    clearances:              getStat(stats, 'totalClearance'),
    blocked_shots_defensive: getStat(stats, 'outfielderBlock'),
    interceptions:           getStat(stats, 'interceptionWon'),
    tackles_won:             getStat(stats, 'wonTackle'),
    ground_duels_won:        getStat(stats, 'groundDuelWon'),
    ground_duels_lost:       getStat(stats, 'groundDuelLost'),
    aerial_duels_won:        getStat(stats, 'aerialWon'),
    aerial_duels_lost:       getStat(stats, 'aerialLost'),
    dribbled_past:           getStat(stats, 'challengeLost'),
    fouls_drawn:             getStat(stats, 'foulGiven'),
    fouls_committed:         getStat(stats, 'foulCommitted'),
    penalties_committed:     getStat(stats, 'penaltyConceded'),
    errors_leading_to_goal:  getStat(stats, 'errorLeadToGoal'),
    saves:                   getStat(stats, 'savedShotsFromInsideTheBox') + getStat(stats, 'savedShotsFromOutsideTheBox'),
    penalty_saves:           getStat(stats, 'penaltySave'),
    clean_sheet:             cleanSheet,
    goals_conceded:          goalsAgainst,
    yellow_cards:            getStat(stats, 'yellowCard'),
    red_cards:               getStat(stats, 'redCard'),
    match_rating:            rating ? parseFloat(rating) : null,
  }
}

export interface FotMobMatchData {
  match_id:   string
  home_team:  string
  away_team:  string
  home_score: number
  away_score: number
  players:    FotMobPlayerStats[]
}

/** Fetch and parse a complete match from FotMob */
export async function fetchFotMobMatch(fotmobMatchId: string): Promise<FotMobMatchData> {
  const url = `https://www.fotmob.com/api/matchDetails?matchId=${fotmobMatchId}`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; fantasy-bot/1.0)',
    },
    next: { revalidate: 0 },
  })

  if (!res.ok) throw new Error(`FotMob fetch failed: ${res.status}`)

  const data = await res.json()

  const header     = data?.header
  const homeScore  = header?.teams?.[0]?.score ?? 0
  const awayScore  = header?.teams?.[1]?.score ?? 0
  const homeTeam   = header?.teams?.[0]?.name ?? ''
  const awayTeam   = header?.teams?.[1]?.name ?? ''

  const lineup = data?.content?.lineup?.lineup ?? []
  const allPlayers: FotMobPlayerStats[] = []

  for (const team of lineup) {
    const isHome       = lineup.indexOf(team) === 0
    const goalsAgainst = isHome ? awayScore : homeScore
    const teamPlayers  = [
      ...(team?.players?.flat() ?? []),
      ...(team?.bench ?? []),
    ]
    for (const p of teamPlayers) {
      if (!p?.id && !p?.playerId) continue
      allPlayers.push(parsePlayer(p, goalsAgainst))
    }
  }

  // Assign match rating ranks (top 3 by rating)
  const rated = allPlayers
    .filter(p => p.match_rating !== null)
    .sort((a, b) => (b.match_rating ?? 0) - (a.match_rating ?? 0))

  if (rated[0]) rated[0].match_rating = 1  // repurpose field as rank — handled in sync route

  return {
    match_id:   fotmobMatchId,
    home_team:  homeTeam,
    away_team:  awayTeam,
    home_score: homeScore,
    away_score: awayScore,
    players:    allPlayers,
  }
}

/** Return top-3 rated player IDs from a parsed match */
export function getTopRatedPlayerIds(players: FotMobPlayerStats[]): string[] {
  return players
    .filter(p => p.match_rating !== null && p.minutes_played > 0)
    .sort((a, b) => (b.match_rating ?? 0) - (a.match_rating ?? 0))
    .slice(0, 3)
    .map(p => p.player_id)
}
