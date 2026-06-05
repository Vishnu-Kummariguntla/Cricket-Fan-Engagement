import { firebaseDb, firestoreApi, hasFirebaseConfig } from '../account/firebaseClient'

const localKey = 'cricket-fan-engagement.fanPosts'
const savedResultsLocalKey = 'cricket-fan-engagement.savedResults'

function createId() {
  return `local-post-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function nowIso() {
  return new Date().toISOString()
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

function readLocalPosts() {
  try {
    return JSON.parse(window.localStorage.getItem(localKey) || '[]')
  } catch {
    return []
  }
}

function writeLocalPosts(posts) {
  window.localStorage.setItem(localKey, JSON.stringify(posts))
}

function readLocalSavedResults() {
  try {
    return JSON.parse(window.localStorage.getItem(savedResultsLocalKey) || '{}')
  } catch {
    return {}
  }
}

function writeLocalSavedResults(store) {
  window.localStorage.setItem(savedResultsLocalKey, JSON.stringify(store))
}

function getUserName(user) {
  return user?.displayName || user?.email || 'Cricket Fan'
}

export async function createFanPost(user, payload) {
  const post = {
    userId: user.uid,
    userName: getUserName(user),
    userAvatar: user.photoURL || '',
    userFavoriteFranchise: user.favoriteFranchise || '',
    userFavoritePlayer: user.favoritePlayer || '',
    visibility: 'public',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    data: {
      title: payload.title,
      body: payload.body,
      image: payload.image || '',
      linkedResult: payload.linkedResult || '',
    },
    reactions: { like: [], dislike: [], fire: [], clap: [] },
    replies: [],
  }

  if (hasFirebaseConfig && firebaseDb) {
    try {
      await firestoreApi.setDoc(firestoreApi.doc(firebaseDb, 'publicProfiles', user.uid), {
        userId: user.uid,
        username: getUserName(user),
        displayName: getUserName(user),
        photoURL: user.photoURL || '',
        favoriteFranchise: user.favoriteFranchise || '',
        favoritePlayer: user.favoritePlayer || '',
        updatedAt: firestoreApi.serverTimestamp(),
      }, { merge: true })
    } catch (error) {
      console.warn('Unable to sync public profile for post author', error)
    }
    const ref = await firestoreApi.addDoc(firestoreApi.collection(firebaseDb, 'fanPosts'), {
      ...post,
      createdAt: firestoreApi.serverTimestamp(),
      updatedAt: firestoreApi.serverTimestamp(),
    })
    return { ...post, id: ref.id }
  }

  const savedPost = { ...post, id: createId() }
  writeLocalPosts([savedPost, ...readLocalPosts()])
  const savedResults = readLocalSavedResults()
  savedResults.fanPosts = [savedPost, ...(savedResults.fanPosts ?? [])]
  writeLocalSavedResults(savedResults)
  return savedPost
}

export async function listPublicFanPosts() {
  if (hasFirebaseConfig && firebaseDb) {
    const q = firestoreApi.query(
      firestoreApi.collection(firebaseDb, 'fanPosts'),
      firestoreApi.where('visibility', '==', 'public'),
      firestoreApi.limit(60),
    )
    const snap = await firestoreApi.getDocs(q)
    return snap.docs
      .map(normalizeDoc)
      .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
  }

  return readLocalPosts()
    .filter((post) => post.visibility === 'public')
    .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
}

export async function updateFanPostReaction(post, user, reactionType) {
  const reactions = {
    like: post.reactions?.like ?? [],
    dislike: post.reactions?.dislike ?? [],
    fire: post.reactions?.fire ?? [],
    clap: post.reactions?.clap ?? [],
  }
  const nextReactions = Object.fromEntries(
    Object.entries(reactions).map(([key, userIds]) => [
      key,
      key === reactionType
        ? (userIds.includes(user.uid) ? userIds.filter((id) => id !== user.uid) : [...userIds, user.uid])
        : userIds.filter((id) => id !== user.uid),
    ]),
  )

  if (hasFirebaseConfig && firebaseDb) {
    await firestoreApi.updateDoc(firestoreApi.doc(firebaseDb, 'fanPosts', post.id), {
      reactions: nextReactions,
      updatedAt: firestoreApi.serverTimestamp(),
    })
    return { ...post, reactions: nextReactions }
  }

  const posts = readLocalPosts().map((item) => (
    item.id === post.id ? { ...item, reactions: nextReactions, updatedAt: nowIso() } : item
  ))
  writeLocalPosts(posts)
  const savedResults = readLocalSavedResults()
  savedResults.fanPosts = (savedResults.fanPosts ?? []).map((item) => (
    item.id === post.id ? { ...item, reactions: nextReactions, updatedAt: nowIso() } : item
  ))
  writeLocalSavedResults(savedResults)
  return { ...post, reactions: nextReactions }
}

export async function addFanPostReply(post, user, body) {
  const reply = {
    id: createId(),
    userId: user.uid,
    userName: getUserName(user),
    body,
    createdAt: nowIso(),
  }
  const replies = [...(post.replies ?? []), reply]

  if (hasFirebaseConfig && firebaseDb) {
    await firestoreApi.updateDoc(firestoreApi.doc(firebaseDb, 'fanPosts', post.id), {
      replies,
      updatedAt: firestoreApi.serverTimestamp(),
    })
    return { ...post, replies }
  }

  const posts = readLocalPosts().map((item) => (
    item.id === post.id ? { ...item, replies, updatedAt: nowIso() } : item
  ))
  writeLocalPosts(posts)
  const savedResults = readLocalSavedResults()
  savedResults.fanPosts = (savedResults.fanPosts ?? []).map((item) => (
    item.id === post.id ? { ...item, replies, updatedAt: nowIso() } : item
  ))
  writeLocalSavedResults(savedResults)
  return { ...post, replies }
}
