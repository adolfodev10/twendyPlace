import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY || '',
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID || '',
};

const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== '' &&
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== '';

let app;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  auth = {} as Auth;
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
}

export { auth, db, storage };
export default app;