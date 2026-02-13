import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyC4UjR8BgBSWcc77zrEXGCMN69aGZp7_3o",
  authDomain: "quickcreate-01.firebaseapp.com",
  projectId: "quickcreate-01",
  storageBucket: "quickcreate-01.firebasestorage.app",
  messagingSenderId: "902447780168",
  appId: "1:902447780168:web:2fd6a7ff4887ad1dade37d"
};

// Initialize Firebase (Check for existing apps to prevent re-initialization)
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

// Export instances
export const auth = app.auth();
export const db = app.firestore();
