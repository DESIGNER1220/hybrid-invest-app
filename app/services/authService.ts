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
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
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

export type SupportMessage = {
  id: string;
  uid: string;
  senderUid: string;
  senderRole: "admin" | "user";
  text?: string;
  createdAt?: { seconds?: number };
};

export type SupportUser = {
  id: string;
  phone?: string;
  email?: string;
  role?: string;
  blocked?: boolean;
};

export type WheelSpinHistoryItem = {
  id: string;
  uid: string;
  reward: number;
  label: string;
  createdAt?: { seconds?: number };
};

export type GlobalChatMessage = {
  id: string;
  uid: string;
  senderName: string;
  senderRole: "admin" | "user";
  text: string;
  imageDataUrl?: string;
  createdAt?: { seconds?: number };
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
  {
    id: "alto-btc-1",
    name: "ALTO RENDIMENTO - MAQUINA BITCOIN S9",
    amount: 200,
    dailyRate: 4.2,
    durationDays: 30,
    finalReturn: 452,
  },
  {
    id: "alto-btc-2",
    name: "ALTO RENDIMENTO - MAQUINA BITCOIN S17",
    amount: 500,
    dailyRate: 4.8,
    durationDays: 30,
    finalReturn: 1220,
  },
  {
    id: "alto-btc-3",
    name: "ALTO RENDIMENTO - MAQUINA BITCOIN S19",
    amount: 1000,
    dailyRate: 5.5,
    durationDays: 30,
    finalReturn: 2650,
  },
  {
    id: "alto-btc-4",
    name: "ALTO RENDIMENTO - MAQUINA BITCOIN S19 PRO",
    amount: 2500,
    dailyRate: 6.0,
    durationDays: 35,
    finalReturn: 7750,
  },
  {
    id: "alto-btc-5",
    name: "ALTO RENDIMENTO - MAQUINA BITCOIN S21",
    amount: 5000,
    dailyRate: 6.5,
    durationDays: 40,
    finalReturn: 18000,
  },
  {
    id: "alto-btc-6",
    name: "ALTO RENDIMENTO - MAQUINA BITCOIN S21 PRO",
    amount: 10000,
    dailyRate: 7.0,
    durationDays: 45,
    finalReturn: 41500,
  },
  {
    id: "alto-btc-7",
    name: "ALTO RENDIMENTO - MAQUINA BITCOIN ULTRA",
    amount: 20000,
    dailyRate: 7.8,
    durationDays: 50,
    finalReturn: 98000,
  },
  {
    id: "alto-btc-8",
    name: "ALTO RENDIMENTO - MAQUINA BITCOIN TITAN",
    amount: 50000,
    dailyRate: 8.5,
    durationDays: 60,
    finalReturn: 305000,
  },
];

const ADMIN_PHONE = "869933273";
const DAILY_SPIN_HARD_LIMIT = 20;
const SPIN_COOLDOWN_MS = 10_000;

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

  const fullDays = Math.min(
    durationDays,
    getElapsedFullDays(investment.createdAt)
  );

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

function getTodayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function chooseWeightedReward(
  options: Array<{ reward: number; weight: number }>
) {
  const total = options.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * total;

  for (const item of options) {
    random -= item.weight;
    if (random <= 0) return item.reward;
  }

  return options[options.length - 1].reward;
}

function getRewardLabel(reward: number) {
  if (reward <= 0) return "BOA SORTE";
  return `${reward} MZN`;
}

async function getTotalInvested(uid: string) {
  const q = query(collection(db, "investments"), where("uid", "==", uid));
  const snapshot = await getDocs(q);

  let totalInvested = 0;
  snapshot.forEach((item) => {
    totalInvested += Number(item.data().amount ?? 0);
  });

  return totalInvested;
}

