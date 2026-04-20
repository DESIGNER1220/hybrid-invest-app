"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  ArrowDownCircle,
  Copy,
  Check,
} from "lucide-react";

import { auth } from "../lib/firebase";
import { createTransaction, getUserProfile } from "../services/authService";
import BottomNav from "../components/BottomNav";

type UserProfile = {
  balance?: number;
  bonus?: number;
  totalProfit?: number;
};

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("pt-MZ");
}

export default function DepositoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [method, setMethod] = useState<"M-Pesa" | "E-mola">("M-Pesa");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionCode, setTransactionCode] = useState("");

  const [copied, setCopied] = useState<"" | "mpesa" | "emola">("");

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function loadProfile(uid: string) {
    const data = await getUserProfile(uid);
    setProfile((data || null) as UserProfile | null);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        await loadProfile(user.uid);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  async function handleCopy(value: string, type: "mpesa" | "emola") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(type);

      setTimeout(() => {
        setCopied("");
      }, 2000);
    } catch {
      alert("Erro ao copiar");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const uid = auth.currentUser?.uid;

    if (!uid) {
      setErrorMsg("Usuário não autenticado.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");

      if (!phone.trim()) {
        throw new Error("Informe o número de telefone.");
      }

      if (!amount || Number(amount) <= 0) {
        throw new Error("Informe um valor válido.");
      }

      if (!transactionCode.trim()) {
        throw new Error("Informe o ID da transação.");
      }

      await createTransaction({
        uid,
        type: "deposito",
        method,
        phone: phone.trim(),
        amount: Number(amount),
        transactionCode: transactionCode.trim(),
      });

      setSuccessMsg("Depósito enviado com sucesso.");
      setPhone("");
      setAmount("");
      setTransactionCode("");

      await loadProfile(uid);
    } catch (error: any) {
      setErrorMsg(error?.message || "Erro ao solicitar depósito.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-4 text-white">Carregando...</div>;
  }

  return (
    <main className="min-h-screen bg-black px-3 pt-3 pb-24 text-white">
      <div className="mx-auto max-w-sm space-y-3">
        <div className="rounded-2xl bg-white/5 p-4">
          <div className="flex items-center gap-2">
            <ArrowDownCircle size={18} className="text-emerald-400" />
            <h1 className="text-lg font-bold">Depósito</h1>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-4 text-sm">
          <div className="flex justify-between">
            <span>Saldo</span>
            <span className="font-bold text-emerald-400">
              {formatMoney(profile?.balance ?? 0)} MZN
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-emerald-500/10 p-4">
          <h2 className="mb-2 text-sm font-bold text-emerald-300">
            Dados para depósito
          </h2>

          <div className="mb-3 rounded-xl bg-black/20 p-3">
            <p className="text-xs text-slate-400">M-Pesa</p>

            <div className="mt-1 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">849429961</p>
                <p className="text-xs font-semibold text-emerald-300">
                  Flavia
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleCopy("849429961", "mpesa")}
                className="rounded-lg bg-emerald-500 p-2 text-black transition hover:bg-emerald-400"
              >
                {copied === "mpesa" ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-black/20 p-3">
            <p className="text-xs text-slate-400">E-mola</p>

            <div className="mt-1 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">849429961</p>
                <p className="text-xs font-semibold text-emerald-300">
                  Flavia
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleCopy("849429961", "emola")}
                className="rounded-lg bg-emerald-500 p-2 text-black transition hover:bg-emerald-400"
              >
                {copied === "emola" ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {successMsg && (
            <div className="rounded-xl border border-emerald-400 bg-emerald-500/20 px-3 py-2 text-sm font-bold text-emerald-300">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-red-400 bg-red-500/20 px-3 py-2 text-sm text-red-300">
              {errorMsg}
            </div>
          )}

          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as "M-Pesa" | "E-mola")}
            className="w-full rounded-xl border-2 border-emerald-500 bg-white px-4 py-3 font-semibold text-black outline-none focus:border-emerald-400"
          >
            <option value="M-Pesa">M-Pesa</option>
            <option value="E-mola">E-mola</option>
          </select>

          <input
            type="text"
            placeholder="Seu número"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border-2 border-cyan-500 bg-white px-4 py-3 font-semibold text-black placeholder:text-slate-500 outline-none focus:border-cyan-400"
            required
          />

          <input
            type="number"
            placeholder="Valor"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border-2 border-amber-500 bg-white px-4 py-3 font-semibold text-black placeholder:text-slate-500 outline-none focus:border-amber-400"
            required
          />

          <input
            type="text"
            placeholder="ID da transação"
            value={transactionCode}
            onChange={(e) => setTransactionCode(e.target.value)}
            className="w-full rounded-xl border-2 border-violet-500 bg-white px-4 py-3 font-semibold text-black placeholder:text-slate-500 outline-none focus:border-violet-400"
            required
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-black transition hover:bg-emerald-400 disabled:opacity-70"
          >
            {submitting ? "Enviando..." : "Confirmar depósito"}
          </button>
        </form>
      </div>

      <BottomNav />
    </main>
  );
}