import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch or initialize Firestore user profile
  const fetchProfile = async (firebaseUser) => {
    if (!firebaseUser) { setProfile(null); return }
    const ref = doc(db, 'users', firebaseUser.uid)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      setProfile(snap.data())
    } else {
      // First login — create skeleton profile
      const newProfile = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || '',
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL || null,
        targetRole: '',
        experienceLevel: '',
        profileComplete: false,
        streak: 0,
        lastInterviewDate: null,
        totalInterviews: 0,
        createdAt: serverTimestamp(),
      }
      await setDoc(ref, newProfile)
      setProfile(newProfile)
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      await fetchProfile(firebaseUser)
      setLoading(false)
    })
    return unsub
  }, [])

  // ── Auth actions ──────────────────────────────────────────────────────────
  const loginWithGoogle = () => signInWithPopup(auth, googleProvider)

  const loginWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const registerWithEmail = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    return cred
  }

  const logout = () => signOut(auth)

  // ── Profile update ────────────────────────────────────────────────────────
  const updateUserProfile = async (data) => {
    if (!user) return
    const ref = doc(db, 'users', user.uid)
    const updated = { ...data, profileComplete: true }
    await setDoc(ref, updated, { merge: true })
    setProfile((prev) => ({ ...prev, ...updated }))
  }

  const value = {
    user,
    profile,
    loading,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    updateUserProfile,
    refreshProfile: () => fetchProfile(user),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
