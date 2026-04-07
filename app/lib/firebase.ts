import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAhrG3_EINaKy2Zr2lbWTtFt44ugBJhxWs",
  authDomain: "hybr-34e6e.firebaseapp.com",
  projectId: "hybr-34e6e",
  storageBucket: "hybr-34e6e.firebasestorage.app",
  messagingSenderId: "969314849414",
  appId: "1:969314849414:web:b438b6ae532b78c2a4f707",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);