import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCfTDq2_ITIvsS_oYdgBegDYzWEZX-wuhA",
  authDomain: "gen-lang-client-0547046557.firebaseapp.com",
  projectId: "gen-lang-client-0547046557",
  storageBucket: "gen-lang-client-0547046557.firebasestorage.app",
  messagingSenderId: "450494401547",
  appId: "1:450494401547:web:db9980303351cdbe08cb0e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-1ce9c7cb-6a1b-4cf7-893c-883619d890ca");
export const googleProvider = new GoogleAuthProvider();

// Custom scopes can be added here if needed, but not necessary for basic info
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

export const logOut = () => {
  return signOut(auth);
};

export { onAuthStateChanged };
export type { User };
