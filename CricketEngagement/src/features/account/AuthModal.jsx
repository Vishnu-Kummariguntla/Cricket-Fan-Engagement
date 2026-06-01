import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from './AuthProvider'

export default function AuthModal() {
  const { authModalMode, closeAuthModal, signIn, signInWithGoogle, signUp } = useAuth()
  const [mode, setMode] = useState('signIn')
  const [form, setForm] = useState({ email: '', password: '', displayName: '' })
  const [error, setError] = useState('')

  if (!authModalMode) return null

  const activeMode = authModalMode === 'required' ? mode : authModalMode
  const isSignUp = activeMode === 'signUp'
  const title = authModalMode === 'required' ? 'Sign in to save your cricket results.' : isSignUp ? 'Create your cricket account.' : 'Sign in to your cricket account.'

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      if (isSignUp) {
        await signUp(form.email, form.password, form.displayName)
      } else {
        await signIn(form.email, form.password)
      }
    } catch (nextError) {
      setError(nextError.message || 'Authentication failed.')
    }
  }

  return (
    <AnimatePresence>
      <motion.div animate={{ opacity: 1 }} className="auth-modal-backdrop" exit={{ opacity: 0 }} initial={{ opacity: 0 }}>
        <motion.form animate={{ y: 0, scale: 1 }} className="auth-modal" exit={{ y: 18, scale: 0.96 }} initial={{ y: 18, scale: 0.96 }} onSubmit={submit}>
          <button aria-label="Close sign in modal" className="auth-close" onClick={closeAuthModal} type="button">Close</button>
          <div className="auth-cricket-mark" aria-hidden="true">
            <span />
          </div>
          <div className="auth-heading">
            <span>Cricket Account</span>
            <h2>{title}</h2>
            <p>Save auctions, Dream Teams, quiz results, favorites, and future fan posts in one matchday hub.</p>
          </div>
          {isSignUp && (
            <label>
              Username
              <input onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Your display name" value={form.displayName} />
            </label>
          )}
          <label>
            Email
            <input onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" required type="email" value={form.email} />
          </label>
          <label>
            Password
            <input minLength={6} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="At least 6 characters" required type="password" value={form.password} />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <div className="auth-actions">
            <button type="submit">{isSignUp ? 'Create Account' : 'Sign In'}</button>
            <button onClick={signInWithGoogle} type="button">Continue with Google</button>
          </div>
          <div className="auth-switcher">
            <button className={activeMode === 'signIn' ? 'active' : ''} onClick={() => setMode('signIn')} type="button">Sign In</button>
            <button className={activeMode === 'signUp' ? 'active' : ''} onClick={() => setMode('signUp')} type="button">Create Account</button>
            <button onClick={closeAuthModal} type="button">Continue Without Saving</button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  )
}
