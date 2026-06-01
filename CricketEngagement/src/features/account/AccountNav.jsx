import { useState } from 'react'
import iplTeams from '../../data/iplTeams.json'
import { useAuth } from './AuthProvider'

export default function AccountNav({ activeView, onNavigate }) {
  const { authLoading, logOut, openAuthModal, user } = useAuth()
  const [open, setOpen] = useState(false)

  if (authLoading) {
    return (
      <button className="account-signin-button" disabled type="button">
        Profile
      </button>
    )
  }

  if (!user) {
    return (
      <button className="account-signin-button" onClick={() => openAuthModal('signIn')} type="button">
        Sign In
      </button>
    )
  }

  const initials = (user.displayName || user.email || 'CF')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const favoriteTeam = iplTeams.find((team) => team.id === user.favoriteFranchise)

  return (
    <div
      className="account-menu"
      style={{
        '--account-team-accent': favoriteTeam?.colors?.accent || '#f7c948',
        '--account-team-secondary': favoriteTeam?.colors?.secondary || '#22d3ee',
      }}
    >
      <button className={`account-avatar-button${activeView === 'saved' || activeView === 'profile' ? ' active' : ''}`} onClick={() => setOpen((current) => !current)} type="button">
        <span>{initials}</span>
        <strong>{user.displayName || 'Profile'}</strong>
      </button>
      {open && (
        <div className="account-dropdown">
          <button onClick={() => { onNavigate('profile'); setOpen(false) }} type="button">Profile</button>
          <button className="account-logout-button" onClick={() => { logOut(); setOpen(false) }} type="button">Log Out</button>
        </div>
      )}
    </div>
  )
}
