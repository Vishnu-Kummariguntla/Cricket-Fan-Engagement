import { firebaseDb, firestoreApi, hasFirebaseConfig } from '../account/firebaseClient'

const debateResponsesLocalKey = 'cricket-fan-engagement.fanDebateResponses'

export const fanDebatePrompts = [
  {
    id: 'test-batter-2010s',
    title: 'Who was the best Test batsman of the 2010s?',
    context: 'Compare peak, away runs, consistency, match impact, and difficulty of conditions.',
  },
  {
    id: 'ipl-captain-goat',
    title: 'Who is the greatest IPL captain ever?',
    context: 'Debate trophies, squad building, tactical decisions, and long-term franchise culture.',
  },
  {
    id: 't20-finisher',
    title: 'Who is the most clutch T20 finisher?',
    context: 'Think about chase pressure, death-over hitting, risk control, and playoff performances.',
  },
  {
    id: 'modern-pacer',
    title: 'Who is the defining fast bowler of modern cricket?',
    context: 'Balance formats, new-ball threat, death bowling, fitness, and impact in big series.',
  },
]

function nowIso() {
  return new Date().toISOString()
}

function readLocalResponses() {
  try {
    return JSON.parse(window.localStorage.getItem(debateResponsesLocalKey) || '[]')
  } catch {
    return []
  }
}

function writeLocalResponses(responses) {
  window.localStorage.setItem(debateResponsesLocalKey, JSON.stringify(responses))
}

function normalizeDoc(snapshot) {
  const value = snapshot.data()
  return {
    id: snapshot.id,
    ...value,
    createdAt: value.createdAt?.toDate?.()?.toISOString?.() ?? value.createdAt ?? '',
  }
}

function createLocalId() {
  return `local-debate-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function listDebateResponses(promptId) {
  if (!promptId) return []

  if (hasFirebaseConfig && firebaseDb) {
    const q = firestoreApi.query(
      firestoreApi.collection(firebaseDb, 'fanDebateResponses'),
      firestoreApi.where('promptId', '==', promptId),
      firestoreApi.limit(80),
    )
    const snap = await firestoreApi.getDocs(q)
    return snap.docs
      .map(normalizeDoc)
      .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
  }

  return readLocalResponses()
    .filter((response) => response.promptId === promptId)
    .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
}

export async function createDebateResponse(user, prompt, payload) {
  if (!user?.uid || !prompt?.id || !payload?.stance?.trim() || !payload?.reason?.trim()) return null

  const response = {
    promptId: prompt.id,
    promptTitle: prompt.title,
    userId: user.uid,
    userName: user.displayName || user.email || 'Cricket Fan',
    userAvatar: user.photoURL || '',
    stance: payload.stance.trim(),
    reason: payload.reason.trim(),
    createdAt: nowIso(),
  }

  if (hasFirebaseConfig && firebaseDb) {
    const ref = await firestoreApi.addDoc(firestoreApi.collection(firebaseDb, 'fanDebateResponses'), {
      ...response,
      createdAt: firestoreApi.serverTimestamp(),
    })
    return { ...response, id: ref.id }
  }

  const savedResponse = { ...response, id: createLocalId() }
  writeLocalResponses([savedResponse, ...readLocalResponses()])
  return savedResponse
}
