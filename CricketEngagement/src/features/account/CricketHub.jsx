import { useEffect, useState } from 'react'
import iplTeams from '../../data/iplTeams.json'
import { useAuth } from './AuthProvider'
import { getSharePath, listUserResults, updateResultVisibility } from './savedResults'

const labels = {
  auction: 'Saved Auction Results',
  dreamTeam: 'Saved Dream Teams',
  quiz: 'Saved Quiz Results',
  post: 'Fan Posts',
}

function itemTitle(type, item) {
  if (type === 'auction') return `${item.data.userFranchise} auction · ${item.data.grade}`
  if (type === 'dreamTeam') return `${item.data.teamIdentity} · ${item.data.dynastyScore}`
  if (type === 'quiz') return `You are ${item.data.resultPlayer}`
  if (type === 'post') return item.data.title
  return item.data.name || 'Favorite'
}

function itemMeta(type, item) {
  if (type === 'auction') return `${item.data.finalSquad?.length ?? 0} players · ${item.data.purseRemaining} remaining`
  if (type === 'dreamTeam') return `${item.data.selectedPlayers?.length ?? 0} players · ${item.data.chemistryBonuses?.length ?? 0} bonuses`
  if (type === 'quiz') return `${item.data.bestTeamMatch} · ${item.data.similarPlayers?.join(', ')}`
  if (type === 'post') return item.data.body
  return item.data.kind || 'Saved item'
}

function moneyValue(value) {
  if (value === undefined || value === null || value === '') return 'Price N/A'
  return typeof value === 'number' ? `₹${value.toFixed(1)} Cr` : String(value)
}

function getTeamBySignal(signal) {
  if (!signal) return null
  const normalized = String(signal).toLowerCase()
  return iplTeams.find((team) => (
    team.id.toLowerCase() === normalized
    || team.shortName.toLowerCase() === normalized
    || team.name.toLowerCase() === normalized
  ))
}

function getPlayerTileStyle(teamSignal) {
  const team = getTeamBySignal(teamSignal)
  return {
    '--saved-team-accent': team?.colors?.accent || '#f7c948',
    '--saved-team-secondary': team?.colors?.secondary || '#22d3ee',
  }
}

function AuctionDetails({ data }) {
  const squad = data.finalSquad ?? []
  const franchiseTeam = getTeamBySignal(data.userFranchise)

  return (
    <div className="saved-result-details">
      <div className="saved-result-statline">
        <span>Starting XI: {data.startingXI?.length ?? 0}</span>
        <span>Impact: {data.impactSubstitute || 'Not set'}</span>
        <span>Purse: {data.purseRemaining || 'N/A'}</span>
      </div>
      <div className="saved-player-list">
        {squad.map((player) => (
          <span key={`${player.name}-${player.soldPrice}`} style={getPlayerTileStyle(franchiseTeam?.shortName)}>
            {player.name}
            <small>{player.role || 'Player'} · {moneyValue(player.soldPrice)}</small>
          </span>
        ))}
      </div>
      <div className="saved-result-statline">
        <span>Most expensive: {data.mostExpensiveBuy || 'N/A'}</span>
        <span>Best value: {data.bestValueBuy || 'N/A'}</span>
      </div>
    </div>
  )
}

function DreamTeamDetails({ data }) {
  const detailedPlayers = data.selectedPlayerDetails?.length
    ? data.selectedPlayerDetails
    : (data.selectedPlayers ?? []).map((name) => ({ name, roles: [], teams: [] }))

  return (
    <div className="saved-result-details">
      <div className="saved-result-statline">
        <span>Starting XI: {data.startingXI?.length ?? 0}</span>
        <span>Impact: {data.impactSubstitute || 'Not set'}</span>
        <span>Score: {data.dynastyScore ?? 'N/A'}</span>
      </div>
      <div className="saved-player-list">
        {detailedPlayers.map((player) => (
          <span key={player.name} style={getPlayerTileStyle(player.teams?.[0])}>
            {player.name}
            <small>
              {(player.roles?.join(', ') || 'Player')} · {(player.teams?.join('/') || 'IPL')}
              {Number.isFinite(player.runs) ? ` · ${player.runs} runs` : ''}
              {Number.isFinite(player.wickets) && player.wickets > 0 ? ` · ${player.wickets} wkts` : ''}
            </small>
          </span>
        ))}
      </div>
      <div className="saved-result-statline">
        <span>Titles: {data.totals?.titles ?? 'N/A'}</span>
        <span>Runs: {data.totals?.runs ?? 'N/A'}</span>
        <span>Wickets: {data.totals?.wickets ?? 'N/A'}</span>
      </div>
    </div>
  )
}

