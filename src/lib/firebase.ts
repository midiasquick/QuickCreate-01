
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyC4UjR8BgBSWcc77zrEXGCMN69aGZp7_3o",
  authDomain: "quickcreate-01.firebaseapp.com",
  projectId: "quickcreate-01",
  storageBucket: "quickcreate-01.firebasestorage.app",
  messagingSenderId: "902447780168",
  appId: "1:902447780168:web:2fd6a7ff4887ad1dade37d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export instances
export const auth = getAuth(app);
export const db = getFirestore(app);
