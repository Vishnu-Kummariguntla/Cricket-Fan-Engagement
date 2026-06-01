import { dynastyCategories, dynastySortOptions, getDynastyPlayerScore } from './dynastyScoring'
import { quickDynastyBuilds } from './quickBuilds'

function getPlayerInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
}

export default function DynastyPlayerGrid({
  filteredPlayers,
  playerPoolSize,
  selectedNames,
  selectedCardName,
  query,
  category,
  sortBy,
  setQuery,
  setCategory,
  setSortBy,
  applyQuickBuild,
  selectPlayerCard,
}) {
  return (
    <div className="dynasty-player-market">
      <div className="dynasty-toolbar">
        <div>
          <span>Legend Market</span>
          <strong>{filteredPlayers.length} of {playerPoolSize} players</strong>
        </div>
        <input aria-label="Search IPL legends" onChange={(event) => setQuery(event.target.value)} placeholder="Search players, roles, teams" value={query} />
      </div>

      <div className="dynasty-controls" aria-label="Dream Team filters">
        <div className="dynasty-tabs">
          {dynastyCategories.map(([value, label]) => (
            <button className={category === value ? 'active' : ''} key={value} onClick={() => setCategory(value)} type="button">
              {label}
            </button>
          ))}
        </div>
        <label>
          Sort
          <select aria-label="Sort dynasty players" onChange={(event) => setSortBy(event.target.value)} value={sortBy}>
            {dynastySortOptions.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="quick-builds" aria-label="Quick Dream Team builds">
        {Object.entries(quickDynastyBuilds).map(([label, names]) => (
          <button key={label} onClick={() => applyQuickBuild(names)} type="button">
            {label}
          </button>
        ))}
      </div>

      {selectedCardName && (
        <div className="assignment-hint">
          <strong>{selectedCardName}</strong>
          <span>selected. Click any glowing lineup slot to assign or replace.</span>
        </div>
      )}

      <div className="dynasty-player-grid">
        {filteredPlayers.map((player) => {
          const selected = selectedNames.includes(player.name)
          const pending = selectedCardName === player.name

          return (
            <button
              className={[selected ? 'selected' : '', pending ? 'pending' : '', 'dynasty-player-card'].filter(Boolean).join(' ')}
              key={player.name}
              onClick={() => selectPlayerCard(player)}
              style={{ '--player-accent': player.accent }}
              type="button"
            >
              <div className="dynasty-player-image" aria-hidden="true">
                <span>{getPlayerInitials(player.name)}</span>
              </div>
              <div className="dynasty-card-copy">
                <span>{player.overseas ? 'Overseas' : 'Indian'} · {player.nationality}</span>
                <strong>{player.name}</strong>
                <small>{player.teams.join(' · ')}</small>
              </div>
              <div className="dynasty-card-badges">
                {player.current2026Team && <span>2026 {player.current2026Team}</span>}
                {player.championships > 0 && <span>{player.championships}x IPL</span>}
                {player.wicketkeeper && <span>WK</span>}
                <span>{getDynastyPlayerScore(player)} DS</span>
              </div>
              <dl>
                <div><dt>Runs</dt><dd>{player.runs.toLocaleString()}</dd></div>
                <div><dt>Wkts</dt><dd>{player.wickets}</dd></div>
                <div><dt>SR</dt><dd>{player.strikeRate}</dd></div>
                <div><dt>Legacy</dt><dd>{player.legacy}</dd></div>
              </dl>
            </button>
          )
        })}
      </div>
    </div>
  )
}
