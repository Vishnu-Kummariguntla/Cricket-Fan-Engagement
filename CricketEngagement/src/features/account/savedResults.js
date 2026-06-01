import { firebaseDb, firestoreApi, hasFirebaseConfig } from './firebaseClient'

const collectionNames = {
  auction: 'auctionResults',
  dreamTeam: 'dreamTeams',
  quiz: 'quizResults',
  post: 'fanPosts',
  favorite: 'favorites',
}

const localKey = 'cricket-fan-engagement.savedResults'

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
        const q = firestoreApi.query(
          firestoreApi.collection(firebaseDb, name),
          firestoreApi.where('userId', '==', userId),
          firestoreApi.orderBy('createdAt', 'desc'),
          firestoreApi.limit(30),
        )
        const snap = await firestoreApi.getDocs(q)
        return [type, snap.docs.map(normalizeDoc)]
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

export function getSharePath(type, id) {
  const slug = type === 'dreamTeam' ? 'dream-team' : type === 'quiz' ? 'quiz-result' : type === 'auction' ? 'auction-result' : 'post'
  return `/share/${slug}/${id}`
}
