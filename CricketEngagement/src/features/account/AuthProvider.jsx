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
    const savedUser = JSON.parse(window.localStorage.getItem(localUserKey) || 'null')
    if (savedUser?.uid === 'local-google-cricket-fan') {
      setLocalUser(null)
      return null
    }
    return savedUser
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

function mergeUserProfile(baseUser, profile) {
  if (!baseUser) return null
  if (!profile) return baseUser

  return {
    ...baseUser,
    displayName: profile.username || profile.displayName || baseUser.displayName,
    favoriteFranchise: profile.favoriteFranchise || '',
    favoritePlayer: profile.favoritePlayer || '',
  }
}

async function upsertUserDocument(user) {
  if (!hasFirebaseConfig || !firebaseDb || !user?.uid) return

  const normalizedUser = normalizeUser(user)
  const userRef = firestoreApi.doc(firebaseDb, 'users', user.uid)
  let existingProfile = null

  try {
    const profileSnapshot = await firestoreApi.getDoc(userRef)
    existingProfile = profileSnapshot.exists() ? profileSnapshot.data() : null
  } catch {
    existingProfile = null
  }

  const profileUpdate = {
    userId: user.uid,
    email: normalizedUser.email || '',
    photoURL: normalizedUser.photoURL,
    updatedAt: firestoreApi.serverTimestamp(),
  }

  if (!existingProfile?.username) profileUpdate.username = normalizedUser.displayName
  if (!existingProfile?.displayName) profileUpdate.displayName = normalizedUser.displayName
  if (!existingProfile?.createdAt) profileUpdate.createdAt = firestoreApi.serverTimestamp()

  await firestoreApi.setDoc(userRef, profileUpdate, { merge: true })
}

async function syncUserDocument(user) {
  try {
    await upsertUserDocument(user)
  } catch (error) {
    console.warn('Unable to sync Firebase user profile', error)
  }
}

async function getProfiledUser(user) {
  const normalizedUser = normalizeUser(user)
  if (!normalizedUser || !hasFirebaseConfig || !firebaseDb || !user?.uid) return normalizedUser

  try {
    const profileSnapshot = await firestoreApi.getDoc(firestoreApi.doc(firebaseDb, 'users', user.uid))
    return mergeUserProfile(normalizedUser, profileSnapshot.exists() ? profileSnapshot.data() : null)
  } catch (error) {
    console.warn('Unable to load Firebase user profile', error)
    return normalizedUser
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authModalMode, setAuthModalMode] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!hasFirebaseConfig || !firebaseAuth) {
      setUser(getLocalUser())
      setAuthLoading(false)
      return undefined
    }

    let active = true
    const unsubscribe = firebaseAuthApi.onAuthStateChanged(firebaseAuth, (nextUser) => {
      setAuthLoading(true)
      void (async () => {
        if (!nextUser) {
          if (active) {
            setUser(null)
            setAuthLoading(false)
          }
          return
        }

        await syncUserDocument(nextUser)
        const profiledUser = await getProfiledUser(nextUser)
        if (active) {
          setUser(profiledUser)
          setAuthLoading(false)
        }
      })()
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const showToast = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  const signIn = async (email, password) => {
    if (hasFirebaseConfig && firebaseAuth) {
      const credential = await firebaseAuthApi.signInWithEmailAndPassword(firebaseAuth, email, password)
      await syncUserDocument(credential.user)
      setUser(await getProfiledUser(credential.user))
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
      setUser(await getProfiledUser(nextUser))
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
      setUser(await getProfiledUser(credential.user))
      setAuthModalMode(null)
      return
    }

    throw new Error(`${firebaseConfigStatus} Google sign-in requires Firebase configuration and cannot use a local placeholder account.`)
  }

  const logOut = async () => {
    if (hasFirebaseConfig && firebaseAuth) {
      await firebaseAuthApi.signOut(firebaseAuth)
    }
    setLocalUser(null)
    setUser(null)
    setAuthLoading(false)
    showToast('Logged out.')
  }

  const requireAuth = () => {
    if (user) return true
    setAuthModalMode('required')
    return false
  }

  const saveUserResult = async (type, payload, visibility = 'private') => {
    if (!requireAuth()) return null
    try {
      const saved = await saveResult(type, user, payload, visibility)
      showToast('Saved to My Cricket Hub.')
      return saved
    } catch (error) {
      showToast(error?.code === 'permission-denied' ? 'Firestore blocked this save. Check published rules.' : 'Save failed.')
      throw error
    }
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
    authLoading,
    firebaseConfigStatus,
    usingFirebase: hasFirebaseConfig,
  }), [authLoading, authModalMode, toast, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
