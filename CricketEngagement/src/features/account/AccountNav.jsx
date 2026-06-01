import { useState } from 'react'
import { useAuth } from './AuthProvider'

export default function AccountNav({ activeView, onNavigate }) {
  const { logOut, openAuthModal, user } = useAuth()
  const [open, setOpen] = useState(false)

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

  return (
    <div className="account-menu">
      <button className={`account-avatar-button${activeView === 'saved' || activeView === 'profile' ? ' active' : ''}`} onClick={() => setOpen((current) => !current)} type="button">
        <span>{initials}</span>
        <strong>{user.displayName || 'Profile'}</strong>
      </button>
      {open && (
        <div className="account-dropdown">
          <button onClick={() => { onNavigate('profile'); setOpen(false) }} type="button">Profile</button>
          <button onClick={() => { onNavigate('saved'); setOpen(false) }} type="button">Saved Results</button>
          <button className="account-logout-button" onClick={() => { logOut(); setOpen(false) }} type="button">Log Out</button>
        </div>
      )}
    </div>
  )
}
