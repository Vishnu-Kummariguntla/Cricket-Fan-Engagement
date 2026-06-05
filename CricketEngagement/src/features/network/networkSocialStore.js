import { firebaseDb, firestoreApi, hasFirebaseConfig } from '../account/firebaseClient'

const followsLocalKey = 'cricket-fan-engagement.follows'
const messagesLocalKey = 'cricket-fan-engagement.directMessages'
const postsLocalKey = 'cricket-fan-engagement.fanPosts'
const profilesLocalKey = 'cricket-fan-engagement.userProfiles'

function nowIso() {
  return new Date().toISOString()
}

function readLocal(key, fallback) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

function writeLocal(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function followId(userId, targetUserId) {
  return `${userId}_${targetUserId}`
}

function normalizeDoc(snapshot) {
  const value = snapshot.data()
  return {
    id: snapshot.id,
    ...value,
    createdAt: value.createdAt?.toDate?.()?.toISOString?.() ?? value.createdAt ?? '',
    updatedAt: value.updatedAt?.toDate?.()?.toISOString?.() ?? value.updatedAt ?? '',
  }
}

function userFromPost(post) {
  return {
    userId: post.userId,
    displayName: post.userName || 'Cricket Fan',
    username: post.userName || 'Cricket Fan',
    photoURL: post.userAvatar || '',
    favoriteFranchise: post.userFavoriteFranchise || '',
    favoritePlayer: post.userFavoritePlayer || '',
  }
}

function dedupeUsers(users) {
  const byId = new Map()
  users.forEach((candidate) => {
    if (!candidate?.userId) return
    const current = byId.get(candidate.userId) || {}
    byId.set(candidate.userId, {
      ...current,
      ...candidate,
      displayName: candidate.displayName || candidate.username || current.displayName || 'Cricket Fan',
    })
  })
  return [...byId.values()].sort((left, right) => left.displayName.localeCompare(right.displayName))
}

export async function listNetworkUsers(searchText = '') {
  const normalizedSearch = searchText.trim().toLowerCase()
  let users = []

  if (hasFirebaseConfig && firebaseDb) {
    try {
      const snap = await firestoreApi.getDocs(
        firestoreApi.query(firestoreApi.collection(firebaseDb, 'publicProfiles'), firestoreApi.limit(80)),
      )
      users = snap.docs.map(normalizeDoc).map((profile) => ({
        userId: profile.userId,
        displayName: profile.displayName || profile.username || 'Cricket Fan',
        username: profile.username || profile.displayName || 'Cricket Fan',
        photoURL: profile.photoURL || '',
        favoriteFranchise: profile.favoriteFranchise || '',
        favoritePlayer: profile.favoritePlayer || '',
      }))
    } catch (error) {
      console.warn('Unable to load public profiles for messaging search', error)
    }
  }

  if (!users.length) {
    const localProfiles = readLocal(profilesLocalKey, {})
    users = [
      ...Object.entries(localProfiles).map(([userId, profile]) => ({
        userId,
        displayName: profile.displayName || profile.username || 'Cricket Fan',
        username: profile.username || profile.displayName || 'Cricket Fan',
        photoURL: profile.photoURL || '',
        favoriteFranchise: profile.favoriteFranchise || '',
        favoritePlayer: profile.favoritePlayer || '',
      })),
      ...readLocal(postsLocalKey, []).map(userFromPost),
    ]
  }

  return dedupeUsers(users).filter((profile) => {
    if (!normalizedSearch) return true
    return [
      profile.displayName,
      profile.username,
      profile.favoritePlayer,
      profile.favoriteFranchise,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch))
  })
}

