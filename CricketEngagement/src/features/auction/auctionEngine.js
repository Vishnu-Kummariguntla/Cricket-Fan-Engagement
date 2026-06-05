import { getFranchiseProfile } from './botStrategies'
import { getAuctionSalaryAnchor } from './auctionSalaryData'

const activePlayerNames = new Set([
  'Virat Kohli',
  'MS Dhoni',
  'Rohit Sharma',
  'Jasprit Bumrah',
  'Hardik Pandya',
  'Shubman Gill',
  'Ruturaj Gaikwad',
  'Ishan Kishan',
  'Abhishek Sharma',
  'Arshdeep Singh',
  'Yashasvi Jaiswal',
  'Rinku Singh',
  'Sanju Samson',
  'Suryakumar Yadav',
  'Rashid Khan',
  'Andre Russell',
  'Sunil Narine',
  'Ravindra Jadeja',
  'KL Rahul',
  'Jos Buttler',
  'Kuldeep Yadav',
  'Mohammed Shami',
  'Bhuvneshwar Kumar',
  'Varun Chakravarthy',
  'Tilak Varma',
  'Shivam Dube',
  'Nitish Kumar Reddy',
  'Rishabh Pant',
  'Pat Cummins',
  'Travis Head',
  'Heinrich Klaasen',
  'Phil Salt',
  'Jitesh Sharma',
  'Sai Sudharsan',
  'Ravi Bishnoi',
  'T. Natarajan',
  'T Natarajan',
  'Avesh Khan',
  'Harshit Rana',
])

const marqueePlayers = new Set([
  'Virat Kohli',
  'MS Dhoni',
  'Rohit Sharma',
  'Jasprit Bumrah',
  'Hardik Pandya',
  'Shubman Gill',
  'Rashid Khan',
  'Rishabh Pant',
  'Suryakumar Yadav',
  'Pat Cummins',
  'Travis Head',
  'Jos Buttler',
  'Sunil Narine',
  'Andre Russell',
  'Ravindra Jadeja',
])

const recentAuctionValueCr = {
  'Mitchell Starc': 24.75,
  'Pat Cummins': 20.5,
  'Rishabh Pant': 27,
  'Shreyas Iyer': 26.75,
  'Cameron Green': 25.2,
  'Arshdeep Singh': 18,
  'Yuzvendra Chahal': 18,
  'Jos Buttler': 15.75,
  'Daryl Mitchell': 14,
  'Kartik Sharma': 14.2,
  'Prashant Veer': 14.2,
  'Harshal Patel': 11.75,
  'Phil Salt': 11.5,
  'Ishan Kishan': 11.25,
  'Jitesh Sharma': 11,
  'Bhuvneshwar Kumar': 10.75,
  'Noor Ahmad': 10,
  'Ravichandran Ashwin': 9.75,
  'Deepak Chahar': 9.25,
  'Liam Livingstone': 8.75,
  'Akash Deep': 8,
  'Kagiso Rabada': 10.75,
  'Marco Jansen': 7,
  'Travis Head': 6.8,
  'Harry Brook': 6.25,
  'Tushar Deshpande': 6.5,
  'Krunal Pandya': 5.75,
  'Rahul Chahar': 5.2,
  'Wanindu Hasaranga': 5.25,
  'Gerald Coetzee': 5,
  'Allah Ghazanfar': 4.8,
  'Maheesh Theekshana': 4.4,
  'Nitish Rana': 4.2,
  'Shardul Thakur': 4,
  'Quinton de Kock': 3.6,
  'Rahul Tripathi': 3.4,
  'Washington Sundar': 3.2,
  'Abhinav Manohar': 3.2,
  'Angkrish Raghuvanshi': 3,
  'Sam Curran': 2.4,
  'Adam Milne': 2.4,
  'Mohit Sharma': 2.2,
  'Faf du Plessis': 2,
  'David Miller': 2,
  'Kyle Jamieson': 2,
  'Rachin Ravindra': 2,
  'Lockie Ferguson': 2,
  'Rovman Powell': 1.5,
  'Ajinkya Rahane': 1.5,
  'Prithvi Shaw': 0.75,
}

