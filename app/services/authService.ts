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
  finalReturn?: number;
  isPremium?: boolean;
};

export const INVESTMENT_PLANS: InvestmentPlan[] = [
  {
    id: "premium-1",
    name: "HYBRD PREMIUM 1",
    amount: 1000,
    dailyRate: 14.7,
    durationDays: 15,
    finalReturn: 3205,
    isPremium: true,
  },
  {
    id: "premium-2",
    name: "HYBRD PREMIUM 2",
    amount: 100,
    dailyRate: 13.6666667,
    durationDays: 15,
    finalReturn: 305,
    isPremium: true,
  },
  {
    id: "premium-3",
    name: "HYBRD PREMIUM 3",
    amount: 500,
    dailyRate: 14.7333333,
    durationDays: 15,
    finalReturn: 1605,
    isPremium: true,
  },
  {
    id: "premium-4",
    name: "HYBRD PREMIUM 4",
    amount: 10000,
    dailyRate: 10.1366667,
    durationDays: 15,
    finalReturn: 25205,
    isPremium: true,
  },
  {
    id: "hybr-1",
    name: "HYBR-1",
    amount: 100,
    dailyRate: 1.9,
    durationDays: 21,
    isPremium: false,
  },
  {
    id: "hybr-2",
    name: "HYBR-2",
    amount: 350,
    dailyRate: 1.5,
    durationDays: 21,
    isPremium: false,
  },
  {
    id: "hybr-3",
    name: "HYBR-3",
    amount: 500,
    dailyRate: 2.1,
    durationDays: 30,
    isPremium: false,
  },
  {
    id: "hybr-4",
    name: "HYBR-4",
    amount: 1000,
    dailyRate: 3.0,
    durationDays: 45,
    isPremium: false,
  },
  {
    id: "hybr-5",
    name: "HYBR-5",
    amount: 1500,
    dailyRate: 2.7,
    durationDays: 90,
    isPremium: false,
  },
];

const ADMIN_PHONE = "869933273";

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function getElapsedFullDays(timestamp?: { seconds?: number }) {
  if (!timestamp?.seconds) return 0;

  const createdAtMs = timestamp.seconds * 1000;
  const nowMs = Date.now();
  const diffMs = nowMs - createdAtMs;

  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function calculateAccruedProfitForInvestment(investment: any) {
  const amount = Number(investment.amount ?? 0);
  const dailyRate = Number(investment.dailyRate ?? 0);
  const durationDays = Number(investment.durationDays ?? 0);

  const fullDays = Math.min(durationDays, getElapsedFullDays(investment.createdAt));

  return round2(amount * (dailyRate / 100) * fullDays);
}

async function generateUniqueReferralCode(phone: string) {
  const phoneNormalized = normalizePhone(phone);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let attempt = 0; attempt < 50; attempt++) {
    const randomLetters =
      letters[Math.floor(Math.random() * letters.length)] +
      letters[Math.floor(Math.random() * letters.length)];

    const referralCode = `${phoneNormalized}${randomLetters}`;

    const refQuery = query(
      collection(db, "users"),
      where("referralCode", "==", referralCode)
    );

    const refSnap = await getDocs(refQuery);

    if (refSnap.empty) return referralCode;
  }

  throw new Error("Não foi possível gerar um código de referência único.");
}

function normalizeBonusCode(code: string) {
  return code.trim().toUpperCase();
}

export async function generateRandomBonusCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let attempt = 0; attempt < 50; attempt++) {
    let code = "BONUS-";

    for (let i = 0; i < 8; i++) {
      code += letters[Math.floor(Math.random() * letters.length)];
    }

    const bonusRef = doc(db, "bonusCodes", code);
    const bonusSnap = await getDoc(bonusRef);

    if (!bonusSnap.exists()) {
      return code;
    }
  }

  throw new Error("Não foi possível gerar código de bónus.");
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

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const referralCode = await generateUniqueReferralCode(phone);
  const role = phoneNormalized === ADMIN_PHONE ? "admin" : "user";

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
    role,
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

