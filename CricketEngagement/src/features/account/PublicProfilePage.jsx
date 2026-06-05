import { useEffect, useMemo, useState } from 'react'
import iplTeams from '../../data/iplTeams.json'
import { getPublicUserProfile } from './profileStore'
import { getSharePath, listPublicUserResults } from './savedResults'

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

const resultLabels = {
  auction: 'Auction Results',
  dreamTeam: 'Dream Teams',
  quiz: 'Quiz Results',
  post: 'Fan Posts',
}

function getPublicProfileRoute() {
  const match = window.location.pathname.match(/^\/profile\/([^/]+)$/)
  return match?.[1] ? decodeURIComponent(match[1]) : ''
}

function getResultTitle(type, item) {
  if (type === 'auction') return `${item.data?.userFranchise || 'IPL'} auction`
  if (type === 'dreamTeam') return item.data?.teamIdentity || 'Dream Team'
  if (type === 'quiz') return `Quiz result: ${item.data?.resultPlayer || 'Cricket personality'}`
  if (type === 'post') return item.data?.title || 'Fan post'
  return 'Public result'
}

function getResultMeta(type, item) {
  if (type === 'auction') return `${item.data?.finalSquad?.length ?? 0} players · ${item.data?.purseRemaining || 'Purse N/A'} remaining`
  if (type === 'dreamTeam') return `${item.data?.selectedPlayers?.length ?? 0} players · score ${item.data?.dynastyScore ?? 'N/A'}`
  if (type === 'quiz') return `${item.data?.bestTeamMatch || 'Team match N/A'}`
  if (type === 'post') return item.data?.body || ''
  return ''
}

function getAuthorFallback(results) {
  const authorPost = results.post?.find((post) => post.userName || post.userAvatar)
  return {
    userName: authorPost?.userName || '',
    userAvatar: authorPost?.userAvatar || '',
    favoriteFranchise: authorPost?.userFavoriteFranchise || '',
    favoritePlayer: authorPost?.userFavoritePlayer || '',
  }
}

function getNavigationFallback(userId) {
  try {
    return JSON.parse(window.sessionStorage.getItem(`cricket-public-profile-fallback.${userId}`) || '{}')
  } catch {
    return {}
  }
}

export default function PublicProfilePage() {
  const userId = getPublicProfileRoute()
  const [profile, setProfile] = useState(null)
  const [results, setResults] = useState({ auction: [], dreamTeam: [], quiz: [], post: [] })
  const [status, setStatus] = useState('Loading public profile...')
  const favoriteTeam = useMemo(() => (
    iplTeams.find((team) => team.id === profile?.favoriteFranchise) || null
  ), [profile?.favoriteFranchise])
  const publicCount = Object.values(results).reduce((total, items) => total + items.length, 0)

  useEffect(() => {
    let alive = true

    async function loadProfile() {
      if (!userId) {
        setStatus('This profile link is invalid.')
        return
      }

      try {
        const nextResults = await listPublicUserResults(userId)
        const nextProfile = await getPublicUserProfile(userId, {
          ...getAuthorFallback(nextResults),
          ...getNavigationFallback(userId),
        })
        if (!alive) return
        setProfile(nextProfile)
        setResults(nextResults)
        setStatus('')
      } catch (error) {
        if (!alive) return
        setStatus(error?.code === 'permission-denied' ? 'This public profile is blocked by Firestore rules.' : 'Public profile could not load.')
      }
    }

    void loadProfile()

    return () => {
      alive = false
    }
  }, [userId])

  if (status && !profile) {
    return (
      <section className="hub-page public-profile-page">
        <div className="hub-hero">
          <span>Public Profile</span>
          <h1>{status}</h1>
        </div>
      </section>
    )
  }

  return (
    <section
      className="hub-page public-profile-page"
      style={{
        '--profile-accent': favoriteTeam?.colors?.accent || '#f7c948',
        '--profile-secondary': favoriteTeam?.colors?.secondary || '#22d3ee',
      }}
    >
      <div className="hub-hero public-profile-hero">
        <div className="public-profile-avatar">
          {profile?.photoURL ? <img alt={`${profile.displayName} avatar`} src={profile.photoURL} /> : <span>{(profile?.displayName || 'CF').slice(0, 2).toUpperCase()}</span>}
        </div>
        <div>
          <span>Public Profile</span>
          <h1>{profile?.displayName || profile?.username || 'Cricket Fan'}</h1>
          <div className="public-profile-favorites">
            <p>
              <span>Favorite Franchise</span>
              <strong>{favoriteTeam?.name || 'Not shared yet'}</strong>
            </p>
            <p>
              <span>Favorite Player</span>
              <strong>{profile?.favoritePlayer || 'Not shared yet'}</strong>
            </p>
          </div>
        </div>
        {favoriteTeam && <img alt={`${favoriteTeam.name} logo`} className="public-profile-team-logo" src={teamLogoPaths[favoriteTeam.id]} />}
      </div>

      <div className="public-profile-summary">
        <div><strong>{publicCount}</strong><span>Public Items</span></div>
        <div><strong>{results.post?.length ?? 0}</strong><span>Posts</span></div>
        <div><strong>{results.auction?.length ?? 0}</strong><span>Auctions</span></div>
      </div>

      <div className="hub-grid">
        {Object.entries(resultLabels).map(([type, label]) => (
          <section className="hub-section" key={type}>
            <div className="hub-section-title">
              <span>{label}</span>
              <strong>{results[type]?.length ?? 0}</strong>
            </div>
            {(results[type]?.length ?? 0) ? (
              results[type].map((item) => (
                <article className="hub-result-card public-result-card" key={item.id}>
                  <div>
                    <span>{new Date(item.createdAt || Date.now()).toLocaleDateString()}</span>
                    <strong>{getResultTitle(type, item)}</strong>
                    <p>{getResultMeta(type, item)}</p>
                    {type === 'post' && item.data?.image && <img alt={`${item.data.title} post`} src={item.data.image} />}
                  </div>
                  <div className="visibility-controls">
                    <a href={getSharePath(type, item.id)}>Open</a>
                  </div>
                </article>
              ))
            ) : (
              <p className="hub-empty">No public {label.toLowerCase()} yet.</p>
            )}
          </section>
        ))}
      </div>
    </section>
  )
}
