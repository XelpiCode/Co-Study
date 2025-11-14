import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./config";

const googleProvider = new GoogleAuthProvider();

const checkAuth = () => {
  if (!auth) {
    throw new Error(
      "Firebase is not configured. Please check your .env.local file and ensure all Firebase environment variables are set."
    );
  }
};

export const registerWithEmail = async (email: string, password: string) => {
  checkAuth();
  return await createUserWithEmailAndPassword(auth!, email, password);
};

export const loginWithEmail = async (email: string, password: string) => {
  checkAuth();
  return await signInWithEmailAndPassword(auth!, email, password);
};

export const loginWithGoogle = async () => {
  checkAuth();
  return await signInWithPopup(auth!, googleProvider);
};

export const logout = async () => {
  checkAuth();
  return await signOut(auth!);
};

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    if (!auth) {
      resolve(null);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

