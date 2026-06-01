import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { getSharedResult } from './savedResults'

const routeTypes = {
  'auction-result': 'auction',
  'dream-team': 'dreamTeam',
  'quiz-result': 'quiz',
  post: 'post',
}

function getShareRoute() {
  const [, , slug, id] = window.location.pathname.split('/')
  return { type: routeTypes[slug], id }
}

export default function SharePage() {
  const { user } = useAuth()
  const [item, setItem] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const { id, type } = getShareRoute()

  useEffect(() => {
    let alive = true
    getSharedResult(type, id, user?.uid).then((result) => {
      if (!alive) return
      setItem(result)
      setLoaded(true)
    })
    return () => {
      alive = false
    }
  }, [id, type, user?.uid])

  if (!loaded) {
    return <section className="share-page"><div className="share-card"><span>Loading shared result</span></div></section>
  }

  if (!item) {
    return (
      <section className="share-page">
        <div className="share-card">
          <span>Private Result</span>
          <h1>This cricket result is not public.</h1>
          <p>Only the owner can view private saves.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="share-page">
      <div className="share-card">
        <span>Shared Cricket Result</span>
        <h1>{item.data.userFranchise || item.data.teamIdentity || item.data.resultPlayer || item.data.title}</h1>
        <p>Shared by {item.userName}</p>
        <div className="share-detail-grid">
          {Object.entries(item.data).slice(0, 8).map(([key, value]) => (
            <div key={key}>
              <span>{key.replace(/[A-Z]/g, (letter) => ` ${letter}`).trim()}</span>
              <strong>{Array.isArray(value) ? value.join(', ') : typeof value === 'object' && value ? JSON.stringify(value) : String(value)}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
