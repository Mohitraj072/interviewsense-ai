import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAfaY95jdRtYJbiBpGdKOh64CXFtCWXL6Q",
  authDomain: "interviewsense-ai.firebaseapp.com",
  projectId: "interviewsense-ai",
  storageBucket: "interviewsense-ai.firebasestorage.app",
  messagingSenderId: "463115119310",
  appId: "1:463115119310:web:c014da3e501b3d93457e9f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const signUpWithEmail = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const signOut = () => firebaseSignOut(auth);
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

export default app;