const retainedMarketValueCr = {
  'Heinrich Klaasen': 23,
  'Virat Kohli': 21,
  'Nicholas Pooran': 21,
  'Rashid Khan': 18,
  'Ruturaj Gaikwad': 18,
  'Ravindra Jadeja': 18,
  'Jasprit Bumrah': 18,
  'Sanju Samson': 18,
  'Hardik Pandya': 16.35,
  'Rohit Sharma': 16.3,
  'Suryakumar Yadav': 16.35,
  'Shubman Gill': 16.5,
  'Axar Patel': 16.5,
  'KL Rahul': 14,
  'Kuldeep Yadav': 13.25,
  'Rinku Singh': 13,
  'Sunil Narine': 12,
  'Andre Russell': 12,
  'Abhishek Sharma': 14,
  'Tilak Varma': 8,
  'Yashasvi Jaiswal': 18,
  'MS Dhoni': 4,
}

const recentFormRatings = {
  'Virat Kohli': 98,
  'Sai Sudharsan': 97,
  'Shubman Gill': 94,
  'Rajat Patidar': 93,
  'Suryakumar Yadav': 92,
  'Yashasvi Jaiswal': 91,
  'Abhishek Sharma': 91,
  'Travis Head': 90,
  'Rishabh Pant': 89,
  'Shreyas Iyer': 89,
  'Jasprit Bumrah': 96,
  'Varun Chakaravarthy': 94,
  'Prasidh Krishna': 91,
  'Arshdeep Singh': 90,
  'Josh Hazlewood': 90,
  'Yuzvendra Chahal': 88,
  'Rashid Khan': 88,
  'Ravindra Jadeja': 88,
  'Sunil Narine': 88,
  'Hardik Pandya': 87,
  'Bhuvneshwar Kumar': 86,
  'Phil Salt': 86,
}

export const initialPurse = 120
export const maxSquadSize = 18
export const maxOverseasPlayers = 8

export function formatCrores(value) {
  return `₹${value.toFixed(value % 1 === 0 ? 0 : 1)}Cr`
}

function hashName(name) {
  return [...name].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 9973, 17)
}

function normalizeRole(role) {
  if (role === 'keeper') return 'Wicketkeeper'
  if (role === 'allrounder') return 'All-rounder'
  if (role === 'bowler') return 'Bowler'
  return 'Batter'
}

function isOverseas(nationality) {
  return nationality !== 'India'
}

function getRecentMarketValue(name) {
  return getAuctionSalaryAnchor(name)?.salaryCr ?? recentAuctionValueCr[name] ?? retainedMarketValueCr[name] ?? 0
}

function getSalaryAnchoredMarketValue(anchorValue, ratingMarketValue, basePrice) {
  if (!anchorValue) return ratingMarketValue

  const qualityAdjustment = Math.max(-0.6, Math.min(1.2, (ratingMarketValue - anchorValue) * 0.12))
  const softCeiling = anchorValue >= 12 ? anchorValue * 1.12 : anchorValue >= 5 ? anchorValue * 1.16 : anchorValue * 1.25
  return Math.max(basePrice, Math.min(softCeiling, anchorValue + qualityAdjustment))
}

function getBasePrice(name, overseas, anchorValue) {
  if (anchorValue) {
    if (anchorValue <= 0.5) return 0.3
    if (anchorValue <= 1) return 0.5
  }

  return marqueePlayers.has(name) ? 2 : overseas ? 1.5 : 1
}

function getAuctionCategory(player) {
  if (player.role === 'bowler') return 'bowler'
  if (player.role === 'allrounder') return 'allrounder'
  return 'batter'
}

function shufflePlayers(players) {
  return players
    .map((player) => ({ player, sortKey: Math.random() }))
    .sort((left, right) => left.sortKey - right.sortKey)
    .map(({ player }) => player)
}

export function createAuctionPlayerQueue(players) {
  const categoryOrder = ['batter', 'bowler', 'allrounder']

  return categoryOrder.flatMap((category) => shufflePlayers(players.filter((player) => getAuctionCategory(player) === category)))
}

function getRecentFormRating(name, formRating, salaryAnchor, recentMarketValue) {
  const directRating = recentFormRatings[name]
  if (directRating) return directRating

  const salarySignal = salaryAnchor?.salaryCr ?? recentMarketValue
  if (salarySignal >= 16) return Math.min(99, formRating + 14)
  if (salarySignal >= 10) return Math.min(96, formRating + 10)
  if (salarySignal >= 5) return Math.min(92, formRating + 6)
  if (salaryAnchor?.status?.toLowerCase().includes('2026 auction sold')) return Math.min(90, formRating + 8)
  return formRating
}

