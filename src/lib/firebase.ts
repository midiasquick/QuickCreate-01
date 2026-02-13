import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// IMPORTANTE: Exportar a config para o AppContext usar
export const firebaseConfig = {
  apiKey: "AIzaSyC4UjR8BgBSWcc77zrEXGCMN69aGZp7_3o",
  authDomain: "quickcreate-01.firebaseapp.com",
  projectId: "quickcreate-01",
  storageBucket: "quickcreate-01.firebasestorage.app",
  messagingSenderId: "902447780168",
  appId: "1:902447780168:web:2fd6a7ff4887ad1dade37d"
};

// Initialize Firebase (Standard v9 pattern)
// In a typical client-side environment (Vite/React), module evaluation caching ensures 
// this runs once. If using HMR or similar, this might re-run, but v9 generally tolerates it 
// or we can handle it if strictly needed. For now, using direct initialization 
// to resolve missing 'getApps'/'getApp' export errors.
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;