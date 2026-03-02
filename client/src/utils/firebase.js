import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_KEY,
  authDomain: "ai-interviewer-e151c.firebaseapp.com",
  projectId: "ai-interviewer-e151c",
  storageBucket: "ai-interviewer-e151c.firebasestorage.app",
  messagingSenderId: "287510936277",
  appId: "1:287510936277:web:ede17f98859f726638005c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider()

export {auth, provider};