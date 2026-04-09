"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import {
  createTransaction,
  getUserInvestments,
  getUserProfile,
} from "../services/authService";
import BottomNav from "../components/BottomNav";

function isWithdrawalAllowedNow() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  const isMondayToSaturday = day >= 1 && day <= 6;
  const isAllowedHour = hour >= 9 && hour < 22;

  return isMondayToSaturday && isAllowedHour;
}

export default function LevantamentoPage() {
  const router = useRouter();

  const [uid, setUid] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [profit, setProfit] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [hasInvestment, setHasInvestment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [footerError, setFooterError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        setUid(user.uid);

        const [profile, investments] = await Promise.all([
          getUserProfile(user.uid),
          getUserInvestments(user.uid),
        ]);

        const userProfile: any = profile;
        const userInvestments: any[] = Array.isArray(investments) ? investments : [];

        setUserPhone(userProfile?.phone || "");
        setBalance(Number(userProfile?.balance ?? 0));
        setProfit(Number(userProfile?.totalProfit ?? 0));
        setBonus(Number(userProfile?.bonus ?? 0));
        setHasInvestment(userInvestments.length > 0);
      } catch (error) {
        console.error("Erro ao carregar levantamento:", error);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setFooterError("");
    setSuccessMessage("");

    if (!uid) {
      setFooterError("Utilizador não autenticado");
      return;
    }

    if (!hasInvestment) {
      setFooterError("Alugue primeiro");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setFooterError("Informe um valor válido");
      return;
    }

    if (Number(amount) < 150) {
      setFooterError("Levantamento mínimo é 150 MZN");
      return;
    }

    if (!isWithdrawalAllowedNow()) {
      setFooterError("Levantamento: segunda a sábado, 9h às 22h");
      return;
    }

    const totalAvailable = balance + profit + bonus;

    if (Number(amount) > totalAvailable) {
      setFooterError("Sem fundos");
      return;
    }

    try {
      setSubmitting(true);

      await createTransaction({
        uid,
        type: "levantamento",
        method: "M-Pesa",
        phone: userPhone,
        amount: Number(amount),
      });

      setSuccessMessage("Sucesso");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error: any) {
      setFooterError(error?.message || "Erro ao enviar levantamento");
    } finally {
      setSubmitting(false);
    }
  }

  const totalAvailable = balance + profit + bonus;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-3 pb-28 pt-3 text-white">
      <div className="mx-auto max-w-md space-y-3">
        <h1 className="text-xl font-bold">Levantamento</h1>

        {successMessage && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <p className="text-lg font-bold text-emerald-400">{successMessage}</p>
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-slate-400">Saldo disponível</p>
          <h2 className="mt-1 text-lg font-bold text-emerald-400">
            {totalAvailable.toLocaleString("pt-MZ")} MZN
          </h2>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-slate-400">Regras de levantamento</p>

          <div className="mt-3 space-y-2 rounded-lg bg-slate-950/40 p-3 text-xs text-slate-300">
            <p>
              Valor mínimo:{" "}
              <span className="font-semibold text-amber-400">150 MZN</span>
            </p>
            <p>
              Horário:{" "}
              <span className="font-semibold text-amber-400">
                segunda a sábado, 9h às 22h
              </span>
            </p>
            <p>
              Condição:{" "}
              <span className="font-semibold text-amber-400">
                deve alugar primeiro
              </span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-slate-400">O valor será enviado para</p>

          <div className="mt-3 space-y-2 rounded-lg bg-slate-950/40 p-3">
            <div>
              <p className="text-[11px] text-slate-400">Método</p>
              <p className="text-sm font-semibold text-amber-400">M-Pesa</p>
            </div>

            <div>
              <p className="text-[11px] text-slate-400">Seu número</p>
              <p className="text-sm font-semibold text-white">
                {userPhone || "Número não disponível"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-slate-300">Valor</label>
              <input
                type="number"
                min="150"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 500"
                className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-70"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  Processando...
                </span>
              ) : (
                "Confirmar levantamento"
              )}
            </button>
          </form>
        </div>
      </div>

      {footerError && (
        <div className="fixed bottom-20 left-1/2 z-40 w-[92%] max-w-md -translate-x-1/2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center shadow-lg backdrop-blur-sm">
          <p className="text-sm font-bold text-red-400">{footerError}</p>
        </div>
      )}

      <BottomNav />
    </main>
  );
}