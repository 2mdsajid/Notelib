import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAfRR7jxIhaFclZT_-D-ooaEPWIdzFLk4A",
  authDomain: "note-library-2.firebaseapp.com",
  projectId: "note-library-2",
  storageBucket: "note-library-2.firebasestorage.app",
  messagingSenderId: "359021216370",
  appId: "1:359021216370:web:baf32d42e9e0f3642af8eb",
  measurementId: "G-YYN1Q86RCV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };