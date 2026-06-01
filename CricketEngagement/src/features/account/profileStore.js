import {
  firebaseAuth,
  firebaseAuthApi,
  firebaseDb,
  firestoreApi,
  hasFirebaseConfig,
} from './firebaseClient'

const localProfileKey = 'cricket-fan-engagement.userProfiles'

function normalizeUsername(username) {
  return username.trim().replace(/\s+/g, ' ')
}

function usernameKey(username) {
  return normalizeUsername(username).toLowerCase()
}

function readLocalProfiles() {
  try {
    return JSON.parse(window.localStorage.getItem(localProfileKey) || '{}')
  } catch {
    return {}
  }
}

function writeLocalProfiles(profiles) {
  window.localStorage.setItem(localProfileKey, JSON.stringify(profiles))
}

function isPermissionError(error) {
  return error?.code === 'permission-denied' || String(error?.message || '').toLowerCase().includes('permission')
}

function getDefaultProfile(user) {
  return {
    username: user.displayName || '',
    favoriteFranchise: 'rcb',
    favoritePlayer: '',
  }
}

function saveLocalProfile(user, nextProfile, usernameLower) {
  const localProfiles = readLocalProfiles()
  const duplicate = Object.entries(localProfiles).find(([userId, savedProfile]) => (
    userId !== user.uid && usernameKey(savedProfile.username || '') === usernameLower
  ))
  if (duplicate) throw new Error('That username is already taken. Choose another one.')

  localProfiles[user.uid] = { ...nextProfile, usernameLower }
  writeLocalProfiles(localProfiles)
  return localProfiles[user.uid]
}

export async function getUserProfile(user) {
  if (!user?.uid) return null

  if (hasFirebaseConfig && firebaseDb) {
    try {
      const snap = await firestoreApi.getDoc(firestoreApi.doc(firebaseDb, 'users', user.uid))
      if (snap.exists()) {
        return {
          username: snap.data().username || user.displayName || '',
          favoriteFranchise: snap.data().favoriteFranchise || 'rcb',
          favoritePlayer: snap.data().favoritePlayer || '',
        }
      }
    } catch (error) {
      if (!isPermissionError(error)) throw error
    }
  }

  const localProfiles = readLocalProfiles()
  return localProfiles[user.uid] || getDefaultProfile(user)
}

export async function saveUserProfile(user, profile) {
  if (!user?.uid) throw new Error('You must be signed in to edit your profile.')

  const username = normalizeUsername(profile.username)
  const usernameLower = usernameKey(username)
  if (username.length < 3) throw new Error('Username must be at least 3 characters.')

  const nextProfile = {
    username,
    displayName: username,
    favoriteFranchise: profile.favoriteFranchise || 'rcb',
    favoritePlayer: normalizeUsername(profile.favoritePlayer || ''),
  }

  if (hasFirebaseConfig && firebaseDb) {
    const userRef = firestoreApi.doc(firebaseDb, 'users', user.uid)
    let previousProfile = {}

    try {
      const userSnap = await firestoreApi.getDoc(userRef)
      previousProfile = userSnap.exists() ? userSnap.data() : {}
    } catch (error) {
      if (!isPermissionError(error)) throw error
      const localProfile = saveLocalProfile(user, nextProfile, usernameLower)
      return {
        ...localProfile,
        warning: 'Saved on this device. Firebase rules/IAM are still blocking cloud profile saves.',
      }
    }

    const previousUsername = previousProfile.username || user.displayName || ''
    const previousUsernameLower = previousProfile.usernameLower || usernameKey(previousUsername)
    const usernameChanged = usernameLower !== previousUsernameLower
    let usernameReserved = !usernameChanged
    let usernameWarning = ''

    if (usernameChanged) {
      try {
        const usernameRef = firestoreApi.doc(firebaseDb, 'usernames', usernameLower)
        const usernameSnap = await firestoreApi.getDoc(usernameRef)

        if (usernameSnap.exists() && usernameSnap.data().userId !== user.uid) {
          throw new Error('That username is already taken. Choose another one.')
        }

        await firestoreApi.setDoc(usernameRef, {
          userId: user.uid,
          username,
          updatedAt: firestoreApi.serverTimestamp(),
        })

        if (previousUsernameLower && previousUsernameLower !== usernameLower) {
          await firestoreApi.deleteDoc(firestoreApi.doc(firebaseDb, 'usernames', previousUsernameLower))
        }

        usernameReserved = true
      } catch (error) {
        if (!isPermissionError(error)) throw error
        usernameWarning = 'Favorite team and player saved. Username changes need the latest Firestore rules deployed.'
      }
    }

    const profileUpdate = {
      userId: user.uid,
      email: user.email || '',
      photoURL: user.photoURL || '',
      favoriteFranchise: nextProfile.favoriteFranchise,
      favoritePlayer: nextProfile.favoritePlayer,
      updatedAt: firestoreApi.serverTimestamp(),
    }

    if (usernameReserved) {
      profileUpdate.username = username
      profileUpdate.usernameLower = usernameLower
      profileUpdate.displayName = username
    }

    try {
      await firestoreApi.setDoc(userRef, profileUpdate, { merge: true })
    } catch (error) {
      if (!isPermissionError(error)) throw error
      const localProfile = saveLocalProfile(
        user,
        usernameReserved
          ? nextProfile
          : { ...nextProfile, username: previousUsername, displayName: previousUsername },
        usernameReserved ? usernameLower : previousUsernameLower,
      )
      return {
        ...localProfile,
        warning: 'Saved on this device. Firebase rules/IAM are still blocking cloud profile saves.',
      }
    }

    if (usernameReserved && firebaseAuth?.currentUser) {
      await firebaseAuthApi.updateProfile(firebaseAuth.currentUser, { displayName: username })
    }

    return usernameReserved
      ? { ...nextProfile, warning: usernameWarning }
      : {
        ...nextProfile,
        username: previousUsername,
        displayName: previousUsername,
        warning: usernameWarning,
      }
  }

  return saveLocalProfile(user, nextProfile, usernameLower)
}