function getRecentFormMultiplier(player) {
  if (!player.recentFormRating) return 1
  if (player.recentFormRating >= 94) return 1.12
  if (player.recentFormRating >= 90) return 1.08
  if (player.recentFormRating >= 86) return 1.05
  if (player.recentFormRating >= 80) return 1.02
  return 1
}

export function createAuctionPlayers(iplTeams, featuredAnimations = {}, cricketerProfiles = []) {
  const profileNames = new Set(cricketerProfiles.map((profile) => profile.name))
  const featuredNames = new Set(Object.values(featuredAnimations).map((player) => player.name))
  const byName = new Map()

  iplTeams.forEach((team) => {
    team.players.forEach(([name, nationality, role]) => {
      const salaryAnchor = getAuctionSalaryAnchor(name)
      if (!activePlayerNames.has(name) && !profileNames.has(name) && !featuredNames.has(name) && !salaryAnchor) return
      if (byName.has(name)) return

      const hash = hashName(name)
      const hasCareerStory = featuredNames.has(name)
      const hasProfile = profileNames.has(name)
      const starBoost = marqueePlayers.has(name) ? 18 : hasCareerStory ? 12 : hasProfile ? 8 : 0
      const roleLabel = normalizeRole(role)
      const overseas = isOverseas(nationality)
      const starRating = Math.min(99, 58 + (hash % 19) + starBoost + (team.captain === name ? 5 : 0))
      const formRating = Math.min(99, 55 + ((hash * 7) % 34) + (activePlayerNames.has(name) ? 4 : 0))
      const legacyRating = Math.min(99, 52 + ((hash * 13) % 28) + starBoost + (hasCareerStory ? 7 : 0))
      const scarcityBoost = role === 'keeper' ? 1.4 : role === 'allrounder' ? 1.1 : role === 'bowler' ? 0.8 : 0
      const basePrice = getBasePrice(name, overseas, salaryAnchor?.salaryCr)
      const ratingMarketValue = Math.min(
        28,
        Math.max(1.5, basePrice + starRating * 0.12 + formRating * 0.055 + legacyRating * 0.05 + scarcityBoost),
      )
      const recentMarketValue = getRecentMarketValue(name)
      const estimatedMarketValue = recentMarketValue
        ? getSalaryAnchoredMarketValue(recentMarketValue, ratingMarketValue, basePrice)
        : ratingMarketValue
      const recentFormRating = getRecentFormRating(name, formRating, salaryAnchor, recentMarketValue)

      byName.set(name, {
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        name,
        role,
        roleLabel,
        nationality,
        iplTeamId: team.id,
        iplTeam: team.shortName,
        basePrice,
        estimatedMarketValue: Number(estimatedMarketValue.toFixed(1)),
        recentMarketValue,
        salaryAnchor,
        starRating,
        formRating,
        recentFormRating,
        legacyRating,
        overseas,
        hasCareerStory,
        summary: `${roleLabel} for ${team.shortName} with a ${starRating} star rating and ${recentFormRating} recent form rating.`,
      })
    })
  })

  return [...byName.values()]
}

export function createAuctionTeams(iplTeams, userTeamId) {
  return iplTeams.map((team) => ({
    ...team,
    profile: getFranchiseProfile(team.id),
    purse: initialPurse,
    squad: [],
    lastPurchase: null,
    userControlled: team.id === userTeamId,
    biddingStatus: team.id === userTeamId ? 'Your table' : 'Waiting',
  }))
}

export function canTeamBuy(team, player, bidAmount) {
  const overseasCount = team.squad.filter((squadPlayer) => squadPlayer.overseas).length
  return team.purse >= bidAmount && team.squad.length < maxSquadSize && (!player.overseas || overseasCount < maxOverseasPlayers)
}

