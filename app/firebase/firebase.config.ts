import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, updateProfile } from "firebase/auth";

// Configuración de Firebase usando variables de entorno
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const createUser = async (user: {email: string, password: string}) => {
  return await createUserWithEmailAndPassword(auth, user.email, user.password)
}

export const signIn = async (user: {email: string, password: string}) => {
  return await signInWithEmailAndPassword(auth, user.email, user.password)
}

export const updateUser = (user: { displayName?: string | null | undefined; photoURL?: string | null | undefined; }) => {
  if (auth.currentUser) return updateProfile(auth.currentUser, user)
}