export async function countReferralsByCode(referralCode: string) {
  const normalizedCode = String(referralCode || "").trim().toUpperCase();

  if (!normalizedCode) return 0;

  const q = query(
    collection(db, "users"),
    where("referredBy", "==", normalizedCode)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
}

export function getVipLevelByReferrals(referrals: number) {
  if (referrals >= 10) return "VIP5";
  if (referrals >= 8) return "VIP4";
  if (referrals >= 5) return "VIP3";
  if (referrals >= 3) return "VIP2";
  return "VIP1";
}

export function getWithdrawalFeePercentByReferrals(referrals: number) {
  if (referrals >= 10) return 0;
  if (referrals >= 8) return 4;
  if (referrals >= 5) return 6;
  if (referrals >= 3) return 10;
  return 12;
}

function getWheelRewardByInvestment(totalInvested: number) {
  if (totalInvested < 100) {
    return 0;
  }

  if (totalInvested >= 50000) {
    return chooseWeightedReward([
      { reward: 0, weight: 35 },
      { reward: 5, weight: 20 },
      { reward: 10, weight: 18 },
      { reward: 50, weight: 12 },
      { reward: 500, weight: 10 },
      { reward: 1000, weight: 5 },
    ]);
  }

  if (totalInvested >= 1000) {
    return chooseWeightedReward([
      { reward: 0, weight: 50 },
      { reward: 5, weight: 25 },
      { reward: 10, weight: 15 },
      { reward: 50, weight: 8 },
      { reward: 500, weight: 2 },
    ]);
  }

  return chooseWeightedReward([
    { reward: 0, weight: 65 },
    { reward: 5, weight: 20 },
    { reward: 10, weight: 12 },
    { reward: 50, weight: 3 },
  ]);
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

  const normalizedRefCode = String(refCode || "").trim().toUpperCase();
  let validRefCode: string | null = null;

  if (normalizedRefCode) {
    const refQuery = query(
      collection(db, "users"),
      where("referralCode", "==", normalizedRefCode)
    );
    const refSnap = await getDocs(refQuery);

    if (!refSnap.empty) {
      validRefCode = normalizedRefCode;
    }
  }

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;
  const referralCode = await generateUniqueReferralCode(phone);
  const role = phoneNormalized === ADMIN_PHONE ? "admin" : "user";

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email,
    phone,
    phoneNormalized,
    referralCode,
    referredBy: validRefCode,
    balance: 0,
    bonus: 0,
    totalProfit: 0,
    referrals: 0,
    role,
    blocked: false,
    spinsUsedToday: 0,
    lastSpinDate: "",
    lastSpinAt: null,
    createdAt: serverTimestamp(),
  });

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

  const userData: any = docSnap.data();

  const referralCode = String(userData.referralCode || "")
    .trim()
    .toUpperCase();

  const storedReferrals = Number(userData.referrals ?? 0);
  const realReferrals = referralCode
    ? await countReferralsByCode(referralCode)
    : 0;

  const referrals = Math.max(storedReferrals, realReferrals);
  const vipLevel = getVipLevelByReferrals(referrals);
  const withdrawalFeePercent = getWithdrawalFeePercentByReferrals(referrals);

  return {
    ...userData,
    referrals,
    vipLevel,
    withdrawalFeePercent,
  };
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

  if (type === "levantamento") {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("Utilizador não encontrado.");
    }

    const userData: any = userSnap.data();

    if (userData?.blocked === true) {
      throw new Error("Negado, conta bloqueada");
    }
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
      const referralCode = String(userData.referralCode || "")
        .trim()
        .toUpperCase();

      const realReferrals = referralCode
        ? await countReferralsByCode(referralCode)
        : 0;

      const referrals = Math.max(
        Number(userData.referrals ?? 0),
        Number(realReferrals ?? 0)
      );

      const feePercent = getWithdrawalFeePercentByReferrals(referrals);
      const feeAmount = round2(amount * (feePercent / 100));
      const totalDeduction = round2(amount + feeAmount);

      const available = currentBalance + currentTotalProfit + currentBonus;

      if (available < totalDeduction) {
        throw new Error(
          `Saldo insuficiente para aprovar levantamento. Necessário: ${totalDeduction} MZN`
        );
      }

      let remaining = totalDeduction;
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
      }

      tx.update(userRef, {
        balance: round2(newBalance),
        totalProfit: round2(newTotalProfit),
        bonus: round2(newBonus),
        referrals: referrals,
      });

      tx.update(transactionRef, {
        withdrawalFeePercent: feePercent,
        withdrawalFeeAmount: feeAmount,
        withdrawalNetAmount: round2(amount),
        withdrawalTotalDeduction: totalDeduction,
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
    const currentBalance = round2(Number(userData.balance ?? 0));
    const planAmount = round2(Number(plan.amount ?? 0));

    if (currentBalance < planAmount) {
      throw new Error(
        `Saldo insuficiente. Saldo atual: ${currentBalance} MZN | Necessário: ${planAmount} MZN`
      );
    }

    tx.update(userRef, {
      balance: round2(currentBalance - planAmount),
    });
  });

  await addDoc(collection(db, "investments"), {
    uid,
    planId: plan.id,
    planName: plan.name,
    amount: plan.amount,
    dailyRate: plan.dailyRate,
    durationDays: plan.durationDays,
    totalProfit: round2(
      plan.amount * (plan.dailyRate / 100) * plan.durationDays
    ),
    finalReturn:
      plan.finalReturn ??
      round2(
        plan.amount +
          plan.amount * (plan.dailyRate / 100) * plan.durationDays
      ),
    isPremium: !!plan.isPremium,
    status: "ativo",
    createdAt: serverTimestamp(),
  });

  await syncUserProfit(uid);

  return {
    success: true,
    message: "Alugado com sucesso",
  };
}

