import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// import.meta.env may be untyped in some TS configs; cast to any to avoid
// "Property 'env' does not exist on type 'ImportMeta'" errors.
const _env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: _env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: _env.VITE_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: _env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: _env.VITE_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: _env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: _env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

// Inicializar Firebase apenas se tiver configurações válidas
const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'demo-key' &&
  firebaseConfig.projectId !== 'demo-project';

let app;
let auth;
let db;
let storage;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  console.warn('⚠️ Firebase não configurado. Use dados mock.');
  // Criar objetos mock para evitar erros
  auth = {} as any;
  db = {} as any;
  storage = {} as any;
}

export { auth, db, storage };
export default app;
