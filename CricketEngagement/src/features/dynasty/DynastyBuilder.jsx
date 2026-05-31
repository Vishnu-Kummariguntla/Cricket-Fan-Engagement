import { useMemo, useState } from 'react'
import DynastyPlayerGrid from './DynastyPlayerGrid'
import DynastyScorePanel from './DynastyScorePanel'
import { dynastyPlayerPool } from './dynastyPlayerPool'
import {
  clampScore,
  getDynastyCategory,
  getDynastyPlayerScore,
  getDynastyStats,
} from './dynastyScoring'

export default function IplDynastyBuilder() {
  const [lineupNames, setLineupNames] = useState(Array(12).fill(''))
  const [selectedCardName, setSelectedCardName] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('dynasty')
  const [shareStatus, setShareStatus] = useState('')
  const selectedNames = useMemo(() => lineupNames.filter(Boolean), [lineupNames])
  const selectedPlayers = useMemo(
    () => selectedNames.map((name) => dynastyPlayerPool.find((player) => player.name === name)).filter(Boolean),
    [selectedNames],
  )
  const filteredPlayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return [...dynastyPlayerPool]
      .filter((player) => category === 'all' || getDynastyCategory(player) === category)
      .filter((player) => {
        if (!normalizedQuery) return true
        return [player.name, player.nationality, player.teams.join(' '), player.roles.join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      })
      .sort((left, right) => {
        if (sortBy === 'runs') return right.runs - left.runs || left.name.localeCompare(right.name)
        if (sortBy === 'wickets') return right.wickets - left.wickets || left.name.localeCompare(right.name)
        if (sortBy === 'championships') return right.championships - left.championships || left.name.localeCompare(right.name)
        if (sortBy === 'alpha') return left.name.localeCompare(right.name)
        return getDynastyPlayerScore(right) - getDynastyPlayerScore(left) || left.name.localeCompare(right.name)
      })
  }, [category, query, sortBy])
  const overseasCount = selectedPlayers.filter((player) => player.overseas).length
  const wicketkeeperCount = selectedPlayers.filter((player) => player.wicketkeeper).length
  const impactName = lineupNames[11]
  const isValid = selectedPlayers.length === 12 && overseasCount <= 4 && wicketkeeperCount >= 1 && Boolean(impactName)
  const dynastyStats = useMemo(() => getDynastyStats(selectedPlayers), [selectedPlayers])
  const startingXi = lineupNames.slice(0, 11).map((name) => dynastyPlayerPool.find((player) => player.name === name)).filter(Boolean)
  const impactPlayer = dynastyPlayerPool.find((player) => player.name === impactName)
  const validationMessages = [
    selectedPlayers.length < 12 ? `Select ${12 - selectedPlayers.length} more player${12 - selectedPlayers.length === 1 ? '' : 's'} to complete your Dream Team.` : '',
    selectedPlayers.length > 12 ? 'Remove players until the squad has exactly 12.' : '',
    overseasCount > 4 ? 'Maximum 4 overseas players allowed.' : '',
    wicketkeeperCount < 1 ? 'Add at least one wicketkeeper.' : '',
    !impactName ? 'Choose one player as the Impact Substitute.' : '',
  ].filter(Boolean)

  const selectPlayerCard = (player) => {
    setShareStatus('')
    setSelectedCardName((current) => (current === player.name ? '' : player.name))
  }

  const assignSlot = (slotIndex) => {
    setShareStatus('')
    setLineupNames((current) => {
      const existingName = current[slotIndex]

      if (!selectedCardName) {
        const next = [...current]
        next[slotIndex] = ''
        return next
      }

      if (current.includes(selectedCardName) && existingName !== selectedCardName) return current

      if (existingName && existingName !== selectedCardName) {
        const shouldReplace = window.confirm(`Replace ${existingName} with ${selectedCardName}?`)
        if (!shouldReplace) return current
      }

      const next = current.map((name) => (name === selectedCardName ? '' : name))
      next[slotIndex] = selectedCardName
      return next
    })
    setSelectedCardName('')
  }

  const assignSlotWithName = (slotIndex, playerName) => {
    setShareStatus('')
    setLineupNames((current) => {
      if (!playerName || (current.includes(playerName) && current[slotIndex] !== playerName)) return current
      const next = current.map((name) => (name === playerName ? '' : name))
      next[slotIndex] = playerName
      return next
    })
    setSelectedCardName('')
  }

  const applyQuickBuild = (names) => {
    const availableNames = names.filter((name) => dynastyPlayerPool.some((player) => player.name === name)).slice(0, 12)
    setLineupNames([...availableNames, ...Array(12 - availableNames.length).fill('')])
    setSelectedCardName('')
    setShareStatus('')
  }

  const shareText = `IPL Dream Team Builder\n\nTeam: My IPL Dream Team\nScore: ${dynastyStats.dynastyScore}\nIdentity: ${dynastyStats.identity}\nChemistry: ${dynastyStats.chemistry.length}\nTitles Represented: ${dynastyStats.totals.titles}`

  const shareDynasty = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My IPL Dream Team', text: shareText })
        setShareStatus('Shared')
        return
      }
      await navigator.clipboard.writeText(shareText)
      setShareStatus('Copied')
    } catch {
      setShareStatus('Ready')
    }
  }

  const downloadDynastyCard = () => {
    const blob = new Blob([shareText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'my-ipl-dream-team.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="dynasty-page pointer-reactive" aria-label="IPL Dream Team Builder">
      <div className="dynasty-hero">
        <span>IPL Dream Team Builder</span>
        <h1>Assemble the greatest IPL Playing 12 of all time.</h1>
        <p>No batting-order rules. No role locks. Build a legendary dream team, assign one Impact Substitute, and let the score reveal the team identity.</p>
      </div>

      <div className="dynasty-layout">
        <DynastyScorePanel
          assignSlot={assignSlot}
          assignSlotWithName={assignSlotWithName}
          dynastyStats={dynastyStats}
          impactPlayer={impactPlayer}
          isValid={isValid}
          lineupNames={lineupNames}
          overseasCount={overseasCount}
          selectedCardName={selectedCardName}
          selectedPlayers={selectedPlayers}
          startingCount={startingXi.length}
          validationMessages={validationMessages}
          wicketkeeperCount={wicketkeeperCount}
        />

        <DynastyPlayerGrid
          applyQuickBuild={applyQuickBuild}
          category={category}
          filteredPlayers={filteredPlayers}
          playerPoolSize={dynastyPlayerPool.length}
          query={query}
          selectedCardName={selectedCardName}
          selectedNames={selectedNames}
          selectPlayerCard={selectPlayerCard}
          setCategory={setCategory}
          setQuery={setQuery}
          setSortBy={setSortBy}
          sortBy={sortBy}
        />
      </div>

      {isValid && (
        <section className="dynasty-results" aria-label="My IPL Dream Team results">
          <div className="dynasty-results-header">
            <span>My IPL Dream Team</span>
            <h2>{dynastyStats.identity}</h2>
            <strong>{dynastyStats.dynastyScore}</strong>
          </div>
          <div className="dynasty-result-grid">
            <div>
              <span>Starting XI</span>
              <p>{startingXi.map((player) => player.name).join(', ')}</p>
            </div>
            <div>
              <span>Impact Substitute</span>
              <p>{impactPlayer.name}</p>
            </div>
            <div className="dynasty-meters">
              {[
                ['Batting Power', dynastyStats.battingPower],
                ['Bowling Threat', dynastyStats.bowlingThreat],
                ['Leadership', dynastyStats.leadership],
                ['Championship DNA', dynastyStats.championshipDna],
                ['Chemistry Rating', clampScore(dynastyStats.chemistry.length * 18 + dynastyStats.flexibility * 0.45)],
              ].map(([label, value]) => (
                <div className="dynasty-meter" key={label}>
                  <span>{label}</span>
                  <i><b style={{ width: `${value}%` }} /></i>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="dynasty-totals">
              <div><span>Combined IPL Runs</span><strong>{dynastyStats.totals.runs.toLocaleString()}</strong></div>
              <div><span>Combined IPL Wickets</span><strong>{dynastyStats.totals.wickets}</strong></div>
              <div><span>Combined IPL Titles</span><strong>{dynastyStats.totals.titles}</strong></div>
              <div><span>Combined Awards</span><strong>{dynastyStats.totals.awards}</strong></div>
            </div>
          </div>

          <div className="chemistry-panel">
            <span>Chemistry Bonuses</span>
            {dynastyStats.chemistry.length ? (
              dynastyStats.chemistry.map((bonus) => (
                <div key={bonus.name}>
                  <strong>Chemistry Activated: {bonus.name}</strong>
                  <p>{bonus.description}</p>
                </div>
              ))
            ) : (
              <p>No famous core activated yet, but the Dream Team is still valid.</p>
            )}
          </div>

          <div className="comparison-panel">
            {dynastyStats.comparisons.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="dynasty-share-card">
            <span>Shareable Dream Team Card</span>
            <h2>My IPL Dream Team</h2>
            <strong>{dynastyStats.dynastyScore}</strong>
            <p>{dynastyStats.identity}</p>
            <small>{dynastyStats.chemistry.length} chemistry bonuses · {dynastyStats.totals.titles} championships represented</small>
            <div>
              <button onClick={shareDynasty} type="button">{shareStatus || 'Share Result'}</button>
              <button onClick={downloadDynastyCard} type="button">Download Card</button>
            </div>
          </div>
        </section>
      )}
    </section>
  )
}
