import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AuctionLog from './AuctionLog'
import BiddingControls from './BiddingControls'
import BotTeamsPanel from './BotTeamsPanel'
import PlayerStage from './PlayerStage'
import SquadBoard from './SquadBoard'
import {
  buyPlayer,
  canTeamBuy,
  formatCrores,
  getBotBidIncrement,
  maxSquadSize,
  runBotBids,
} from './auctionEngine'

const bidSeconds = 8

const categoryLabels = {
  batter: 'Batsmen / Keepers',
  bowler: 'Bowlers',
  allrounder: 'All-rounders',
}

function getAuctionCategory(player) {
  if (player?.role === 'bowler') return 'bowler'
  if (player?.role === 'allrounder') return 'allrounder'
  return 'batter'
}

function getUpcomingByCategory(players, playerIndex) {
  return players.slice(playerIndex + 1).reduce((groups, upcomingPlayer) => {
    const category = getAuctionCategory(upcomingPlayer)
    return { ...groups, [category]: [...(groups[category] ?? []), upcomingPlayer] }
  }, {})
}

function getBotDuelLimit(player) {
  if (!player) return 0
  if (player.estimatedMarketValue >= 18) return 18
  if (player.estimatedMarketValue >= 10) return 14
  if (player.estimatedMarketValue >= 5) return 10
  return 6
}

