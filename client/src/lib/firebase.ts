import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";

// Environment variable accessor for server-injected variables in production
const getEnvVar = (key: string): string | undefined => {
  let value: string | undefined;
  
  // First try server-injected variables (production mode)
  if (typeof window !== 'undefined' && (window as any).__ENV__) {
    value = (window as any).__ENV__[key];
    if (value) {
      console.log(`[PROD] ${key}: [HIDDEN]`);
      return value;
    }
  }
  
  // Then try Vite dev mode if server injection didn't work
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    value = import.meta.env[key];
    if (value) {
      console.log(`[DEV] ${key}: [HIDDEN]`);
      return value;
    }
  }
  
  console.log(`[ERROR] Could not find env var ${key}`);
  return undefined;
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY') || "demo-key",
  authDomain: `${getEnvVar('VITE_FIREBASE_PROJECT_ID') || "demo-project"}.firebaseapp.com`,
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID') || "demo-project",
  storageBucket: `${getEnvVar('VITE_FIREBASE_PROJECT_ID') || "demo-project"}.firebasestorage.app`,
  appId: getEnvVar('VITE_FIREBASE_APP_ID') || "demo-app-id",
};

// Debug logging for both dev and production
console.log('Firebase environment check:');
console.log('- Running in Vite dev mode:', typeof import.meta !== 'undefined' && import.meta.env);
console.log('- window.__ENV__ available:', typeof window !== 'undefined' && !!(window as any).__ENV__);
if (typeof window !== 'undefined' && (window as any).__ENV__) {
  console.log('- window.__ENV__ keys:', Object.keys((window as any).__ENV__));
}

console.log('Firebase Config will use:', {
  apiKey: firebaseConfig.apiKey ? '[HIDDEN]' : 'NOT_SET',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  appId: firebaseConfig.appId ? '[HIDDEN]' : 'NOT_SET'
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const signInWithEmail = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logout = () => {
  return signOut(auth);
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore helpers - Keep auth-related functions, optimize database operations
export const createUserProfile = async (user: User) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isAdmin: false,
      createdAt: new Date(),
    });
  }
  
  return userSnap.data();
};

export const addToWatchlist = async (userId: string, movie: any) => {
  // DISABLED: Direct Firebase call - using server API instead
  throw new Error('Use watchlistAPI.addToWatchlist() instead to avoid quota issues');
};

export const removeFromWatchlist = async (userId: string, movieId: number) => {
  // DISABLED: Direct Firebase call - using server API instead
  throw new Error('Use watchlistAPI.removeFromWatchlist() instead to avoid quota issues');
};

export const getWatchlist = async (userId: string) => {
  // DISABLED: Direct Firebase call - using server API instead
  throw new Error('Use watchlistAPI.getWatchlist() instead to avoid quota issues');
};

export const addRating = async (userId: string, movieId: number, mediaType: string, rating: number, review?: string) => {
  // DISABLED: Direct Firebase call - using server API instead
  throw new Error('Use ratingsAPI.addOrUpdateRating() instead to avoid quota issues');
};

export const getUserProfile = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data();
  }
  return null;
};

export const updateUserProfile = async (userId: string, data: any) => {
  const userRef = doc(db, 'users', userId);
  return await setDoc(userRef, {
    ...data,
    updatedAt: new Date(),
  }, { merge: true });
};