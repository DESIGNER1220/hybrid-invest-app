import { auth, db } from "../lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

export type TransactionType = "deposito" | "levantamento";
export type PaymentMethod = "M-Pesa" | "E-mola";

export type InvestmentPlan = {
  id: string;
  name: string;
  amount: number;
  dailyRate: number;
  durationDays: number;
};

export const INVESTMENT_PLANS: InvestmentPlan[] = [
  {
    id: "hybr-1",
    name: "HYBR-1",
    amount: 100,
    dailyRate: 1.9,
    durationDays: 21,
  },
  {
    id: "hybr-2",
    name: "HYBR-2",
    amount: 350,
    dailyRate: 1.5,
    durationDays: 21,
  },
  {
    id: "hybr-3",
    name: "HYBR-3",
    amount: 500,
    dailyRate: 2.1,
    durationDays: 30,
  },
  {
    id: "hybr-4",
    name: "HYBR-4",
    amount: 1000,
    dailyRate: 3.0,
    durationDays: 45,
  },
  {
    id: "hybr-5",
    name: "HYBR-5",
    amount: 1500,
    dailyRate: 2.7,
    durationDays: 90,
  },
];

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function generateReferralCode(email: string, phone: string) {
  const emailPart = email.split("@")[0].slice(0, 4).toUpperCase();
  const phonePart = normalizePhone(phone).slice(-4);
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${emailPart}${phonePart}${random}`;
}

export async function registerUser(params: {
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  refCode?: string | null;
}) {
  const { email, phone, password, confirmPassword, refCode } = params;

  if (!email || !phone || !password || !confirmPassword) {
    throw new Error("Preencha todos os campos obrigatórios.");
  }

  if (password !== confirmPassword) {
    throw new Error("As senhas não coincidem.");
  }

  if (password.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }

  const phoneNormalized = normalizePhone(phone);

  const existingPhoneQuery = query(
    collection(db, "users"),
    where("phoneNormalized", "==", phoneNormalized)
  );

  const existingPhoneSnap = await getDocs(existingPhoneQuery);

  if (!existingPhoneSnap.empty) {
    throw new Error("Este número de telefone já está registado.");
  }

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;
  const referralCode = generateReferralCode(email, phone);

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email,
    phone,
    phoneNormalized,
    referralCode,
    referredBy: refCode || null,
    balance: 0,
    bonus: 0,
    totalProfit: 0,
    referrals: 0,
    role: "user",
    createdAt: serverTimestamp(),
  });

  if (refCode) {
    const refQuery = query(
      collection(db, "users"),
      where("referralCode", "==", refCode)
    );

    const refSnap = await getDocs(refQuery);

    if (!refSnap.empty) {
      const referrerDoc = refSnap.docs[0];

      await updateDoc(referrerDoc.ref, {
        referrals: increment(1),
        bonus: increment(10),
      });
    }
  }

  return userCredential;
}

export async function loginUserByPhone(phone: string, password: string) {
  const phoneNormalized = normalizePhone(phone);

  const q = query(
    collection(db, "users"),
    where("phoneNormalized", "==", phoneNormalized)
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("Número de telefone não encontrado.");
  }

  const userData = querySnapshot.docs[0].data();

  if (!userData.email) {
    throw new Error("Conta inválida. Email não encontrado.");
  }

  return await signInWithEmailAndPassword(auth, userData.email, password);
}

export async function logoutUser() {
  return await signOut(auth);
}

export async function getUserProfile(uid: string) {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return docSnap.data();
}

export async function createTransaction(params: {
  uid: string;
  type: TransactionType;
  method: PaymentMethod;
  phone: string;
  amount: number;
}) {
  const { uid, type, method, phone, amount } = params;

  if (!uid) throw new Error("Utilizador inválido.");
  if (!phone.trim()) throw new Error("Informe o número.");
  if (!amount || amount <= 0) throw new Error("Informe um valor válido.");

  await addDoc(collection(db, "transactions"), {
    uid,
    type,
    method,
    phone,
    amount: Number(amount),
    status: "pendente",
    createdAt: serverTimestamp(),
  });
}

export async function getUserTransactions(uid: string) {
  const q = query(collection(db, "transactions"), where("uid", "==", uid));
  const snapshot = await getDocs(q);

  const data = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));

  return data.sort((a: any, b: any) => {
    const aSec = a.createdAt?.seconds ?? 0;
    const bSec = b.createdAt?.seconds ?? 0;
    return bSec - aSec;
  });
}

export async function getPendingTransactions() {
  const q = query(
    collection(db, "transactions"),
    where("status", "==", "pendente")
  );

  const snapshot = await getDocs(q);

  const data = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));

  return data.sort((a: any, b: any) => {
    const aSec = a.createdAt?.seconds ?? 0;
    const bSec = b.createdAt?.seconds ?? 0;
    return bSec - aSec;
  });
}

export async function approveTransaction(transactionId: string) {
  const transactionRef = doc(db, "transactions", transactionId);

  await runTransaction(db, async (tx) => {
    const transactionSnap = await tx.get(transactionRef);

    if (!transactionSnap.exists()) {
      throw new Error("Transação não encontrada.");
    }

    const transactionData: any = transactionSnap.data();

    if (transactionData.status !== "pendente") {
      throw new Error("Esta transação já foi processada.");
    }

    const userRef = doc(db, "users", transactionData.uid);
    const userSnap = await tx.get(userRef);

    if (!userSnap.exists()) {
      throw new Error("Utilizador não encontrado.");
    }

    const userData: any = userSnap.data();
    const currentBalance = Number(userData.balance ?? 0);
    const currentTotalProfit = Number(userData.totalProfit ?? 0);
    const amount = Number(transactionData.amount ?? 0);

    if (transactionData.type === "deposito") {
      tx.update(userRef, {
        balance: round2(currentBalance + amount),
      });
    }

    if (transactionData.type === "levantamento") {
      const available = currentBalance + currentTotalProfit;

      if (available < amount) {
        throw new Error("Saldo insuficiente para aprovar levantamento.");
      }

      let newBalance = currentBalance;
      let newTotalProfit = currentTotalProfit;

      if (newBalance >= amount) {
        newBalance = newBalance - amount;
      } else {
        const remaining = amount - newBalance;
        newBalance = 0;
        newTotalProfit = Math.max(0, newTotalProfit - remaining);
      }

      tx.update(userRef, {
        balance: round2(newBalance),
        totalProfit: round2(newTotalProfit),
      });
    }

    tx.update(transactionRef, {
      status: "aprovado",
      processedAt: serverTimestamp(),
    });
  });
}

export async function rejectTransaction(transactionId: string) {
  const transactionRef = doc(db, "transactions", transactionId);

  await updateDoc(transactionRef, {
    status: "rejeitado",
    processedAt: serverTimestamp(),
  });
}

export async function buyInvestmentPlan(params: {
  uid: string;
  planId: string;
}) {
  const { uid, planId } = params;

  const plan = INVESTMENT_PLANS.find((item) => item.id === planId);

  if (!plan) {
    throw new Error("Plano não encontrado.");
  }

  const userRef = doc(db, "users", uid);

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);

    if (!userSnap.exists()) {
      throw new Error("Utilizador não encontrado.");
    }

    const userData: any = userSnap.data();
    const currentBalance = Number(userData.balance ?? 0);

    if (currentBalance < plan.amount) {
      throw new Error("Saldo insuficiente para investir neste plano.");
    }

    const totalProfitForPlan = round2(
      plan.amount * (plan.dailyRate / 100) * plan.durationDays
    );

    tx.update(userRef, {
      balance: round2(currentBalance - plan.amount),
      totalProfit: round2(Number(userData.totalProfit ?? 0) + totalProfitForPlan),
    });
  });

  await addDoc(collection(db, "investments"), {
    uid,
    planId: plan.id,
    planName: plan.name,
    amount: plan.amount,
    dailyRate: plan.dailyRate,
    durationDays: plan.durationDays,
    totalProfit: round2(plan.amount * (plan.dailyRate / 100) * plan.durationDays),
    status: "ativo",
    createdAt: serverTimestamp(),
  });
}

export async function getUserInvestments(uid: string) {
  const q = query(collection(db, "investments"), where("uid", "==", uid));
  const snapshot = await getDocs(q);

  const data = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));

  return data.sort((a: any, b: any) => {
    const aSec = a.createdAt?.seconds ?? 0;
    const bSec = b.createdAt?.seconds ?? 0;
    return bSec - aSec;
  });
}