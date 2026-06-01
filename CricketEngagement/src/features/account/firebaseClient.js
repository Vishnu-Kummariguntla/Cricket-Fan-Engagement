import { initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const missingFirebaseFields = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key)
const hasValidApiKeyShape = /^AIza[0-9A-Za-z_-]{35}$/.test(firebaseConfig.apiKey || '')

export const firebaseConfigStatus = missingFirebaseFields.length
  ? `Missing Firebase env values: ${missingFirebaseFields.join(', ')}.`
  : hasValidApiKeyShape
    ? 'Firebase connected'
    : 'Firebase API key looks incomplete or invalid. Copy the full apiKey from Firebase Project settings > SDK setup and restart Vite.'

export const hasFirebaseConfig = Boolean(!missingFirebaseFields.length && hasValidApiKeyShape)

export const firebaseApp = hasFirebaseConfig ? initializeApp(firebaseConfig) : null
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null
export const firebaseDb = firebaseApp ? getFirestore(firebaseApp) : null
export const googleProvider = firebaseApp ? new GoogleAuthProvider() : null

export const firebaseAuthApi = {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
}

export const firestoreApi = {
  addDoc,
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
}