export async function syncUserProfit(uid: string) {
  const investmentsQuery = query(
    collection(db, "investments"),
    where("uid", "==", uid)
  );

  const snapshot = await getDocs(investmentsQuery);

  let totalAccruedProfit = 0;

  snapshot.docs.forEach((item) => {
    const data: any = item.data();
    if (data.status === "ativo") {
      totalAccruedProfit += calculateAccruedProfitForInvestment(data);
    }
  });

  const roundedProfit = round2(totalAccruedProfit);

  await updateDoc(doc(db, "users", uid), {
    totalProfit: roundedProfit,
  });

  return roundedProfit;
}

export async function getUserProfile(uid: string) {
  try {
    await syncUserProfit(uid);
  } catch (error) {
    console.error("Erro ao sincronizar lucro:", error);
  }

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
  transactionCode?: string;
}) {
  const { uid, type, method, phone, amount, transactionCode } = params;

  if (!uid) throw new Error("Utilizador inválido.");
  if (!phone.trim()) throw new Error("Informe o número.");
  if (!amount || amount <= 0) throw new Error("Informe um valor válido.");

  if (type === "deposito" && !transactionCode?.trim()) {
    throw new Error("Informe o ID da transação.");
  }

  await addDoc(collection(db, "transactions"), {
    uid,
    type,
    method,
    phone,
    amount: Number(amount),
    transactionCode: transactionCode?.trim() || "",
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
    const currentBonus = Number(userData.bonus ?? 0);
    const amount = Number(transactionData.amount ?? 0);

    if (transactionData.type === "deposito") {
      tx.update(userRef, {
        balance: round2(currentBalance + amount),
      });

      const referredBy = userData.referredBy;

      if (referredBy) {
        const refQuery = query(
          collection(db, "users"),
          where("referralCode", "==", referredBy)
        );

        const refSnap = await getDocs(refQuery);

        if (!refSnap.empty) {
          const referrerDoc = refSnap.docs[0];
          const referrerData: any = referrerDoc.data();
          const commission = round2(amount * 0.05);

          tx.update(referrerDoc.ref, {
            bonus: round2(Number(referrerData.bonus ?? 0) + commission),
          });

          await addDoc(collection(db, "referralEarnings"), {
            referrerId: referrerDoc.id,
            fromUserId: transactionData.uid,
            depositTransactionId: transactionId,
            depositAmount: amount,
            commissionAmount: commission,
            createdAt: serverTimestamp(),
          });
        }
      }
    }

    if (transactionData.type === "levantamento") {
      const available = currentBalance + currentTotalProfit + currentBonus;

      if (available < amount) {
        throw new Error("Saldo insuficiente para aprovar levantamento.");
      }

      let remaining = amount;
      let newBalance = currentBalance;
      let newTotalProfit = currentTotalProfit;
      let newBonus = currentBonus;

      if (newBalance >= remaining) {
        newBalance -= remaining;
        remaining = 0;
      } else {
        remaining -= newBalance;
        newBalance = 0;
      }

      if (remaining > 0) {
        if (newTotalProfit >= remaining) {
          newTotalProfit -= remaining;
          remaining = 0;
        } else {
          remaining -= newTotalProfit;
          newTotalProfit = 0;
        }
      }

      if (remaining > 0) {
        newBonus = Math.max(0, newBonus - remaining);
        remaining = 0;
      }

      tx.update(userRef, {
        balance: round2(newBalance),
        totalProfit: round2(newTotalProfit),
        bonus: round2(newBonus),
      });
    }

    tx.update(transactionRef, {
      status: "aprovado",
      processedAt: serverTimestamp(),
    });
  });

  const transactionSnap = await getDoc(transactionRef);

  if (transactionSnap.exists()) {
    const transactionData: any = transactionSnap.data();
    if (transactionData?.uid) {
      await syncUserProfit(transactionData.uid);
    }
  }
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
      throw new Error("Saldo insuficiente");
    }

    tx.update(userRef, {
      balance: round2(currentBalance - plan.amount),
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
    finalReturn: plan.finalReturn ?? null,
    isPremium: !!plan.isPremium,
    status: "ativo",
    createdAt: serverTimestamp(),
  });

  await syncUserProfit(uid);
}

