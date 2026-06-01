import { useState } from 'react'
import { useAuth } from '../account/AuthProvider'
import { analyzeAuction, formatCrores } from './auctionEngine'

function PlayerLine({ player }) {
  if (!player) return <span>To be determined</span>
  return <span>{player.name} · {formatCrores(player.soldPrice)}</span>
}

export default function AuctionResults({ userTeam, squadLayout, onRestart }) {
  const { saveUserResult } = useAuth()
  const [saveStatus, setSaveStatus] = useState('')
  const analysis = analyzeAuction(userTeam, squadLayout)
  const playerMap = new Map(userTeam.squad.map((player) => [player.name, player]))
  const startingPlayers = squadLayout.starting.map((name) => playerMap.get(name)).filter(Boolean)
  const benchPlayers = squadLayout.bench.map((name) => playerMap.get(name)).filter(Boolean)
  const impactPlayer = playerMap.get(squadLayout.impact)
  const saveAuctionResult = async () => {
    setSaveStatus('')
    try {
      await saveUserResult('auction', {
        userFranchise: userTeam.name,
        finalSquad: userTeam.squad.map((player) => ({ name: player.name, role: player.roleLabel, soldPrice: player.soldPrice })),
        startingXI: startingPlayers.map((player) => player.name),
        impactSubstitute: impactPlayer?.name ?? '',
        purseRemaining: formatCrores(userTeam.purse),
        mostExpensiveBuy: analysis.mostExpensiveBuy?.name ?? '',
        bestValueBuy: analysis.bestValueBuy?.name ?? '',
        grade: analysis.grade,
        squadRating: analysis.squadRating,
        chemistry: analysis.chemistry,
      })
      setSaveStatus('Auction saved to Firestore.')
    } catch (error) {
      setSaveStatus(error?.code === 'permission-denied' ? 'Firestore blocked this auction save. Publish the latest rules.' : 'Auction save failed.')
    }
  }

  return (
    <section className="auction-page auction-results-page" style={{ '--auction-accent': userTeam.colors.accent, '--auction-secondary': userTeam.colors.secondary }}>
      <div className="auction-results-hero">
        <span>Post-Auction Analysis</span>
        <h1>{userTeam.shortName} Auction Grade: {analysis.grade}</h1>
        <p>{analysis.scoutReport}</p>
        <div className="results-action-row">
          <button onClick={saveAuctionResult} type="button">Save Auction Result</button>
          <button onClick={onRestart} type="button">Run Another Auction</button>
        </div>
        {saveStatus && <p className="save-result-status">{saveStatus}</p>}
      </div>

      <div className="auction-results-grid">
        <div className="auction-result-card">
          <span>Final Squad</span>
          <strong>{userTeam.squad.length} players</strong>
          <p>{userTeam.squad.map((player) => player.name).join(', ') || 'No players bought'}</p>
        </div>
        <div className="auction-result-card">
          <span>Purse Remaining</span>
          <strong>{formatCrores(userTeam.purse)}</strong>
          <p>Most expensive: <PlayerLine player={analysis.mostExpensiveBuy} /></p>
        </div>
        <div className="auction-result-card">
          <span>Value Report</span>
          <strong>{analysis.squadRating}/99</strong>
          <p>Best value: <PlayerLine player={analysis.bestValueBuy} /></p>
          <p>Biggest bargain: <PlayerLine player={analysis.biggestBargain} /></p>
          <p>Biggest overpay: <PlayerLine player={analysis.biggestOverpay} /></p>
        </div>
        <div className="auction-result-card">
          <span>Team Chemistry</span>
          <strong>{analysis.chemistry}/99</strong>
          <p>Built from role coverage, selected Starting XI, and squad quality.</p>
        </div>
      </div>

      <div className="auction-final-board">
        <div>
          <span>Starting XI</span>
          <p>{startingPlayers.map((player) => player.name).join(', ') || 'Not assigned'}</p>
        </div>
        <div>
          <span>Impact Substitute</span>
          <p>{impactPlayer?.name ?? 'Not assigned'}</p>
        </div>
        <div>
          <span>Bench</span>
          <p>{benchPlayers.map((player) => player.name).join(', ') || 'No bench assigned'}</p>
        </div>
      </div>
    </section>
  )
}
