import { useEffect, useState } from 'react'
import iplTeams from '../../data/iplTeams.json'
import { useAuth } from './AuthProvider'
import { listUserResults } from './savedResults'

export default function ProfilePage() {
  const { openAuthModal, user } = useAuth()
  const [username, setUsername] = useState('')
  const [favoriteFranchise, setFavoriteFranchise] = useState('rcb')
  const [results, setResults] = useState({ auction: [], dreamTeam: [], quiz: [], post: [] })

  useEffect(() => {
    if (!user) return
    setUsername(user.displayName || '')
    listUserResults(user.uid).then(setResults)
  }, [user])

  if (!user) {
    return (
      <section className="hub-page">
        <div className="hub-hero">
          <span>Profile</span>
          <h1>Public profiles start with an account.</h1>
          <button onClick={() => openAuthModal('signIn')} type="button">Sign In</button>
        </div>
      </section>
    )
  }

  const publicItems = [...results.auction, ...results.dreamTeam, ...results.quiz, ...results.post].filter((item) => item.visibility === 'public')

  return (
    <section className="hub-page profile-page">
      <div className="hub-hero">
        <span>Profile</span>
        <h1>{username || user.displayName || 'Cricket Fan'}</h1>
        <p>Private controls now, public fan identity when you share saved results.</p>
      </div>
      <div className="profile-grid">
        <section className="profile-card">
          <span>Private Profile Settings</span>
          <label>
            Username
            <input onChange={(event) => setUsername(event.target.value)} value={username} />
          </label>
          <label>
            Favorite Franchise
            <select onChange={(event) => setFavoriteFranchise(event.target.value)} value={favoriteFranchise}>
              {iplTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
          </label>
          <p>Profile editing is staged locally here. Persisting profile metadata belongs in the users collection when Firebase config is connected.</p>
        </section>
        <section className="profile-card">
          <span>Public Preview</span>
          <strong>{username || user.displayName}</strong>
          <p>Favorite franchise: {iplTeams.find((team) => team.id === favoriteFranchise)?.name}</p>
          <p>{publicItems.length} public shared item{publicItems.length === 1 ? '' : 's'}</p>
        </section>
        <section className="profile-card fan-posts-foundation">
          <span>Fan Posts Foundation</span>
          <strong>Posts are ready for the community layer.</strong>
          <p>Post title, body, author, timestamp, optional linked result, and public/private visibility are represented in the fanPosts collection structure.</p>
        </section>
      </div>
    </section>
  )
}