export function evaluateBotInterest(team, player, currentBid, scarcity = 1) {
  if (!canTeamBuy(team, player, currentBid)) return 0

  const priorities = team.profile.priorities
  const squad = team.squad
  const roleCount = squad.filter((squadPlayer) => squadPlayer.role === player.role).length
  const overseasCount = squad.filter((squadPlayer) => squadPlayer.overseas).length
  const pursePressure = Math.max(0.45, team.purse / initialPurse)
  const valueGap = player.estimatedMarketValue - currentBid
  const roleNeed = roleCount === 0 ? 1.18 : roleCount < 3 ? 1 : 0.82
  const overseasPressure = player.overseas && overseasCount >= 6 ? 0.78 : 1
  const youthScore = player.legacyRating < 78 ? priorities.youth ?? 1 : 1
  const roleScore =
    player.role === 'batter'
      ? priorities.batter ?? 1
      : player.role === 'keeper'
        ? priorities.keeper ?? 1
        : player.role === 'allrounder'
          ? priorities.allrounder ?? 1
          : priorities.bowler ?? 1
  const nationalityScore = player.overseas ? priorities.overseas ?? 1 : priorities.indianCore ?? 1
  const valueScore = valueGap >= 2 ? priorities.value ?? 1 : 1
  const riskScore = valueGap < -2 ? priorities.risk ?? 1 : 1
  const recentFormMultiplier = getRecentFormMultiplier(player)
  const starPower = player.starRating * 0.34 + player.formRating * 0.22 + player.recentFormRating * 0.18 + player.legacyRating * 0.22

  return starPower * roleScore * nationalityScore * valueScore * riskScore * youthScore * roleNeed * overseasPressure * pursePressure * scarcity * recentFormMultiplier
}

function getBotBidCeiling(team, player) {
  const priorities = team.profile.priorities
  const riskMultiplier = priorities.risk && priorities.risk > 1.15 ? 1.08 : priorities.risk && priorities.risk < 0.9 ? 0.96 : 1.02
  const rolePremium =
    player.role === 'keeper'
      ? 1.03
      : player.role === 'allrounder'
        ? 1.04
        : player.role === 'bowler'
          ? 1.03
          : 1
  const starPremium = marqueePlayers.has(player.name) || player.recentMarketValue >= 12 ? 1.06 : 1
  const recentFormPremium = getRecentFormMultiplier(player)
  const ceiling = player.estimatedMarketValue * riskMultiplier * rolePremium * starPremium * recentFormPremium
  const slotsLeft = Math.max(1, maxSquadSize - team.squad.length)
  const reserveForMinimumBuys = Math.max(0, slotsLeft - 1) * 0.3
  const spendablePurse = Math.max(0, team.purse - reserveForMinimumBuys)
  const purseCap = player.estimatedMarketValue >= 18 ? 0.24 : player.estimatedMarketValue >= 10 ? 0.2 : player.estimatedMarketValue >= 5 ? 0.16 : 0.1

  return Math.min(spendablePurse, team.purse * purseCap, Math.max(player.basePrice, Number(ceiling.toFixed(1))))
}

export function getBotBidIncrement(player, currentBid) {
  if (player.estimatedMarketValue >= 18) return currentBid >= 14 ? 1 : 0.5
  if (player.estimatedMarketValue >= 10) return currentBid >= 8 ? 1 : 0.5
  if (player.estimatedMarketValue >= 5) return 0.5
  return currentBid >= 3 ? 0.5 : 0.2
}