export async function getUserInvestments(uid: string) {
  await syncUserProfit(uid);

  const q = query(collection(db, "investments"), where("uid", "==", uid));
  const snapshot = await getDocs(q);

  const data = snapshot.docs.map((item) => {
    const investment: any = item.data();
    const elapsedDays = getElapsedFullDays(investment.createdAt);
    const cappedDays = Math.min(Number(investment.durationDays ?? 0), elapsedDays);
    const remainingDays = Math.max(
      0,
      Number(investment.durationDays ?? 0) - cappedDays
    );
    const accruedProfit = calculateAccruedProfitForInvestment(investment);

    return {
      id: item.id,
      ...investment,
      elapsedDays: cappedDays,
      remainingDays,
      accruedProfit,
    };
  });

  return data.sort((a: any, b: any) => {
    const aSec = a.createdAt?.seconds ?? 0;
    const bSec = b.createdAt?.seconds ?? 0;
    return bSec - aSec;
  });
}

export async function getReferralEarnings(referrerId: string) {
  const q = query(
    collection(db, "referralEarnings"),
    where("referrerId", "==", referrerId)
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

export async function createBonusCode(params: {
  code: string;
  amount: number;
  createdBy: string;
}) {
  const code = normalizeBonusCode(params.code);
  const amount = Number(params.amount);

  if (!code) {
    throw new Error("Informe o código.");
  }

  if (!amount || amount <= 0) {
    throw new Error("Informe um valor válido.");
  }

  const existing = await getDoc(doc(db, "bonusCodes", code));

  if (existing.exists()) {
    throw new Error("Este código já existe.");
  }

  await setDoc(doc(db, "bonusCodes", code), {
    code,
    amount,
    isActive: true,
    used: false,
    usedBy: null,
    usedAt: null,
    createdBy: params.createdBy,
    createdAt: serverTimestamp(),
  });
}

export async function getBonusCodes() {
  const snapshot = await getDocs(collection(db, "bonusCodes"));

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

export async function deactivateBonusCode(code: string) {
  const normalizedCode = normalizeBonusCode(code);

  await updateDoc(doc(db, "bonusCodes", normalizedCode), {
    isActive: false,
  });
}

export async function activateBonusCode(code: string) {
  const normalizedCode = normalizeBonusCode(code);

  await updateDoc(doc(db, "bonusCodes", normalizedCode), {
    isActive: true,
  });
}

export async function redeemBonusCode(uid: string, code: string) {
  const normalizedCode = normalizeBonusCode(code);
  const bonusRef = doc(db, "bonusCodes", normalizedCode);
  const userRef = doc(db, "users", uid);

  await runTransaction(db, async (tx) => {
    const bonusSnap = await tx.get(bonusRef);

    if (!bonusSnap.exists()) {
      throw new Error("Código inválido");
    }

    const bonusData: any = bonusSnap.data();

    if (!bonusData.isActive) {
      throw new Error("Código inativo");
    }

    if (bonusData.used) {
      throw new Error("Código já utilizado");
    }

    const userSnap = await tx.get(userRef);

    if (!userSnap.exists()) {
      throw new Error("Utilizador não encontrado");
    }

    const userData: any = userSnap.data();
    const currentBonus = Number(userData.bonus ?? 0);
    const bonusAmount = Number(bonusData.amount ?? 0);

    tx.update(userRef, {
      bonus: round2(currentBonus + bonusAmount),
    });

    tx.update(bonusRef, {
      used: true,
      isActive: false,
      usedBy: uid,
      usedAt: serverTimestamp(),
    });
  });
}