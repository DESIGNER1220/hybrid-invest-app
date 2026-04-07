import { auth, db } from "../lib/firebase";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

// 🔹 Gerar código de referral completo
function generateReferralCode(email: string) {
  const base = email
    .split("@")[0]
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, "X");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${base}${random}`;
}

// 🔹 Registrar usuário
export async function registerUser(
  email: string,
  password: string,
  phone: string,
  ref?: string | null
) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  const referralCode = generateReferralCode(email);
  const referredBy = ref?.trim() || null;

  // 🔹 Criar usuário no Firestore
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    phone,
    balance: 0,
    bonus: 0,
    referrals: 0,
    referralCode,
    referredBy,
    createdAt: serverTimestamp(),
  });

  // 🔥 Atualizar quem convidou
  if (ref) {
    const q = query(
      collection(db, "users"),
      where("referralCode", "==", ref)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const referrerDoc = querySnapshot.docs[0];

      await updateDoc(referrerDoc.ref, {
        referrals: increment(1),
        bonus: increment(10), // 💰 bônus por convite
      });
    }
  }
}

// 🔹 Login
export async function loginUser(email: string, password: string) {
  return await signInWithEmailAndPassword(auth, email, password);
}

// 🔹 Logout
export async function logoutUser() {
  return await signOut(auth);
}

// 🔹 Buscar perfil do usuário
export async function getUserProfile(uid: string) {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return null;
  }
}