export async function getUserInvestments(uid: string) {
  await syncUserProfit(uid);

  const q = query(collection(db, "investments"), where("uid", "==", uid));
  const snapshot = await getDocs(q);

  const data = snapshot.docs.map((item) => {
    const investment: any = item.data();
    const elapsedDays = getElapsedFullDays(investment.createdAt);
    const cappedDays = Math.min(
      Number(investment.durationDays ?? 0),
      elapsedDays
    );
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

  if (!code) throw new Error("Informe o código.");
  if (!amount || amount <= 0) throw new Error("Informe um valor válido.");

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

export async function spinWheel(uid: string) {
  const userRef = doc(db, "users", uid);
  const todayKey = getTodayKey();
  const totalInvested = await getTotalInvested(uid);

  const reward = getWheelRewardByInvestment(totalInvested);
  const rewardLabel = getRewardLabel(reward);

  const userSnapBefore = await getDoc(userRef);
  if (!userSnapBefore.exists()) {
    throw new Error("Usuário não encontrado");
  }

  const userDataBefore: any = userSnapBefore.data();
  const realReferrals = await countReferralsByCode(
    String(userDataBefore.referralCode || "").trim().toUpperCase()
  );

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) {
      throw new Error("Usuário não encontrado");
    }

    const userData: any = userSnap.data();
    const referrals = Math.max(
      Number(userData.referrals ?? 0),
      Number(realReferrals ?? 0)
    );

    if (referrals < 1) {
      throw new Error("Convide pelo menos 1 amigo");
    }

    const lastSpinDate = userData.lastSpinDate ?? "";
    const lastSpinAt = userData.lastSpinAt as Timestamp | null;
    const previousSpinsUsedToday =
      lastSpinDate === todayKey ? Number(userData.spinsUsedToday ?? 0) : 0;

    const availableSpins = Math.min(referrals, DAILY_SPIN_HARD_LIMIT);

    if (previousSpinsUsedToday >= availableSpins) {
      throw new Error("Limite diário atingido");
    }

    if (
      lastSpinAt?.toMillis &&
      Date.now() - lastSpinAt.toMillis() < SPIN_COOLDOWN_MS
    ) {
      throw new Error("Aguarde alguns segundos para girar novamente");
    }

    const nextUpdate: Record<string, any> = {
      lastSpinDate: todayKey,
      lastSpinAt: serverTimestamp(),
      spinsUsedToday: previousSpinsUsedToday + 1,
      referrals: referrals,
    };

    if (reward > 0) {
      nextUpdate.bonus = increment(reward);
    }

    tx.update(userRef, nextUpdate);
  });

  await addDoc(collection(db, "wheelSpins"), {
    uid,
    reward,
    label: rewardLabel,
    investedAmount: totalInvested,
    createdAt: serverTimestamp(),
  });

  return {
    reward,
    label: rewardLabel,
  };
}

