import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  firebaseAuth,
  firebaseAuthApi,
  firebaseConfigStatus,
  firebaseDb,
  firestoreApi,
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

async function upsertUserDocument(user) {
  if (!hasFirebaseConfig || !firebaseDb || !user?.uid) return

  const normalizedUser = normalizeUser(user)
  await firestoreApi.setDoc(
    firestoreApi.doc(firebaseDb, 'users', user.uid),
    {
      userId: user.uid,
      email: normalizedUser.email || '',
      username: normalizedUser.displayName,
      displayName: normalizedUser.displayName,
      photoURL: normalizedUser.photoURL,
      updatedAt: firestoreApi.serverTimestamp(),
    },
    { merge: true },
  )
}

async function syncUserDocument(user) {
  try {
    await upsertUserDocument(user)
  } catch (error) {
    console.warn('Unable to sync Firebase user profile', error)
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
      if (nextUser) {
        void syncUserDocument(nextUser)
      }
    })
  }, [])

  const showToast = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  const signIn = async (email, password) => {
    if (hasFirebaseConfig && firebaseAuth) {
      const credential = await firebaseAuthApi.signInWithEmailAndPassword(firebaseAuth, email, password)
      await syncUserDocument(credential.user)
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
      const nextUser = {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: displayName || credential.user.displayName,
        photoURL: credential.user.photoURL,
      }
      await syncUserDocument(nextUser)
      setUser(normalizeUser(nextUser))
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
      await syncUserDocument(credential.user)
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
    showToast('Saved to Saved Results.')
    return saved
  }

  const applyUserProfile = (profile) => {
    setUser((current) => {
      if (!current) return current
      const nextUser = {
        ...current,
        displayName: profile.username || profile.displayName || current.displayName,
        favoriteFranchise: profile.favoriteFranchise ?? current.favoriteFranchise,
        favoritePlayer: profile.favoritePlayer ?? current.favoritePlayer,
      }
      if (!hasFirebaseConfig) setLocalUser(nextUser)
      return nextUser
    })
  }

  const value = useMemo(() => ({
    authModalMode,
    closeAuthModal: () => setAuthModalMode(null),
    applyUserProfile,
    logOut,
    openAuthModal: (mode = 'signIn') => setAuthModalMode(mode),
    requireAuth,
    saveUserResult,
    signIn,
    signInWithGoogle,
    signUp,
    toast,
    user,
    firebaseConfigStatus,
    usingFirebase: hasFirebaseConfig,
  }), [authModalMode, toast, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