export default function AuctionRoom({
  userTeamId,
  teams,
  setTeams,
  players,
  playerIndex,
  setPlayerIndex,
  currentBid,
  setCurrentBid,
  highestBidderId,
  setHighestBidderId,
  phase,
  setPhase,
  logEntries,
  setLogEntries,
  customBid,
  setCustomBid,
  squadLayout,
  setSquadLayout,
  onViewPlayer,
  onFinish,
}) {
  const [countdown, setCountdown] = useState(bidSeconds)
  const [botThinking, setBotThinking] = useState(false)
  const [saleBanner, setSaleBanner] = useState(null)
  const [userPassed, setUserPassed] = useState(false)
  const [showUpcomingPlayers, setShowUpcomingPlayers] = useState(false)
  const [paused, setPaused] = useState(false)
  const saleLockRef = useRef(false)
  const soldKeysRef = useRef(new Set())
  const botTimerRef = useRef(0)
  const openingBotKeyRef = useRef('')
  const botQuietKeyRef = useRef('')
  const botDuelCountRef = useRef(0)
  const player = players[playerIndex]
  const userTeam = teams.find((team) => team.id === userTeamId)
  const highestBidder = teams.find((team) => team.id === highestBidderId)
  const ownedPlayerNames = new Set(userTeam.squad.map((squadPlayer) => squadPlayer.name))
  const hasValidPlayingTwelve = (
    squadLayout.starting.every((playerName) => playerName && ownedPlayerNames.has(playerName))
    && Boolean(squadLayout.impact)
    && ownedPlayerNames.has(squadLayout.impact)
  )
  const auctionClosed = !player || userTeam.squad.length >= maxSquadSize || Boolean(saleBanner)
  const userIsHighestBidder = highestBidderId === userTeamId
  const biddingFrozen = auctionClosed || paused
  const userCanBid = !biddingFrozen && !userPassed && !userIsHighestBidder
  const currentCategory = getAuctionCategory(player)
  const nextCategoryIndex = players.findIndex((auctionPlayer, index) => index > playerIndex && getAuctionCategory(auctionPlayer) !== currentCategory)
  const canSkipCategory = Boolean(player) && !saleBanner && !paused && nextCategoryIndex > playerIndex
  const upcomingByCategory = getUpcomingByCategory(players, playerIndex)
  const resetForNextPlayer = (nextTeams, soldLogEntries) => {
    const nextIndex = playerIndex + 1

    setTeams(nextTeams)
    setLogEntries((current) => [...soldLogEntries, ...current].slice(0, 36))
    setPlayerIndex(nextIndex)
    setPhase('Open bidding')
    setHighestBidderId('')
    setCurrentBid(players[nextIndex]?.basePrice ?? 0)
    setCustomBid('')
    setCountdown(bidSeconds)
    setBotThinking(false)
    setSaleBanner(null)
    setUserPassed(false)
    setPaused(false)
    botDuelCountRef.current = 0

    if (nextIndex >= players.length) onFinish()
  }

  const skipCategory = () => {
    if (!canSkipCategory) return
    const skippedPlayers = players.slice(playerIndex, nextCategoryIndex)
    const skippedLabel = categoryLabels[currentCategory]

    window.clearTimeout(botTimerRef.current)
    setPlayerIndex(nextCategoryIndex)
    setPhase('Open bidding')
    setHighestBidderId('')
    setCurrentBid(players[nextCategoryIndex]?.basePrice ?? 0)
    setCustomBid('')
    setCountdown(bidSeconds)
    setBotThinking(false)
    setSaleBanner(null)
    setUserPassed(false)
    setShowUpcomingPlayers(false)
    botQuietKeyRef.current = ''
    botDuelCountRef.current = 0
    saleLockRef.current = false
    setLogEntries((current) => [`Skipped ${skippedPlayers.length} ${skippedLabel.toLowerCase()} and moved to ${categoryLabels[getAuctionCategory(players[nextCategoryIndex])]}.`, ...current].slice(0, 36))
  }

  const completeSale = (winnerId, saleAmount, saleTeams = teams) => {
    const saleKey = `${playerIndex}-${player?.name ?? 'empty'}`
    if (soldKeysRef.current.has(saleKey)) return
    soldKeysRef.current.add(saleKey)

    if (!player || !winnerId) {
      const nextIndex = playerIndex + 1
      const unsoldLine = `${player?.name ?? 'Player'} went unsold`
      setBotThinking(false)
      setSaleBanner({ tone: 'unsold', title: 'UNSOLD', detail: unsoldLine })
      setLogEntries((current) => [unsoldLine, ...current].slice(0, 36))
      window.setTimeout(() => {
        setPlayerIndex(nextIndex)
        setPhase('Open bidding')
        setHighestBidderId('')
        setCurrentBid(players[nextIndex]?.basePrice ?? 0)
        setCountdown(bidSeconds)
        setSaleBanner(null)
        setUserPassed(false)
        botDuelCountRef.current = 0
        if (nextIndex >= players.length) onFinish()
      }, 1250)
      return
    }

    const winner = saleTeams.find((team) => team.id === winnerId)
    const nextTeams = buyPlayer(saleTeams, winnerId, player, saleAmount)
    const soldLine = `Sold to ${winner?.userControlled ? 'You' : winner?.shortName} for ${formatCrores(saleAmount)}`
    setBotThinking(false)
    setSaleBanner({ tone: 'sold', title: 'SOLD', detail: soldLine, team: winner?.shortName })

    if (winnerId === userTeamId) {
      setSquadLayout((current) => ({ ...current, bench: [...current.bench, player.name] }))
    }

    window.setTimeout(() => resetForNextPlayer(nextTeams, [soldLine]), 1250)
  }

  const applyBotRound = (startBid, nextHighestBidderId, increment, seedTeams = teams) => {
    if (paused || saleBanner) return {
      teams: seedTeams,
      currentBid: startBid,
      highestBidderId: nextHighestBidderId,
      logEntries: [],
    }

    const normalizedIncrement = increment === 0 ? 0 : getBotBidIncrement(player, startBid)
    const botResult = runBotBids({
      teams: seedTeams,
      userTeamId,
      player,
      currentBid: startBid,
      highestBidderId: nextHighestBidderId,
      increment: normalizedIncrement,
    })

    setTeams(botResult.teams)
    setCurrentBid(botResult.currentBid)
    setHighestBidderId(botResult.highestBidderId)
    setPhase('Open bidding')
    setCountdown(bidSeconds)
    setBotThinking(false)
    if (botResult.logEntries.length) {
      botQuietKeyRef.current = ''
      botDuelCountRef.current += 1
    } else if (userPassed) {
      botQuietKeyRef.current = `${playerIndex}-${player.name}-${botResult.highestBidderId || 'none'}-${botResult.currentBid}`
    }
    if (botResult.logEntries.length) {
      setLogEntries((current) => [...botResult.logEntries.reverse(), ...current].slice(0, 36))
    }

    return botResult
  }

  const scheduleBotRound = (startBid, nextHighestBidderId, increment, seedTeams = teams, delay = 900) => {
    if (paused || saleBanner) return

    window.clearTimeout(botTimerRef.current)
    setBotThinking(true)
    botTimerRef.current = window.setTimeout(() => {
      applyBotRound(startBid, nextHighestBidderId, increment, seedTeams)
    }, delay)
  }

  const bidAsUser = (amount) => {
    if (!userCanBid) return
    window.clearTimeout(botTimerRef.current)
    setBotThinking(false)
    setUserPassed(false)
    botQuietKeyRef.current = ''
    botDuelCountRef.current = 0
    const nextBid = highestBidderId ? Number((currentBid + amount).toFixed(1)) : Math.max(player.basePrice, Number((currentBid + amount).toFixed(1)))
    if (!canTeamBuy(userTeam, player, nextBid)) {
      setLogEntries((current) => [`You cannot bid ${formatCrores(nextBid)} for ${player.name}`, ...current].slice(0, 36))
      return
    }

    const userBidLine = `You bid ${formatCrores(nextBid)} for ${player.name}`
    setLogEntries((current) => [userBidLine, ...current].slice(0, 36))
    setHighestBidderId(userTeamId)
    setCurrentBid(nextBid)
    setCountdown(bidSeconds)
    scheduleBotRound(nextBid, userTeamId, amount, teams, 850 + Math.round(Math.random() * 900))
  }

  const pass = () => {
    if (biddingFrozen) return
    window.clearTimeout(botTimerRef.current)
    let simulatedTeams = teams
    let simulatedBid = currentBid
    let simulatedHighestBidderId = highestBidderId
    const simulatedLogs = [`You passed on ${player.name}`]

    const maxPassRounds = player.estimatedMarketValue >= 18 ? 34 : player.estimatedMarketValue >= 10 ? 24 : player.estimatedMarketValue >= 5 ? 16 : 10

    for (let round = 0; round < maxPassRounds; round += 1) {
      const nextIncrement = simulatedHighestBidderId ? getBotBidIncrement(player, simulatedBid) : 0
      const result = runBotBids({
        teams: simulatedTeams,
        userTeamId,
        player,
        currentBid: simulatedBid,
        highestBidderId: simulatedHighestBidderId,
        increment: nextIncrement,
      })

      simulatedTeams = result.teams
      simulatedBid = result.currentBid
      simulatedHighestBidderId = result.highestBidderId
      if (!result.logEntries.length) break
      simulatedLogs.push(...result.logEntries)
    }

    setUserPassed(true)
    setBotThinking(false)
    setTeams(simulatedTeams)
    setCurrentBid(simulatedBid)
    setHighestBidderId(simulatedHighestBidderId)
    setLogEntries((current) => [...simulatedLogs.reverse(), ...current].slice(0, 36))
    completeSale(simulatedHighestBidderId, simulatedBid, simulatedTeams)
  }

  const autoBid = () => {
    if (biddingFrozen) return
    const target = Math.min(userTeam.purse, player.estimatedMarketValue + 1)
    const increment = target - currentBid >= 1 ? 1 : 0.5
    bidAsUser(increment)
  }

  const submitCustomBid = () => {
    if (biddingFrozen) return
    const nextBid = Number(customBid)
    if (!Number.isFinite(nextBid) || nextBid <= currentBid) return
    bidAsUser(Number((nextBid - currentBid).toFixed(1)))
  }

  const togglePaused = () => {
    setPaused((current) => {
      const nextPaused = !current

      if (nextPaused) {
        window.clearTimeout(botTimerRef.current)
        setBotThinking(false)
        setLogEntries((currentEntries) => [`Auction paused on ${player?.name ?? 'current lot'}`, ...currentEntries].slice(0, 36))
      } else {
        setLogEntries((currentEntries) => [`Auction resumed`, ...currentEntries].slice(0, 36))
      }

      return nextPaused
    })
  }

  useEffect(() => {
    if (!player || auctionClosed || paused) return undefined
    saleLockRef.current = false

    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          if (!saleLockRef.current) {
            saleLockRef.current = true
            window.setTimeout(() => completeSale(highestBidderId, currentBid), 0)
          }
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [playerIndex, currentBid, highestBidderId, auctionClosed, paused])

  useEffect(() => {
    if (!player || paused || saleBanner || highestBidderId || botThinking) return undefined
    const openingKey = `${playerIndex}-${player.name}`
    if (openingBotKeyRef.current === openingKey) return undefined
    openingBotKeyRef.current = openingKey
    scheduleBotRound(currentBid, '', 0, teams, 1100 + Math.round(Math.random() * 1200))

    return undefined
  }, [playerIndex, player, highestBidderId, saleBanner, botThinking, paused])

  useEffect(() => {
    if (!player || paused || !userPassed || saleBanner || botThinking || !highestBidderId || botDuelCountRef.current >= 4) return undefined
    const quietKey = `${playerIndex}-${player.name}-${highestBidderId}-${currentBid}`
    if (botQuietKeyRef.current === quietKey) return undefined
    scheduleBotRound(currentBid, highestBidderId, getBotBidIncrement(player, currentBid), teams, 850 + Math.round(Math.random() * 900))

    return undefined
  }, [playerIndex, player, userPassed, saleBanner, botThinking, highestBidderId, currentBid, paused])

  useEffect(() => {
    if (!player || paused || userPassed || saleBanner || botThinking || !highestBidderId || highestBidderId === userTeamId) return undefined
    if (botDuelCountRef.current >= getBotDuelLimit(player)) return undefined
    scheduleBotRound(currentBid, highestBidderId, getBotBidIncrement(player, currentBid), teams, 1050 + Math.round(Math.random() * 1100))

    return undefined
  }, [playerIndex, player, userPassed, saleBanner, botThinking, highestBidderId, currentBid, userTeamId, paused])

  return (
    <section className="auction-page auction-room-page" style={{ '--auction-accent': userTeam.colors.accent, '--auction-secondary': userTeam.colors.secondary }}>
      <div className="auction-room-header">
        <div className="auction-logo-mark">{userTeam.shortName}</div>
        <div>
          <span>{userTeam.name}</span>
          <h1>Mega Auction Room</h1>
        </div>
        <div className="auction-room-actions">
          <button className={paused ? 'auction-pause-button paused' : 'auction-pause-button'} disabled={!player || Boolean(saleBanner)} onClick={togglePaused} type="button">
            {paused ? 'Resume Auction' : 'Pause Auction'}
          </button>
          <button onClick={() => setShowUpcomingPlayers((current) => !current)} type="button">
            {showUpcomingPlayers ? 'Hide Upcoming' : 'View Upcoming'}
          </button>
          <button disabled={!canSkipCategory} onClick={skipCategory} type="button">Skip Category</button>
          <button disabled={!hasValidPlayingTwelve} onClick={onFinish} type="button">Complete Auction</button>
        </div>
      </div>

      <div className="auction-room-grid">
        <SquadBoard onViewPlayer={onViewPlayer} setSquadLayout={setSquadLayout} squadLayout={squadLayout} userTeam={userTeam} />

        <main className="auction-main-stage">
          <AnimatePresence>
            {showUpcomingPlayers && (
              <motion.section
                animate={{ opacity: 1, y: 0 }}
                className="auction-upcoming-panel"
                exit={{ opacity: 0, y: -8 }}
                initial={{ opacity: 0, y: -8 }}
              >
                <div className="auction-panel-heading">
                  <div className="auction-upcoming-heading">
                    <span>Upcoming Lots</span>
                    <strong>Players left by category</strong>
                  </div>
                  <button onClick={() => setShowUpcomingPlayers(false)} type="button">Close</button>
                </div>
                <div className="auction-upcoming-grid">
                  {Object.entries(categoryLabels).map(([category, label]) => {
                    const upcomingPlayers = upcomingByCategory[category] ?? []

                    return (
                      <article key={category}>
                        <div>
                          <strong>{label}</strong>
                          <span>{upcomingPlayers.length} left</span>
                        </div>
                        {upcomingPlayers.length ? (
                          <ul>
                            {upcomingPlayers.map((upcomingPlayer) => (
                              <li key={upcomingPlayer.id}>
                                <span>{upcomingPlayer.name}</span>
                                <small>{upcomingPlayer.iplTeam} · {formatCrores(upcomingPlayer.basePrice)}</small>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No more players in this category.</p>
                        )}
                      </article>
                    )
                  })}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} initial={{ opacity: 0, y: 12 }} key={player?.name ?? 'done'}>
              {player ? (
                <PlayerStage countdown={countdown} currentBid={currentBid} highestBidder={highestBidder} onViewPlayer={onViewPlayer} phase={paused ? 'Paused' : phase} player={player} />
              ) : (
                <div className="auction-stage-card">
                  <h2>Auction complete</h2>
                  <p>Review your final squad and auction grade.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <BiddingControls
            canEndAuction={hasValidPlayingTwelve}
            currentBid={currentBid}
            customBid={customBid}
            canPass={!biddingFrozen && !userPassed}
            disabled={!userCanBid}
            helperText={paused ? 'Auction paused. Resume to continue the current lot.' : userPassed ? 'You passed. Other franchises are bidding this player out.' : userIsHighestBidder ? 'Waiting for another franchise to beat your bid.' : botThinking ? 'Franchises are thinking, but you can jump in.' : hasValidPlayingTwelve ? 'Your playing 12 is valid. You can complete the auction anytime.' : 'You can bid now.'}
            onAutoBid={autoBid}
            onBid={bidAsUser}
            onCustomBid={submitCustomBid}
            onEndAuction={onFinish}
            onPass={pass}
            phase={phase}
            countdown={countdown}
            setCustomBid={setCustomBid}
          />

          <AuctionLog entries={logEntries} />
        </main>

        <BotTeamsPanel teams={teams} userTeamId={userTeamId} />
      </div>
      <AnimatePresence>
        {saleBanner && (
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`auction-sale-banner ${saleBanner.tone}`}
            exit={{ opacity: 0, scale: 0.94, y: -10 }}
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
          >
            <span>{saleBanner.team ?? 'IPL'}</span>
            <strong>{saleBanner.title}</strong>
            <p>{saleBanner.detail}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