export function runBotBids({ teams, userTeamId, player, currentBid, highestBidderId, increment }) {
  let nextBid = Number((currentBid + increment).toFixed(1))
  let nextHighestBidderId = highestBidderId
  const nextTeams = teams.map((team) => ({ ...team, biddingStatus: team.userControlled ? 'Your table' : 'Watching' }))
  const logEntries = []

  const interestedTeams = nextTeams
    .filter((team) => team.id !== userTeamId)
    .sort((left, right) => evaluateBotInterest(right, player, nextBid) - evaluateBotInterest(left, player, nextBid))
  const bidder = interestedTeams.find((team) => {
      const interest = evaluateBotInterest(team, player, nextBid)
      const marketGap = Math.max(0, player.estimatedMarketValue - nextBid)
      const premiumDiscount = Math.min(20, Math.max(0, player.estimatedMarketValue - 5))
      const threshold = increment === 0
        ? 44 + (hashName(`${team.id}-${player.name}-${nextBid}`) % 10) - premiumDiscount * 0.75
        : 67 + (hashName(`${team.id}-${player.name}-${nextBid}`) % 14) - premiumDiscount - marketGap * 1.6
      const ceiling = getBotBidCeiling(team, player)

      return team.id !== nextHighestBidderId && interest > threshold && nextBid <= ceiling && canTeamBuy(team, player, nextBid)
    }) ?? (nextBid <= player.estimatedMarketValue * 0.82
      ? interestedTeams.find((team) => {
        const interest = evaluateBotInterest(team, player, nextBid)
        const ceiling = getBotBidCeiling(team, player)

        return team.id !== nextHighestBidderId && interest > 24 && nextBid <= ceiling && canTeamBuy(team, player, nextBid)
      })
      : undefined) ?? (increment === 0
      ? interestedTeams.find((team) => {
        const interest = evaluateBotInterest(team, player, nextBid)
        const ceiling = getBotBidCeiling(team, player)

        return team.id !== nextHighestBidderId && interest > 28 && nextBid <= ceiling && canTeamBuy(team, player, nextBid)
      })
      : undefined)

  nextTeams.forEach((team) => {
    if (team.userControlled) return
    const interest = evaluateBotInterest(team, player, nextBid)
    const ceiling = getBotBidCeiling(team, player)
    team.biddingStatus = interest > (increment === 0 ? 48 : 62) && nextBid <= ceiling ? 'Interested' : 'Passed'
  })

  if (bidder) {
    nextHighestBidderId = bidder.id
    bidder.biddingStatus = `Bid ${formatCrores(nextBid)}`
    logEntries.push(`${bidder.shortName} bid ${formatCrores(nextBid)}`)
  }

  return {
    teams: nextTeams,
    currentBid: nextHighestBidderId === highestBidderId ? currentBid : nextBid,
    highestBidderId: nextHighestBidderId,
    logEntries,
  }
}

export function buyPlayer(teams, winnerId, player, amount) {
  return teams.map((team) => {
    if (team.id !== winnerId) return { ...team, biddingStatus: team.userControlled ? 'Your table' : 'Waiting' }
    const boughtPlayer = { ...player, soldPrice: amount, soldTo: team.id }

    return {
      ...team,
      purse: Number((team.purse - amount).toFixed(1)),
      squad: [...team.squad, boughtPlayer],
      lastPurchase: boughtPlayer,
      biddingStatus: `Bought ${player.name}`,
    }
  })
}

export function analyzeAuction(userTeam, squadLayout) {
  const squad = userTeam.squad
  const mostExpensiveBuy = [...squad].sort((left, right) => right.soldPrice - left.soldPrice)[0]
  const bestValueBuy = [...squad].sort((left, right) => (right.estimatedMarketValue - right.soldPrice) - (left.estimatedMarketValue - left.soldPrice))[0]
  const biggestOverpay = [...squad].sort((left, right) => (right.soldPrice - right.estimatedMarketValue) - (left.soldPrice - left.estimatedMarketValue))[0]
  const roleCoverage = new Set(squad.map((player) => player.role)).size
  const avgQuality = squad.length ? squad.reduce((total, player) => total + player.starRating + player.formRating + player.legacyRating, 0) / (squad.length * 3) : 0
  const chemistry = Math.min(99, Math.round(avgQuality * 0.55 + roleCoverage * 9 + squadLayout.starting.length * 1.8))
  const squadRating = Math.min(99, Math.round(avgQuality * 0.7 + chemistry * 0.3))
  const grade = squadRating >= 91 ? 'A+' : squadRating >= 84 ? 'A' : squadRating >= 76 ? 'B+' : squadRating >= 68 ? 'B' : 'C'
  const topNames = squad.slice(0, 3).map((player) => player.name).join(', ') || 'value picks'
  const roleCounts = squad.reduce((counts, player) => ({ ...counts, [player.role]: (counts[player.role] ?? 0) + 1 }), {})
  const spinConcern = (roleCounts.bowler ?? 0) < 4 ? 'Bowling depth may need attention.' : 'The bowling group has enough options.'

  return {
    mostExpensiveBuy,
    bestValueBuy,
    biggestBargain: bestValueBuy,
    biggestOverpay,
    chemistry,
    squadRating,
    grade,
    scoutReport: `${userTeam.shortName} built around ${topNames}. The squad leans ${roleCounts.batter >= 5 ? 'batting-heavy' : roleCounts.allrounder >= 4 ? 'all-rounder heavy' : 'balanced'} with ${formatCrores(userTeam.purse)} still available. ${spinConcern} Overall this team projects as a ${grade === 'A+' || grade === 'A' ? 'title contender' : grade === 'B+' ? 'playoff contender' : 'work-in-progress'} after the auction.`,
  }
}