export async function getWheelSpinHistory(uid: string) {
  const q = query(
    collection(db, "wheelSpins"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as WheelSpinHistoryItem[];
}

export async function sendSupportMessage(params: {
  threadUid: string;
  senderUid: string;
  senderRole: "admin" | "user";
  text?: string;
}) {
  const { threadUid, senderUid, senderRole, text } = params;

  if (!text?.trim()) {
    throw new Error("Escreva uma mensagem.");
  }

  await addDoc(collection(db, "supportChats", threadUid, "messages"), {
    uid: threadUid,
    senderUid,
    senderRole,
    text: text.trim(),
    createdAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, "supportChats", threadUid),
    {
      uid: threadUid,
      lastMessage: text.trim(),
      lastSenderRole: senderRole,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function subscribeSupportMessages(
  threadUid: string,
  callback: (messages: SupportMessage[]) => void
) {
  const q = query(
    collection(db, "supportChats", threadUid, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as SupportMessage[];

    callback(data);
  });
}

export async function getSupportUsers() {
  const q = query(collection(db, "users"), where("role", "==", "user"));
  const snapshot = await getDocs(q);

  const data = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as SupportUser[];

  return data.sort((a, b) => (a.phone || "").localeCompare(b.phone || ""));
}

export async function sendGlobalChatMessage(params: {
  uid: string;
  text?: string;
  imageDataUrl?: string;
}) {
  const { uid, text, imageDataUrl } = params;

  const cleanText = text?.trim() || "";
  const cleanImage = imageDataUrl || "";

  if (!cleanText && !cleanImage) {
    throw new Error("Escreva uma mensagem ou selecione uma imagem.");
  }

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("Utilizador não encontrado.");
  }

  const userData: any = userSnap.data();

  const senderRole: "admin" | "user" =
    userData?.role === "admin" ? "admin" : "user";

  const senderName =
    senderRole === "admin" ? "Administrador" : "Número de telefone";

  await addDoc(collection(db, "globalChatMessages"), {
    uid,
    senderName,
    senderRole,
    text: cleanText,
    imageDataUrl: cleanImage,
    createdAt: serverTimestamp(),
  });
}

export function subscribeGlobalChatMessages(
  callback: (messages: GlobalChatMessage[]) => void
) {
  const q = query(
    collection(db, "globalChatMessages"),
    orderBy("createdAt", "asc"),
    limit(200)
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as GlobalChatMessage[];

    callback(data);
  });
}

export async function getTodayHistory(uid: string) {
  const now = Date.now();
  const last24hMs = now - 24 * 60 * 60 * 1000;

  const [transactionsSnap, referralSnap, wheelSnap] = await Promise.all([
    getDocs(query(collection(db, "transactions"), where("uid", "==", uid))),
    getDocs(
      query(collection(db, "referralEarnings"), where("referrerId", "==", uid))
    ),
    getDocs(query(collection(db, "wheelSpins"), where("uid", "==", uid))),
  ]);

  const transactions = transactionsSnap.docs.map((item) => ({
    id: item.id,
    sourceType: "transaction" as const,
    ...item.data(),
  }));

  const referralEarnings = referralSnap.docs.map((item) => ({
    id: item.id,
    sourceType: "referral" as const,
    ...item.data(),
  }));

  const wheelSpins = wheelSnap.docs.map((item) => ({
    id: item.id,
    sourceType: "wheel" as const,
    ...item.data(),
  }));

  const merged = [...transactions, ...referralEarnings, ...wheelSpins];

  return merged
    .filter((item: any) => {
      const createdAtMs = Number(item.createdAt?.seconds ?? 0) * 1000;
      return createdAtMs >= last24hMs;
    })
    .sort((a: any, b: any) => {
      const aSec = Number(a.createdAt?.seconds ?? 0);
      const bSec = Number(b.createdAt?.seconds ?? 0);
      return bSec - aSec;
    });
}

export async function getAllUsers() {
  const snapshot = await getDocs(collection(db, "users"));

  const data = snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));

  return data.sort((a: any, b: any) => {
    const aSec = Number(a.createdAt?.seconds ?? 0);
    const bSec = Number(b.createdAt?.seconds ?? 0);
    return bSec - aSec;
  });
}

export async function setUserBlockedStatus(uid: string, blocked: boolean) {
  const userRef = doc(db, "users", uid);

  await updateDoc(userRef, {
    blocked,
  });
}