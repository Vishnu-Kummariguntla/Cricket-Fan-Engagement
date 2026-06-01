import { useEffect, useState } from 'react'
import iplTeams from '../../data/iplTeams.json'
import { useAuth } from './AuthProvider'
import { checkUsernameAvailability, getUserProfile, saveUserProfile } from './profileStore'
import { listUserResults } from './savedResults'

const teamLogoPaths = {
  csk: '/images/logos/chennai-super-kings.svg',
  dc: '/images/logos/delhi-capitals.svg',
  gt: '/images/logos/gujarat-titans.svg',
  kkr: '/images/logos/kolkata-knight-riders.svg',
  lsg: '/images/logos/lucknow-super-giants.svg',
  mi: '/images/logos/mumbai-indians.svg',
  pbks: '/images/logos/punjab-kings.svg',
  rr: '/images/logos/rajasthan-royals.png',
  rcb: '/images/logos/royal-challengers-bengaluru.svg',
  srh: '/images/logos/sunrisers-hyderabad.svg',
}

function getFriendlyProfileError(error) {
  if (error?.code === 'permission-denied' || String(error?.message || '').toLowerCase().includes('permission')) {
    return 'Firebase blocked this profile action. Deploy the latest Firestore rules so users can update their own profile and reserve usernames.'
  }
  return error?.message || 'Profile could not be saved.'
}

export default function ProfilePage() {
  const { applyUserProfile, openAuthModal, user } = useAuth()
  const [username, setUsername] = useState('')
  const [favoriteFranchise, setFavoriteFranchise] = useState('rcb')
  const [favoritePlayer, setFavoritePlayer] = useState('')
  const [results, setResults] = useState({ auction: [], dreamTeam: [], quiz: [], post: [] })
  const [status, setStatus] = useState('')
  const [saving, setSaving] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState({ state: 'idle', message: '' })
  const [savedUsername, setSavedUsername] = useState('')

  useEffect(() => {
    if (!user) return
    let alive = true

    getUserProfile(user)
      .then((profile) => {
        if (!alive) return
        const loadedUsername = profile?.username || user.displayName || ''
        setUsername(loadedUsername)
        setSavedUsername(loadedUsername)
        setFavoriteFranchise(profile?.favoriteFranchise || 'rcb')
        setFavoritePlayer(profile?.favoritePlayer || '')
      })
      .catch((error) => {
        if (!alive) return
        setStatus(getFriendlyProfileError(error))
      })

    listUserResults(user.uid)
      .then((savedResults) => {
        if (alive) setResults(savedResults)
      })
      .catch((error) => {
        console.warn('Unable to load saved results for profile preview', error)
      })

    return () => {
      alive = false
    }
  }, [user])

  useEffect(() => {
    const normalizedUsername = username.trim().replace(/\s+/g, ' ')
    const normalizedSavedUsername = savedUsername.trim().replace(/\s+/g, ' ')

    if (!user || !normalizedUsername) {
      setUsernameStatus({ state: 'idle', message: '' })
      return undefined
    }

    if (normalizedSavedUsername && normalizedUsername.toLowerCase() === normalizedSavedUsername.toLowerCase()) {
      setUsernameStatus({ state: 'idle', message: '' })
      return undefined
    }

    let alive = true
    setUsernameStatus({ state: 'checking', message: 'Checking username...' })
    const timer = window.setTimeout(() => {
      checkUsernameAvailability(user, username)
        .then((result) => {
          if (!alive) return
          setUsernameStatus({ state: result.available ? 'available' : 'taken', message: result.message })
        })
        .catch((error) => {
          if (!alive) return
          setUsernameStatus({ state: 'taken', message: getFriendlyProfileError(error) })
        })
    }, 300)

    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [savedUsername, user, username])

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
  const favoriteTeam = iplTeams.find((team) => team.id === favoriteFranchise) || iplTeams.find((team) => team.id === 'rcb')
  const saveProfile = async (event) => {
    event.preventDefault()
    setSaving(true)
    setStatus('')
    try {
      const normalizedUsername = username.trim().replace(/\s+/g, ' ')
      const normalizedSavedUsername = savedUsername.trim().replace(/\s+/g, ' ')
      if (!normalizedSavedUsername || normalizedUsername.toLowerCase() !== normalizedSavedUsername.toLowerCase()) {
        const availability = await checkUsernameAvailability(user, username)
        if (!availability.available) throw new Error(availability.message)
      }
      const savedProfile = await saveUserProfile(user, { username, favoriteFranchise, favoritePlayer })
      applyUserProfile(savedProfile)
      setUsername(savedProfile.username || username)
      setSavedUsername(savedProfile.username || username)
      setStatus(savedProfile.warning || 'Profile saved.')
    } catch (error) {
      setStatus(getFriendlyProfileError(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      className="hub-page profile-page"
      style={{
        '--profile-accent': favoriteTeam?.colors?.accent,
        '--profile-secondary': favoriteTeam?.colors?.secondary,
        '--profile-logo': `url(${teamLogoPaths[favoriteTeam?.id] || teamLogoPaths.rcb})`,
      }}
    >
      <div className="hub-hero profile-hero">
        <div>
          <span>Profile</span>
          <h1>{username || user.displayName || 'Cricket Fan'}</h1>
          <p>Control your public cricket identity, favorite franchise, and favorite player.</p>
        </div>
        <img alt={`${favoriteTeam?.name} logo`} src={teamLogoPaths[favoriteTeam?.id] || teamLogoPaths.rcb} />
      </div>
      <div className="profile-grid">
        <form className="profile-card" onSubmit={saveProfile}>
          <span>Private Profile Settings</span>
          <label>
            Username
            <input onChange={(event) => setUsername(event.target.value)} value={username} />
          </label>
          {usernameStatus.message && (
            <p className={`username-status ${usernameStatus.state}`}>{usernameStatus.message}</p>
          )}
          <label>
            Favorite Franchise
            <select onChange={(event) => setFavoriteFranchise(event.target.value)} value={favoriteFranchise}>
              {iplTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
          </label>
          <label>
            Favorite Player
            <input onChange={(event) => setFavoritePlayer(event.target.value)} placeholder="Virat Kohli, MS Dhoni, Jasprit Bumrah..." value={favoritePlayer} />
          </label>
          <button disabled={saving || usernameStatus.state === 'checking' || usernameStatus.state === 'taken'} type="submit">{saving ? 'Saving...' : 'Save Profile'}</button>
          {status && <p className={status.toLowerCase().includes('saved') ? 'profile-status success' : 'profile-status'}>{status}</p>}
        </form>
        <section className="profile-card">
          <span>Public Preview</span>
          <strong>{username || user.displayName}</strong>
          <p>Favorite franchise: {favoriteTeam?.name}</p>
          <p>Favorite player: {favoritePlayer || 'Not selected yet'}</p>
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
