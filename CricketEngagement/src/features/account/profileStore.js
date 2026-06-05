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
    userId: user.uid,
    username: user.displayName || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
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

export async function checkUsernameAvailability(user, username) {
  if (!user?.uid) return { available: false, message: 'You must be signed in to edit your username.' }

  const normalizedUsername = normalizeUsername(username)
  const normalizedUsernameLower = usernameKey(normalizedUsername)
  if (normalizedUsername.length < 3) {
    return { available: false, message: 'Username must be at least 3 characters.' }
  }

  const localProfiles = readLocalProfiles()
  const localDuplicate = Object.entries(localProfiles).find(([userId, savedProfile]) => (
    userId !== user.uid && usernameKey(savedProfile.username || '') === normalizedUsernameLower
  ))
  if (localDuplicate) {
    return { available: false, message: 'That username is already taken. Choose another one.' }
  }

  if (hasFirebaseConfig && firebaseDb) {
    try {
      const usernameSnap = await firestoreApi.getDoc(firestoreApi.doc(firebaseDb, 'usernames', normalizedUsernameLower))
      if (usernameSnap.exists() && usernameSnap.data().userId !== user.uid) {
        return { available: false, message: 'That username is already taken. Choose another one.' }
      }
    } catch (error) {
      if (!isPermissionError(error)) throw error
      return {
        available: false,
        message: 'Username availability cannot be verified. Publish Firestore rules that allow signed-in reads of username reservations.',
      }
    }
  }

  return { available: true, message: 'Username is available.' }
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

export async function getPublicUserProfile(userId, fallback = {}) {
  if (!userId) return null

  if (hasFirebaseConfig && firebaseDb) {
    try {
      const snap = await firestoreApi.getDoc(firestoreApi.doc(firebaseDb, 'publicProfiles', userId))
      if (snap.exists()) {
        const value = snap.data()
        return {
          userId,
          username: value.username || value.displayName || fallback.userName || 'Cricket Fan',
          displayName: value.displayName || value.username || fallback.userName || 'Cricket Fan',
          photoURL: value.photoURL || fallback.userAvatar || '',
          favoriteFranchise: value.favoriteFranchise || fallback.favoriteFranchise || '',
          favoritePlayer: value.favoritePlayer || '',
        }
      }
    } catch (error) {
      if (!isPermissionError(error)) throw error
    }
  }

  const localProfiles = readLocalProfiles()
  const profile = localProfiles[userId]
  return {
    userId,
    username: profile?.username || profile?.displayName || fallback.userName || 'Cricket Fan',
    displayName: profile?.displayName || profile?.username || fallback.userName || 'Cricket Fan',
    photoURL: profile?.photoURL || fallback.userAvatar || '',
    favoriteFranchise: profile?.favoriteFranchise || fallback.favoriteFranchise || '',
    favoritePlayer: profile?.favoritePlayer || fallback.favoritePlayer || '',
  }
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
        const availability = await checkUsernameAvailability(user, username)
        if (!availability.available) throw new Error(availability.message)

        const usernameRef = firestoreApi.doc(firebaseDb, 'usernames', usernameLower)

        await firestoreApi.setDoc(usernameRef, {
          userId: user.uid,
          username,
          updatedAt: firestoreApi.serverTimestamp(),
        })

        if (previousUsernameLower && previousUsernameLower !== usernameLower) {
          const previousUsernameRef = firestoreApi.doc(firebaseDb, 'usernames', previousUsernameLower)
          const previousUsernameSnap = await firestoreApi.getDoc(previousUsernameRef)
          if (previousUsernameSnap.exists() && previousUsernameSnap.data().userId === user.uid) {
            await firestoreApi.deleteDoc(previousUsernameRef)
          }
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
      await firestoreApi.setDoc(firestoreApi.doc(firebaseDb, 'publicProfiles', user.uid), {
        userId: user.uid,
        username: usernameReserved ? username : previousUsername,
        displayName: usernameReserved ? username : previousUsername,
        photoURL: user.photoURL || '',
        favoriteFranchise: nextProfile.favoriteFranchise,
        favoritePlayer: nextProfile.favoritePlayer,
        updatedAt: firestoreApi.serverTimestamp(),
      }, { merge: true })
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
