const dynastyChemistryRules = [
  { players: ['MS Dhoni', 'Suresh Raina'], name: 'CSK Core', description: 'Dhoni and Raina bring the original Chennai title spine.' },
  { players: ['Virat Kohli', 'AB de Villiers'], name: 'RCB Firepower', description: 'Kohli and AB unlock elite chase pressure and 360-degree scoring.' },
  { players: ['Rohit Sharma', 'Jasprit Bumrah'], name: 'MI Dynasty', description: 'Rohit leadership plus Bumrah control mirrors Mumbai peak years.' },
  { players: ['Sunil Narine', 'Andre Russell'], name: 'KKR X-Factor', description: 'Narine and Russell give mystery spin and late-over destruction.' },
  { players: ['MS Dhoni', 'Ravindra Jadeja'], name: 'CSK Finishers', description: 'Dhoni and Jadeja add finishing nerve, fielding, and title memory.' },
  { players: ['David Warner', 'Rashid Khan'], name: 'SRH Golden Era', description: 'Warner tempo and Rashid control recreate Hyderabad balance.' },
  { players: ['Shubman Gill', 'Rashid Khan'], name: 'GT Rise', description: 'Gill and Rashid connect modern Gujarat structure and star power.' },
]

const dynastyBenchmarks = [
  { name: 'Chennai Super Kings 2011', batting: 82, bowling: 78, titles: 84, legacy: 90 },
  { name: 'Mumbai Indians 2020', batting: 90, bowling: 92, titles: 96, legacy: 95 },
  { name: 'Rajasthan Royals 2008', batting: 76, bowling: 74, titles: 74, legacy: 88 },
  { name: 'Gujarat Titans 2022', batting: 79, bowling: 84, titles: 76, legacy: 82 },
  { name: 'Kolkata Knight Riders 2024', batting: 88, bowling: 86, titles: 88, legacy: 87 },
]

export function clampScore(value) {
  return Math.max(0, Math.min(99, Math.round(value)))
}

