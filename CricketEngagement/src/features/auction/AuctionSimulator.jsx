import { useMemo, useState } from 'react'
import AuctionResults from './AuctionResults'
import AuctionRoom from './AuctionRoom'
import AuctionSetup from './AuctionSetup'
import { createAuctionPlayers, createAuctionTeams } from './auctionEngine'

const emptyLayout = {
  starting: Array(11).fill(''),
  impact: '',
  bench: [],
}

export default function AuctionSimulator({ iplTeams, featuredAnimations, cricketerProfiles, onNavigate }) {
  const auctionPlayers = useMemo(() => createAuctionPlayers(iplTeams, featuredAnimations, cricketerProfiles), [cricketerProfiles, featuredAnimations, iplTeams])
  const [userTeamId, setUserTeamId] = useState('')
  const [teams, setTeams] = useState([])
  const [playerIndex, setPlayerIndex] = useState(0)
  const [currentBid, setCurrentBid] = useState(auctionPlayers[0]?.basePrice ?? 0)
  const [highestBidderId, setHighestBidderId] = useState('')
  const [phase, setPhase] = useState('Open bidding')
  const [customBid, setCustomBid] = useState('')
  const [logEntries, setLogEntries] = useState(['Auction room waiting for franchise selection.'])
  const [squadLayout, setSquadLayout] = useState(emptyLayout)
  const [finished, setFinished] = useState(false)

  const startAuction = (teamId) => {
    const selectedTeam = iplTeams.find((team) => team.id === teamId)
    setUserTeamId(teamId)
    setTeams(createAuctionTeams(iplTeams, teamId))
    setPlayerIndex(0)
    setCurrentBid(auctionPlayers[0]?.basePrice ?? 0)
    setHighestBidderId('')
    setPhase('Open bidding')
    setCustomBid('')
    setSquadLayout({ ...emptyLayout, starting: Array(11).fill(''), bench: [] })
    setFinished(false)
    setLogEntries([`${selectedTeam.shortName} entered the auction room with a ₹120Cr purse.`])
  }

  const restart = () => {
    setUserTeamId('')
    setTeams([])
    setPlayerIndex(0)
    setCurrentBid(auctionPlayers[0]?.basePrice ?? 0)
    setHighestBidderId('')
    setPhase('Open bidding')
    setCustomBid('')
    setLogEntries(['Auction room waiting for franchise selection.'])
    setSquadLayout({ ...emptyLayout, starting: Array(11).fill(''), bench: [] })
    setFinished(false)
  }

  const viewPlayer = (playerName) => {
    onNavigate('visualizations', { player: playerName })
  }

  if (!userTeamId) {
    return <AuctionSetup onSelectTeam={startAuction} teams={iplTeams} />
  }

  const userTeam = teams.find((team) => team.id === userTeamId)

  if (finished) {
    return <AuctionResults onRestart={restart} squadLayout={squadLayout} userTeam={userTeam} />
  }

  return (
    <AuctionRoom
      currentBid={currentBid}
      customBid={customBid}
      highestBidderId={highestBidderId}
      logEntries={logEntries}
      onFinish={() => setFinished(true)}
      onViewPlayer={viewPlayer}
      phase={phase}
      playerIndex={playerIndex}
      players={auctionPlayers}
      setCurrentBid={setCurrentBid}
      setCustomBid={setCustomBid}
      setHighestBidderId={setHighestBidderId}
      setLogEntries={setLogEntries}
      setPhase={setPhase}
      setPlayerIndex={setPlayerIndex}
      setSquadLayout={setSquadLayout}
      setTeams={setTeams}
      squadLayout={squadLayout}
      teams={teams}
      userTeamId={userTeamId}
    />
  )
}

