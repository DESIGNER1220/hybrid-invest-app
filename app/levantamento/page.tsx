"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowUpCircle, Crown, Percent, Wallet } from "lucide-react";

import { auth } from "../lib/firebase";
import { createTransaction, getUserProfile } from "../services/authService";
import BottomNav from "../components/BottomNav";

type UserProfile = {
  balance?: number;
  bonus?: number;
  totalProfit?: number;
  vipLevel?: string;
  withdrawalFeePercent?: number;
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("pt-MZ");
}

export default function LevantamentoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<"M-Pesa" | "E-mola">("M-Pesa");
  const [amount, setAmount] = useState("");

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
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  const availableBalance = useMemo(() => {
    return round2(
      Number(profile?.balance ?? 0) +
        Number(profile?.bonus ?? 0) +
        Number(profile?.totalProfit ?? 0)
    );
  }, [profile]);

  const withdrawalFeePercent = useMemo(() => {
    return Number(profile?.withdrawalFeePercent ?? 12);
  }, [profile]);

  const amountNumber = useMemo(() => {
    return Number(amount || 0);
  }, [amount]);

  const feeAmount = useMemo(() => {
    if (!amountNumber || amountNumber <= 0) return 0;
    return round2(amountNumber * (withdrawalFeePercent / 100));
  }, [amountNumber, withdrawalFeePercent]);

  const totalDeduction = useMemo(() => {
    if (!amountNumber || amountNumber <= 0) return 0;
    return round2(amountNumber + feeAmount);
  }, [amountNumber, feeAmount]);

  const netReceive = useMemo(() => {
    if (!amountNumber || amountNumber <= 0) return 0;
    return round2(amountNumber);
  }, [amountNumber]);

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

      if (!amountNumber || amountNumber <= 0) {
        throw new Error("Informe um valor válido.");
      }

      if (totalDeduction > availableBalance) {
        throw new Error(
          `Saldo insuficiente. Necessário: ${formatMoney(totalDeduction)} MZN`
        );
      }

      await createTransaction({
        uid,
        type: "levantamento",
        method,
        phone: phone.trim(),
        amount: amountNumber,
      });

      setSuccessMsg("Pedido de levantamento enviado com sucesso.");
      setAmount("");

      await loadProfile(uid);
    } catch (error: any) {
      setErrorMsg(error?.message || "Erro ao solicitar levantamento.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black p-4 text-white">
        Carregando...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black px-3 pt-3 pb-24 text-white">
      <div className="mx-auto max-w-sm space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
          <div className="flex items-center gap-2">
            <ArrowUpCircle size={18} className="text-red-400" />
            <h1 className="text-lg font-bold">Levantamento</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Solicite o seu levantamento e veja a taxa aplicada conforme o seu nível VIP.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="flex items-center gap-1 text-slate-400">
                <Wallet size={14} />
                Saldo disponível
              </span>
              <span className="font-semibold text-emerald-400">
                {formatMoney(availableBalance)} MZN
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="flex items-center gap-1 text-slate-400">
                <Crown size={14} />
                Nível VIP
              </span>
              <span className="font-semibold text-violet-300">
                {profile?.vipLevel || "VIP1"}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="flex items-center gap-1 text-slate-400">
                <Percent size={14} />
                Taxa de levantamento
              </span>
              <span className="font-semibold text-orange-300">
                {withdrawalFeePercent}%
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 shadow-lg">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle size={16} className="text-orange-300" />
            <h2 className="text-sm font-bold text-orange-300">
              Tabela VIP
            </h2>
          </div>

          <div className="space-y-2 text-[11px] text-white">
            <div className="flex justify-between rounded-lg bg-black/20 px-3 py-2">
              <span>VIP1</span>
              <span>0 a 2 convidados • 12%</span>
            </div>
            <div className="flex justify-between rounded-lg bg-black/20 px-3 py-2">
              <span>VIP2</span>
              <span>3 convidados • 10%</span>
            </div>
            <div className="flex justify-between rounded-lg bg-black/20 px-3 py-2">
              <span>VIP3</span>
              <span>5 convidados • 6%</span>
            </div>
            <div className="flex justify-between rounded-lg bg-black/20 px-3 py-2">
              <span>VIP4</span>
              <span>8 convidados • 4%</span>
            </div>
            <div className="flex justify-between rounded-lg bg-black/20 px-3 py-2">
              <span>VIP5</span>
              <span>10+ convidados • 0%</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
          {successMsg && (
            <div className="mb-4 rounded-xl border border-emerald-400 bg-emerald-500/20 px-3 py-2 text-center text-sm font-bold text-emerald-300">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 rounded-xl border border-red-400 bg-red-500/20 px-3 py-2 text-center text-sm text-red-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-300">
                Método
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as "M-Pesa" | "E-mola")}
                className="w-full rounded-xl bg-white px-4 py-3 text-black outline-none"
              >
                <option value="M-Pesa">M-Pesa</option>
                <option value="E-mola">E-mola</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">
                Número de telefone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Digite o número"
                className="w-full rounded-xl bg-white px-4 py-3 text-black outline-none"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-300">
                Valor do levantamento
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Digite o valor"
                className="w-full rounded-xl bg-white px-4 py-3 text-black outline-none"
                min="1"
                step="0.01"
                required
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Valor solicitado</span>
                <span className="font-bold text-white">
                  {formatMoney(amountNumber)} MZN
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-400">
                  Taxa ({withdrawalFeePercent}%)
                </span>
                <span className="font-bold text-orange-300">
                  {formatMoney(feeAmount)} MZN
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-400">Total cortado</span>
                <span className="font-bold text-red-300">
                  {formatMoney(totalDeduction)} MZN
                </span>
              </div>

              <div className="mt-2 flex justify-between border-t border-white/10 pt-2">
                <span className="text-slate-300">Vai receber</span>
                <span className="text-sm font-bold text-emerald-400">
                  {formatMoney(netReceive)} MZN
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-red-500 py-3 text-lg font-bold text-white transition hover:bg-red-400 disabled:opacity-70"
            >
              {submitting ? "Enviando..." : "Solicitar levantamento"}
            </button>
          </form>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}