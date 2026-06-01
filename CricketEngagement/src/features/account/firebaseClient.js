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

const firebaseFallbackConfig = {
  apiKey: 'AIzaSyDwmbMpk53EAw7AyOG8QCQbhQMwmwQ7ZOw',
  authDomain: 'cricketfanengagement.firebaseapp.com',
  projectId: 'cricketfanengagement',
  storageBucket: 'cricketfanengagement.firebasestorage.app',
  messagingSenderId: '623757892397',
  appId: '1:623757892397:web:c01fe8d533c667c87691a4',
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseFallbackConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseFallbackConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseFallbackConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseFallbackConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseFallbackConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseFallbackConfig.appId,
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
