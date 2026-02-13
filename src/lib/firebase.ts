import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyC4UjR8BgBSWcc77zrEXGCMN69aGZp7_3o",
  authDomain: "quickcreate-01.firebaseapp.com",
  projectId: "quickcreate-01",
  storageBucket: "quickcreate-01.firebasestorage.app",
  messagingSenderId: "902447780168",
  appId: "1:902447780168:web:2fd6a7ff4887ad1dade37d"
};

const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

export const auth = app.auth();
export const db = getFirestore(app);

export default app;