function SavedResultDetails({ item, type }) {
  if (type === 'auction') return <AuctionDetails data={item.data} />
  if (type === 'dreamTeam') return <DreamTeamDetails data={item.data} />
  return null
}

function SavedResultCard({ item, onVisibilityChange, type }) {
  const sharePath = getSharePath(type, item.id)

  return (
    <article className="hub-result-card">
      <div>
        <span>{item.visibility}</span>
        <strong>{itemTitle(type, item)}</strong>
        <p>{itemMeta(type, item)}</p>
        <SavedResultDetails item={item} type={type} />
        <small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Saved recently'}</small>
      </div>
      <div className="visibility-controls">
        <select onChange={(event) => onVisibilityChange(type, item.id, event.target.value)} value={item.visibility}>
          <option value="private">Private</option>
          <option value="public">Public</option>
        </select>
        {item.visibility === 'public' && <a href={sharePath}>Share Link</a>}
      </div>
    </article>
  )
}

export default function CricketHub({ onNavigate }) {
  const { openAuthModal, user } = useAuth()
  const [results, setResults] = useState({ auction: [], dreamTeam: [], quiz: [], post: [] })
  const [loadStatus, setLoadStatus] = useState('')

  useEffect(() => {
    if (!user) return undefined
    let alive = true
    setLoadStatus('Loading saved results...')
    listUserResults(user.uid)
      .then((items) => {
        if (!alive) return
        setResults(items)
        setLoadStatus('')
      })
      .catch((error) => {
        if (!alive) return
        setLoadStatus(error?.code === 'permission-denied' ? 'Firestore blocked saved-results reads. Check published rules.' : 'Saved results could not load.')
      })
    return () => {
      alive = false
    }
  }, [user])

  const changeVisibility = async (type, id, visibility) => {
    try {
      await updateResultVisibility(type, id, user.uid, visibility)
      setResults(await listUserResults(user.uid))
      setLoadStatus('')
    } catch (error) {
      setLoadStatus(error?.code === 'permission-denied' ? 'Firestore blocked this visibility update. Check published rules.' : 'Visibility could not be updated.')
    }
  }

  if (!user) {
    return (
      <section className="hub-page">
        <div className="hub-hero">
          <span>Saved Results</span>
          <h1>Sign in to save your cricket universe.</h1>
          <p>Auction results, Dream Teams, quiz outcomes, favorites, and fan posts will live here.</p>
          <button onClick={() => openAuthModal('signIn')} type="button">Sign In</button>
        </div>
      </section>
    )
  }

  return (
    <section className="hub-page">
      <div className="hub-hero">
        <span>Saved Results</span>
        <h1>{user.displayName || 'Cricket Fan'}'s saved results.</h1>
        <p>Control visibility for every item. Public saves generate shareable links.</p>
        <button onClick={() => onNavigate('profile')} type="button">Open Profile</button>
        {loadStatus && <p className="save-result-status">{loadStatus}</p>}
      </div>

      <div className="hub-grid">
        {Object.entries(labels).map(([type, label]) => (
          <section className="hub-section" key={type}>
            <div className="hub-section-title">
              <span>{label}</span>
              <strong>{results[type]?.length ?? 0}</strong>
            </div>
            {(results[type]?.length ?? 0) ? (
              results[type].map((item) => (
                <SavedResultCard item={item} key={item.id} onVisibilityChange={changeVisibility} type={type} />
              ))
            ) : (
              <p className="hub-empty">Nothing saved yet.</p>
            )}
          </section>
        ))}
      </div>
    </section>
  )
}
