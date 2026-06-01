import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { getSharePath, listUserResults, updateResultVisibility } from './savedResults'

const labels = {
  auction: 'Saved Auction Results',
  dreamTeam: 'Saved Dream Teams',
  quiz: 'Saved Quiz Results',
  favorite: 'Favorite Players & Teams',
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

function SavedResultCard({ item, onVisibilityChange, type }) {
  const sharePath = getSharePath(type, item.id)

  return (
    <article className="hub-result-card">
      <div>
        <span>{item.visibility}</span>
        <strong>{itemTitle(type, item)}</strong>
        <p>{itemMeta(type, item)}</p>
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
  const [results, setResults] = useState({ auction: [], dreamTeam: [], quiz: [], post: [], favorite: [] })

  useEffect(() => {
    if (!user) return undefined
    let alive = true
    listUserResults(user.uid).then((items) => {
      if (alive) setResults(items)
    })
    return () => {
      alive = false
    }
  }, [user])

  const changeVisibility = async (type, id, visibility) => {
    await updateResultVisibility(type, id, user.uid, visibility)
    setResults(await listUserResults(user.uid))
  }

  if (!user) {
    return (
      <section className="hub-page">
        <div className="hub-hero">
          <span>My Cricket Hub</span>
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
        <span>My Cricket Hub</span>
        <h1>{user.displayName || 'Cricket Fan'}'s saved results.</h1>
        <p>Control visibility for every item. Public saves generate shareable links.</p>
        <button onClick={() => onNavigate('profile')} type="button">Open Profile</button>
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
