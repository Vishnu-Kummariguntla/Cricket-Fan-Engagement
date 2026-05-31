import { dynastyPlayerPool } from './dynastyPlayerPool'

function getPlayerInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
}

export default function DynastyLineupBoard({
  lineupNames,
  selectedCardName,
  startingCount,
  impactPlayer,
  assignSlot,
  assignSlotWithName,
}) {
  return (
    <div className="lineup-board">
      <div className="lineup-heading">
        <span>Starting XI</span>
        <small>{startingCount}/11</small>
      </div>
      <div className="lineup-slots">
        {lineupNames.slice(0, 11).map((name, index) => {
          const player = dynastyPlayerPool.find((poolPlayer) => poolPlayer.name === name)

          return (
            <button
              className={[player ? 'filled' : '', selectedCardName ? 'assignable' : '', player?.name === selectedCardName ? 'selected-slot' : ''].filter(Boolean).join(' ')}
              key={index}
              onClick={() => assignSlot(index)}
              draggable={Boolean(player)}
              onDragStart={(event) => player && event.dataTransfer.setData('text/plain', player.name)}
              type="button"
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                {player && <em>{getPlayerInitials(player.name)}</em>}
                <strong>{player?.name ?? 'Assign'}</strong>
                {player && <small>{player.teams.join(' · ')} · {player.championships}x titles</small>}
              </div>
            </button>
          )
        })}
      </div>
      <div
        className={`impact-zone ${impactPlayer ? 'filled' : ''} ${selectedCardName ? 'assignable' : ''}`}
        onClick={() => assignSlot(11)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          const droppedName = event.dataTransfer.getData('text/plain')
          assignSlotWithName(11, droppedName)
        }}
      >
        <span>Impact Substitute</span>
        <div>
          {impactPlayer && <em>{getPlayerInitials(impactPlayer.name)}</em>}
          <strong>{impactPlayer?.name ?? 'Assign Impact Substitute'}</strong>
          {impactPlayer && <small>{impactPlayer.teams.join(' · ')} · {impactPlayer.championships}x titles</small>}
        </div>
      </div>
    </div>
  )
}