export function getDynastyStats(selectedPlayers) {
  if (!selectedPlayers.length) {
    return {
      battingPower: 0,
      bowlingThreat: 0,
      leadership: 0,
      experience: 0,
      championshipDna: 0,
      flexibility: 0,
      legacy: 0,
      overseasPower: 0,
      matchWinning: 0,
      dynastyScore: 0,
      identity: 'Dream Team Loading',
      chemistry: [],
      totals: { runs: 0, wickets: 0, titles: 0, awards: 0 },
      comparisons: [],
    }
  }

  const selectedNames = new Set(selectedPlayers.map((player) => player.name))
  const totals = selectedPlayers.reduce(
    (total, player) => ({
      runs: total.runs + player.runs,
      wickets: total.wickets + player.wickets,
      titles: total.titles + player.championships,
      awards: total.awards + player.awards,
    }),
    { runs: 0, wickets: 0, titles: 0, awards: 0 },
  )
  const avg = (selector) => selectedPlayers.reduce((total, player) => total + selector(player), 0) / selectedPlayers.length
  const battingPower = clampScore(avg((player) => Math.min(99, player.runs / 85 + player.strikeRate / 2.4)))
  const bowlingThreat = clampScore(avg((player) => Math.min(99, player.wickets / 2.2 + (player.economy ? Math.max(0, 9.8 - player.economy) * 7 : 0))))
  const leadership = clampScore(avg((player) => player.leadership))
  const experience = clampScore(avg((player) => Math.min(99, player.runs / 110 + player.wickets / 3 + player.awards * 5)))
  const championshipDna = clampScore(Math.min(99, totals.titles * 4.2 + avg((player) => player.championships * 9)))
  const flexibility = clampScore(avg((player) => player.roles.length * 22 + (player.wicketkeeper ? 10 : 0)))
  const legacy = clampScore(avg((player) => player.legacy))
  const overseasPlayers = selectedPlayers.filter((player) => player.overseas)
  const overseasPower = clampScore(overseasPlayers.length ? avg((player) => (player.overseas ? player.legacy + player.strikeRate / 8 : 55)) : 42)
  const matchWinning = clampScore(avg((player) => player.legacy * 0.42 + player.awards * 4.2 + player.championships * 4.8))
  const chemistry = dynastyChemistryRules.filter((rule) => rule.players.every((playerName) => selectedNames.has(playerName)))
  const roleCounts = selectedPlayers.reduce((counts, player) => {
    player.roles.forEach((role) => {
      const key = role.toLowerCase()
      counts[key] = (counts[key] ?? 0) + 1
    })
    return counts
  }, {})
  const wicketkeepers = selectedPlayers.filter((player) => player.wicketkeeper).length
  const dynastyScore = clampScore(
    battingPower * 0.16 +
      bowlingThreat * 0.15 +
      leadership * 0.11 +
      experience * 0.11 +
      championshipDna * 0.14 +
      flexibility * 0.09 +
      legacy * 0.13 +
      overseasPower * 0.05 +
      matchWinning * 0.12 +
      chemistry.length * 2.5,
  )
  let identity = 'IPL Legends XI'
  if (wicketkeepers >= 4) identity = 'Keeper Chaos XI'
  else if ((roleCounts['all-rounder'] ?? 0) >= 5) identity = 'All-Rounder Army'
  else if ((roleCounts['spinner'] ?? 0) >= 3) identity = 'Spin Web XI'
  else if ((roleCounts['fast bowler'] ?? 0) >= 3) identity = 'Pace Attack XI'
  else if (overseasPlayers.length === 4 && overseasPower >= 86) identity = 'Overseas Powerhouse'
  else if (battingPower >= 86 && bowlingThreat < 78) identity = 'Batting Superteam'
  else if (bowlingThreat >= 86 && battingPower < 82) identity = 'Bowling Fortress'
  else if (leadership >= 88) identity = 'Captaincy Dynasty'
  else if (selectedPlayers.filter((player) => player.name.includes('Gill') || player.name.includes('Ruturaj') || player.name.includes('Rashid')).length >= 3) identity = 'Modern Era Superteam'

  const closest = dynastyBenchmarks
    .map((team) => ({
      ...team,
      distance:
        Math.abs(team.batting - battingPower) +
        Math.abs(team.bowling - bowlingThreat) +
        Math.abs(team.titles - championshipDna) +
        Math.abs(team.legacy - legacy),
    }))
    .sort((left, right) => left.distance - right.distance)[0]
  const weakerBatting = dynastyBenchmarks.filter((team) => battingPower > team.batting).sort((left, right) => right.batting - left.batting)[0]
  const weakerTitles = dynastyBenchmarks.filter((team) => championshipDna > team.titles).sort((left, right) => right.titles - left.titles)[0]

  return {
    battingPower,
    bowlingThreat,
    leadership,
    experience,
    championshipDna,
    flexibility,
    legacy,
    overseasPower,
    matchWinning,
    dynastyScore,
    identity,
    chemistry,
    totals,
    comparisons: [
      ['Comparable To', closest.name],
      ['Stronger Batting Than', weakerBatting?.name ?? 'Elite IPL benchmark'],
      ['More Championship DNA Than', weakerTitles?.name ?? 'Modern title challengers'],
    ],
  }
}

export const dynastyCategories = [
  ['all', 'All'],
  ['wicketkeepers', 'Wicketkeepers'],
  ['batters', 'Batters'],
  ['allrounders', 'All-Rounders'],
  ['bowlers', 'Bowlers'],
]

export const dynastySortOptions = [
  ['dynasty', 'Dream Team Score'],
  ['runs', 'IPL Runs'],
  ['wickets', 'IPL Wickets'],
  ['championships', 'Championships'],
  ['alpha', 'Alphabetical'],
]

export function getDynastyPlayerScore(player) {
  return clampScore(
    Math.min(30, player.runs / 260) +
      Math.min(30, player.wickets / 7) +
      player.championships * 4 +
      player.awards * 2 +
      player.leadership * 0.12 +
      player.legacy * 0.2 +
      (player.wicketkeeper ? 3 : 0),
  )
}

export function getDynastyCategory(player) {
  const roleText = player.roles.join(' ').toLowerCase()
  if (player.wicketkeeper) return 'wicketkeepers'
  if (roleText.includes('all-rounder')) return 'allrounders'
  if (roleText.includes('bowler') || roleText.includes('spinner')) return 'bowlers'
  return 'batters'
}
