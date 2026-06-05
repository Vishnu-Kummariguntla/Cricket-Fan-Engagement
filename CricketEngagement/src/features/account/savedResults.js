import { firebaseDb, firestoreApi, hasFirebaseConfig } from './firebaseClient'

const collectionNames = {
  auction: 'auctionResults',
  dreamTeam: 'dreamTeams',
  quiz: 'quizResults',
  post: 'fanPosts',
  favorite: 'favorites',
}

const localKey = 'cricket-fan-engagement.savedResults'
const fanPostsLocalKey = 'cricket-fan-engagement.fanPosts'

function createId() {
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function nowIso() {
  return new Date().toISOString()
}

function readLocalStore() {
  try {
    return JSON.parse(window.localStorage.getItem(localKey) || '{}')
  } catch {
    return {}
  }
}

function writeLocalStore(store) {
  window.localStorage.setItem(localKey, JSON.stringify(store))
}

function readLocalFanPosts() {
  try {
    return JSON.parse(window.localStorage.getItem(fanPostsLocalKey) || '[]')
  } catch {
    return []
  }
}

function writeLocalFanPosts(posts) {
  window.localStorage.setItem(fanPostsLocalKey, JSON.stringify(posts))
}

function getLocalCollection(type) {
  const store = readLocalStore()
  const name = collectionNames[type]
  return { store, name, items: store[name] ?? [] }
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

export async function saveResult(type, user, payload, visibility = 'private') {
  const name = collectionNames[type]
  const item = {
    userId: user.uid,
    userName: user.displayName || user.email || 'Cricket Fan',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    visibility,
    data: payload,
  }

  if (hasFirebaseConfig && firebaseDb) {
    const ref = await firestoreApi.addDoc(firestoreApi.collection(firebaseDb, name), {
      ...item,
      createdAt: firestoreApi.serverTimestamp(),
      updatedAt: firestoreApi.serverTimestamp(),
    })
    return { ...item, id: ref.id }
  }

  const { store, items } = getLocalCollection(type)
  const savedItem = { ...item, id: createId() }
  store[name] = [savedItem, ...items]
  writeLocalStore(store)
  return savedItem
}

export async function listUserResults(userId) {
  if (!userId) return { auction: [], dreamTeam: [], quiz: [], post: [], favorite: [] }

  if (hasFirebaseConfig && firebaseDb) {
    const entries = await Promise.all(
      Object.entries(collectionNames).map(async ([type, name]) => {
        try {
          const q = firestoreApi.query(
            firestoreApi.collection(firebaseDb, name),
            firestoreApi.where('userId', '==', userId),
            firestoreApi.limit(30),
          )
          const snap = await firestoreApi.getDocs(q)
          const items = snap.docs
            .map(normalizeDoc)
            .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
          return [type, items]
        } catch (error) {
          console.warn(`Unable to load ${name}`, error)
          return [type, []]
        }
      }),
    )
    return Object.fromEntries(entries)
  }

  const store = readLocalStore()
  return Object.fromEntries(
    Object.entries(collectionNames).map(([type, name]) => [
      type,
      (store[name] ?? []).filter((item) => item.userId === userId).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    ]),
  )
}

export async function listPublicUserResults(userId) {
  if (!userId) return { auction: [], dreamTeam: [], quiz: [], post: [] }

  const publicTypes = Object.entries(collectionNames).filter(([type]) => type !== 'favorite')

  if (hasFirebaseConfig && firebaseDb) {
    const entries = await Promise.all(
      publicTypes.map(async ([type, name]) => {
        try {
          const q = firestoreApi.query(
            firestoreApi.collection(firebaseDb, name),
            firestoreApi.where('userId', '==', userId),
            firestoreApi.where('visibility', '==', 'public'),
            firestoreApi.limit(30),
          )
          const snap = await firestoreApi.getDocs(q)
          const items = snap.docs
            .map(normalizeDoc)
            .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
          return [type, items]
        } catch (error) {
          console.warn(`Unable to load public ${name}`, error)
          return [type, []]
        }
      }),
    )
    return Object.fromEntries(entries)
  }

  const store = readLocalStore()
  return Object.fromEntries(
    publicTypes.map(([type, name]) => [
      type,
      (store[name] ?? [])
        .filter((item) => item.userId === userId && item.visibility === 'public')
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    ]),
  )
}

export async function getSharedResult(type, id, userId = '') {
  const name = collectionNames[type]
  if (!name || !id) return null

  if (hasFirebaseConfig && firebaseDb) {
    const snap = await firestoreApi.getDoc(firestoreApi.doc(firebaseDb, name, id))
    if (!snap.exists()) return null
    const item = normalizeDoc(snap)
    if (item.visibility === 'public' || item.userId === userId) return item
    return null
  }

  const store = readLocalStore()
  const item = (store[name] ?? []).find((entry) => entry.id === id)
  if (!item) return null
  return item.visibility === 'public' || item.userId === userId ? item : null
}

export async function updateResultVisibility(type, id, userId, visibility) {
  const name = collectionNames[type]
  if (!name || !id || !userId) return null

  if (hasFirebaseConfig && firebaseDb) {
    const ref = firestoreApi.doc(firebaseDb, name, id)
    const snap = await firestoreApi.getDoc(ref)
    if (!snap.exists() || snap.data().userId !== userId) throw new Error('You can only update your own saved results.')
    await firestoreApi.updateDoc(ref, { visibility, updatedAt: firestoreApi.serverTimestamp() })
    return { id, visibility }
  }

  const store = readLocalStore()
  store[name] = (store[name] ?? []).map((item) => (
    item.id === id && item.userId === userId ? { ...item, visibility, updatedAt: nowIso() } : item
  ))
  writeLocalStore(store)
  return { id, visibility }
}

export async function deleteResult(type, id, userId) {
  const name = collectionNames[type]
  if (!name || !id || !userId) return null

  if (hasFirebaseConfig && firebaseDb) {
    const ref = firestoreApi.doc(firebaseDb, name, id)
    const snap = await firestoreApi.getDoc(ref)
    if (!snap.exists() || snap.data().userId !== userId) throw new Error('You can only delete your own saved results.')
    await firestoreApi.deleteDoc(ref)
    return { id }
  }

  const store = readLocalStore()
  store[name] = (store[name] ?? []).filter((item) => !(item.id === id && item.userId === userId))
  writeLocalStore(store)

  if (type === 'post') {
    writeLocalFanPosts(readLocalFanPosts().filter((item) => !(item.id === id && item.userId === userId)))
  }

  return { id }
}

export function getSharePath(type, id) {
  const slug = type === 'dreamTeam' ? 'dream-team' : type === 'quiz' ? 'quiz-result' : type === 'auction' ? 'auction-result' : 'post'
  return `/share/${slug}/${id}`
}