export async function listFollowing(userId) {
  if (!userId) return []

  if (hasFirebaseConfig && firebaseDb) {
    const q = firestoreApi.query(
      firestoreApi.collection(firebaseDb, 'follows'),
      firestoreApi.where('followerId', '==', userId),
      firestoreApi.limit(100),
    )
    const snap = await firestoreApi.getDocs(q)
    return snap.docs.map(normalizeDoc)
  }

  return readLocal(followsLocalKey, []).filter((item) => item.followerId === userId)
}

export async function toggleFollow(user, targetUser) {
  if (!user?.uid || !targetUser?.userId || user.uid === targetUser.userId) return { following: false }

  const id = followId(user.uid, targetUser.userId)

  if (hasFirebaseConfig && firebaseDb) {
    const ref = firestoreApi.doc(firebaseDb, 'follows', id)
    const snap = await firestoreApi.getDoc(ref)
    if (snap.exists()) {
      await firestoreApi.deleteDoc(ref)
      return { following: false, id }
    }

    await firestoreApi.setDoc(ref, {
      followerId: user.uid,
      followingId: targetUser.userId,
      followingName: targetUser.displayName || targetUser.username || 'Cricket Fan',
      followingAvatar: targetUser.photoURL || '',
      createdAt: firestoreApi.serverTimestamp(),
    })
    return { following: true, id }
  }

  const follows = readLocal(followsLocalKey, [])
  if (follows.some((item) => item.id === id)) {
    writeLocal(followsLocalKey, follows.filter((item) => item.id !== id))
    return { following: false, id }
  }

  writeLocal(followsLocalKey, [{
    id,
    followerId: user.uid,
    followingId: targetUser.userId,
    followingName: targetUser.displayName || targetUser.username || 'Cricket Fan',
    followingAvatar: targetUser.photoURL || '',
    createdAt: nowIso(),
  }, ...follows])
  return { following: true, id }
}

export async function listDirectMessages(userId, targetUserId) {
  if (!userId || !targetUserId) return []

  if (hasFirebaseConfig && firebaseDb) {
    const sentQuery = firestoreApi.query(
      firestoreApi.collection(firebaseDb, 'directMessages'),
      firestoreApi.where('senderId', '==', userId),
      firestoreApi.where('receiverId', '==', targetUserId),
      firestoreApi.limit(80),
    )
    const receivedQuery = firestoreApi.query(
      firestoreApi.collection(firebaseDb, 'directMessages'),
      firestoreApi.where('senderId', '==', targetUserId),
      firestoreApi.where('receiverId', '==', userId),
      firestoreApi.limit(80),
    )
    const [sentSnap, receivedSnap] = await Promise.all([
      firestoreApi.getDocs(sentQuery),
      firestoreApi.getDocs(receivedQuery),
    ])
    return [...sentSnap.docs, ...receivedSnap.docs]
      .map(normalizeDoc)
      .sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)))
  }

  return readLocal(messagesLocalKey, [])
    .filter((item) => (
      (item.senderId === userId && item.receiverId === targetUserId)
      || (item.senderId === targetUserId && item.receiverId === userId)
    ))
    .sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)))
}

export async function sendDirectMessage(user, targetUser, body) {
  if (!user?.uid || !targetUser?.userId || !body.trim()) return null

  const message = {
    senderId: user.uid,
    senderName: user.displayName || user.email || 'Cricket Fan',
    receiverId: targetUser.userId,
    receiverName: targetUser.displayName || targetUser.username || 'Cricket Fan',
    body: body.trim(),
    createdAt: nowIso(),
  }

  if (hasFirebaseConfig && firebaseDb) {
    const ref = await firestoreApi.addDoc(firestoreApi.collection(firebaseDb, 'directMessages'), {
      ...message,
      createdAt: firestoreApi.serverTimestamp(),
    })
    return { ...message, id: ref.id }
  }

  const savedMessage = { ...message, id: `local-dm-${Date.now()}-${Math.random().toString(16).slice(2)}` }
  writeLocal(messagesLocalKey, [...readLocal(messagesLocalKey, []), savedMessage])
  return savedMessage
}
