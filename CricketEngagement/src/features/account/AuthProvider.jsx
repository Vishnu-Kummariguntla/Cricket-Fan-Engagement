import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  firebaseAuth,
  firebaseAuthApi,
  googleProvider,
  hasFirebaseConfig,
} from './firebaseClient'
import { saveResult } from './savedResults'

const AuthContext = createContext(null)
const localUserKey = 'cricket-fan-engagement.localUser'

function getLocalUser() {
  try {
    return JSON.parse(window.localStorage.getItem(localUserKey) || 'null')
  } catch {
    return null
  }
}

function setLocalUser(user) {
  if (!user) {
    window.localStorage.removeItem(localUserKey)
    return
  }
  window.localStorage.setItem(localUserKey, JSON.stringify(user))
}

function normalizeUser(user) {
  if (!user) return null
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'Cricket Fan',
    photoURL: user.photoURL || '',
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authModalMode, setAuthModalMode] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!hasFirebaseConfig || !firebaseAuth) {
      setUser(getLocalUser())
      return undefined
    }

    return firebaseAuthApi.onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(normalizeUser(nextUser))
    })
  }, [])

  const showToast = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  const signIn = async (email, password) => {
    if (hasFirebaseConfig && firebaseAuth) {
      const credential = await firebaseAuthApi.signInWithEmailAndPassword(firebaseAuth, email, password)
      setUser(normalizeUser(credential.user))
      setAuthModalMode(null)
      return
    }

    const localUser = { uid: `local-${email.toLowerCase()}`, email, displayName: email.split('@')[0], photoURL: '' }
    setLocalUser(localUser)
    setUser(localUser)
    setAuthModalMode(null)
  }

  const signUp = async (email, password, displayName) => {
    if (hasFirebaseConfig && firebaseAuth) {
      const credential = await firebaseAuthApi.createUserWithEmailAndPassword(firebaseAuth, email, password)
      if (displayName) {
        await firebaseAuthApi.updateProfile(credential.user, { displayName })
      }
      setUser(normalizeUser({ ...credential.user, displayName: displayName || credential.user.displayName }))
      setAuthModalMode(null)
      return
    }

    const localUser = { uid: `local-${email.toLowerCase()}`, email, displayName: displayName || email.split('@')[0], photoURL: '' }
    setLocalUser(localUser)
    setUser(localUser)
    setAuthModalMode(null)
  }

  const signInWithGoogle = async () => {
    if (hasFirebaseConfig && firebaseAuth && googleProvider) {
      const credential = await firebaseAuthApi.signInWithPopup(firebaseAuth, googleProvider)
      setUser(normalizeUser(credential.user))
      setAuthModalMode(null)
      return
    }

    const localUser = { uid: 'local-google-cricket-fan', email: 'google-user@local.dev', displayName: 'Google Cricket Fan', photoURL: '' }
    setLocalUser(localUser)
    setUser(localUser)
    setAuthModalMode(null)
  }

  const logOut = async () => {
    if (hasFirebaseConfig && firebaseAuth) {
      await firebaseAuthApi.signOut(firebaseAuth)
    }
    setLocalUser(null)
    setUser(null)
    showToast('Logged out.')
  }

  const requireAuth = () => {
    if (user) return true
    setAuthModalMode('required')
    return false
  }

  const saveUserResult = async (type, payload, visibility = 'private') => {
    if (!requireAuth()) return null
    const saved = await saveResult(type, user, payload, visibility)
    showToast('Saved to My Cricket Hub.')
    return saved
  }

  const value = useMemo(() => ({
    authModalMode,
    closeAuthModal: () => setAuthModalMode(null),
    logOut,
    openAuthModal: (mode = 'signIn') => setAuthModalMode(mode),
    requireAuth,
    saveUserResult,
    signIn,
    signInWithGoogle,
    signUp,
    toast,
    user,
    usingFirebase: hasFirebaseConfig,
  }), [authModalMode, toast, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
