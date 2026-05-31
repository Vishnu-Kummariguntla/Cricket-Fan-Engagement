import DynastyLineupBoard from './DynastyLineupBoard'

export default function DynastyScorePanel({
  isValid,
  dynastyStats,
  selectedPlayers,
  overseasCount,
  wicketkeeperCount,
  validationMessages,
  lineupNames,
  selectedCardName,
  startingCount,
  impactPlayer,
  assignSlot,
  assignSlotWithName,
}) {
  return (
    <aside className="dynasty-board">
      <div className="dynasty-score-card">
        <span>Dream Team Score</span>
        <strong>{isValid ? dynastyStats.dynastyScore : '--'}</strong>
        <small>{isValid ? dynastyStats.identity : 'Complete a valid Playing 12'}</small>
      </div>

      <div className="dynasty-validation">
        <div><span>Players Selected</span><strong>{selectedPlayers.length}/12</strong></div>
        <div><span>Overseas Players</span><strong>{overseasCount}/4</strong></div>
        <div><span>Wicketkeepers</span><strong>{wicketkeeperCount}</strong></div>
      </div>

      <div className="dynasty-messages">
        {validationMessages.length ? validationMessages.map((message) => <span key={message}>{message}</span>) : <strong>Dream Team valid. Reveal the result below.</strong>}
      </div>

      <DynastyLineupBoard
        assignSlot={assignSlot}
        assignSlotWithName={assignSlotWithName}
        impactPlayer={impactPlayer}
        lineupNames={lineupNames}
        selectedCardName={selectedCardName}
        startingCount={startingCount}
      />
    </aside>
  )
}
