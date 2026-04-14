import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔥 Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAhrG3_EINaKy2Zr2lbWTtFt44ugBJhxWs",
  authDomain: "hybr-34e6e.firebaseapp.com",
  projectId: "hybr-34e6e",
  storageBucket: "hybr-34e6e.appspot.com",
  messagingSenderId: "969314849414",
  appId: "1:969314849414:web:b438b6ae532b78c2a4f707",
};

// 🔍 DEBUG → para ver qual chave está a ser usada
console.log("API KEY EM USO:", firebaseConfig.apiKey);

// 🔁 Evita erro de múltiplas inicializações
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 🔐 Auth e DB
export const auth = getAuth(app);
export const db = getFirestore(app);