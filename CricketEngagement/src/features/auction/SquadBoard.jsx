import { useState } from 'react'
import { formatCrores, maxOverseasPlayers, maxSquadSize } from './auctionEngine'

function removeFromLayout(layout, playerName) {
  return {
    starting: layout.starting.map((name) => (name === playerName ? '' : name)),
    impact: layout.impact === playerName ? '' : layout.impact,
    bench: layout.bench.filter((name) => name !== playerName),
  }
}

function initials(name) {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2)
}

function PlayerChip({ player, selected, source, onSelectPlayer, onViewPlayer }) {
  return (
    <div
      className={`auction-squad-chip ${selected ? 'selected' : ''}`}
      draggable
      onClick={(event) => {
        event.stopPropagation()
        onSelectPlayer(player.name)
      }}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', JSON.stringify({ playerName: player.name, source }))
      }}
    >
      <span>{initials(player.name)}</span>
      <div>
        <strong>{player.name}</strong>
        <small>{player.roleLabel} · {formatCrores(player.soldPrice)}</small>
      </div>
      {player.hasCareerStory && <button onClick={(event) => {
        event.stopPropagation()
        onViewPlayer(player.name)
      }} type="button">Story</button>}
    </div>
  )
}

export default function SquadBoard({ userTeam, squadLayout, setSquadLayout, onViewPlayer }) {
  const [selectedPlayerName, setSelectedPlayerName] = useState('')
  const playerMap = new Map(userTeam.squad.map((player) => [player.name, player]))
  const overseasCount = userTeam.squad.filter((player) => player.overseas).length
  const assignPlayer = (target, index, playerName) => {
    if (!playerName || !playerMap.has(playerName)) return
    setSquadLayout((current) => {
      const next = removeFromLayout(current, playerName)

      if (target === 'starting') {
        const existing = next.starting[index]
        next.starting[index] = playerName
        if (existing) next.bench = [...next.bench, existing]
      } else if (target === 'impact') {
        if (next.impact) next.bench = [...next.bench, next.impact]
        next.impact = playerName
      } else {
        next.bench = [...next.bench, playerName]
      }

      return next
    })
    setSelectedPlayerName('')
  }
  const dropPlayer = (target, index) => (event) => {
    event.preventDefault()
    const data = JSON.parse(event.dataTransfer.getData('text/plain') || '{}')
    assignPlayer(target, index, data.playerName)
  }
  const selectPlayer = (playerName) => {
    setSelectedPlayerName((current) => (current === playerName ? '' : playerName))
  }
  const handleSlotClick = (target, index, playerName) => {
    if (selectedPlayerName) {
      if (selectedPlayerName === playerName) {
        assignPlayer('bench', undefined, selectedPlayerName)
        return
      }
      assignPlayer(target, index, selectedPlayerName)
      return
    }

    if (playerName) selectPlayer(playerName)
  }

  return (
    <aside className="auction-squad-board">
      <div className="auction-panel-heading">
        <span>Your Squad Board</span>
        <strong>{userTeam.squad.length}/{maxSquadSize}</strong>
      </div>
      <div className="auction-user-summary">
        <div><span>Purse</span><strong>{formatCrores(userTeam.purse)}</strong></div>
        <div><span>Overseas</span><strong>{overseasCount}/{maxOverseasPlayers}</strong></div>
        <div><span>Last Buy</span><strong>{userTeam.lastPurchase?.name ?? 'None'}</strong></div>
      </div>
      {selectedPlayerName && (
        <div className="auction-squad-selection">
          <strong>{selectedPlayerName}</strong>
          <span>selected. Click a slot to place, or click the player again to unselect.</span>
        </div>
      )}

      <div className="auction-board-section">
        <div className="auction-board-title"><span>Starting XI</span><strong>{squadLayout.starting.filter(Boolean).length}/11</strong></div>
        <div className="auction-starting-grid">
          {squadLayout.starting.map((playerName, index) => {
            const player = playerMap.get(playerName)

            return (
              <div className={`auction-slot ${player ? 'filled' : ''} ${selectedPlayerName ? 'assignable' : ''}`} key={index} onClick={() => handleSlotClick('starting', index, player?.name)} onDragOver={(event) => event.preventDefault()} onDrop={dropPlayer('starting', index)}>
                <small>{String(index + 1).padStart(2, '0')}</small>
                {player ? <PlayerChip onSelectPlayer={selectPlayer} onViewPlayer={onViewPlayer} player={player} selected={selectedPlayerName === player.name} source={{ type: 'starting', index }} /> : <span>{selectedPlayerName ? 'Click to assign' : 'Drop player'}</span>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="auction-board-section">
        <div className="auction-board-title"><span>Impact Substitute</span><strong>{squadLayout.impact ? '1/1' : '0/1'}</strong></div>
        <div className={`auction-slot impact ${squadLayout.impact ? 'filled' : ''} ${selectedPlayerName ? 'assignable' : ''}`} onClick={() => handleSlotClick('impact', undefined, squadLayout.impact)} onDragOver={(event) => event.preventDefault()} onDrop={dropPlayer('impact')}>
          {squadLayout.impact ? <PlayerChip onSelectPlayer={selectPlayer} onViewPlayer={onViewPlayer} player={playerMap.get(squadLayout.impact)} selected={selectedPlayerName === squadLayout.impact} source={{ type: 'impact' }} /> : <span>{selectedPlayerName ? 'Click to assign impact' : 'Drop one impact player'}</span>}
        </div>
      </div>

      <div className="auction-board-section">
        <div className="auction-board-title"><span>Bench</span><strong>{squadLayout.bench.length}</strong></div>
        <div className={`auction-bench ${selectedPlayerName ? 'assignable' : ''}`} onClick={() => selectedPlayerName && assignPlayer('bench', undefined, selectedPlayerName)} onDragOver={(event) => event.preventDefault()} onDrop={dropPlayer('bench')}>
          {squadLayout.bench.length ? (
            squadLayout.bench.map((playerName) => {
              const player = playerMap.get(playerName)
              return player ? <PlayerChip key={playerName} onSelectPlayer={selectPlayer} onViewPlayer={onViewPlayer} player={player} selected={selectedPlayerName === player.name} source={{ type: 'bench' }} /> : null
            })
          ) : (
            <span>Purchased players appear here first.</span>
          )}
        </div>
      </div>
    </aside>
  )
}
