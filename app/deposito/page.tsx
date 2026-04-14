"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { createTransaction, getUserProfile } from "../services/authService";
import BottomNav from "../components/BottomNav";

export default function DepositoPage() {
  const router = useRouter();
  const [uid, setUid] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionCode, setTransactionCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [footerError, setFooterError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUid(user.uid);
      const profile: any = await getUserProfile(user.uid);
      setUserPhone(profile?.phone || "");
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

    if (!amount || Number(amount) <= 0) {
      setFooterError("Informe um valor válido");
      return;
    }

    if (!transactionCode.trim()) {
      setFooterError("Informe o ID da transação");
      return;
    }

    try {
      setSubmitting(true);

      await createTransaction({
        uid,
        type: "deposito",
        method: "M-Pesa",
        phone: userPhone || "849429961",
        amount: Number(amount),
        transactionCode: transactionCode.trim().toUpperCase(),
      });

      setSuccessMessage("Sucesso");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error: any) {
      setFooterError(error?.message || "Erro ao enviar depósito");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-3 pb-28 pt-3 text-white">
      <div className="mx-auto max-w-md space-y-3">
        <h1 className="text-xl font-bold">Depósito</h1>

        {successMessage && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <p className="text-lg font-bold text-emerald-400">{successMessage}</p>
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-slate-400">Enviar valor para</p>

          <div className="mt-3 space-y-2 rounded-lg bg-slate-950/40 p-3">
            <div>
              <p className="text-[11px] text-slate-400">Método</p>
              <p className="text-sm font-semibold text-emerald-400">M-Pesa</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Número</p>
              <p className="text-sm font-semibold text-white">849429961</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400">Nome</p>
              <p className="text-sm font-semibold text-white capitalize">flavia</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-slate-300">Valor</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 1000"
                className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-300">ID da transação</label>
              <input
                type="text"
                value={transactionCode}
                onChange={(e) => setTransactionCode(e.target.value.toUpperCase())}
                placeholder="Ex: DBI2JAJX"
                className="w-full rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-sm uppercase text-white outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-70"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  Processando...
                </span>
              ) : (
                "Confirmar depósito"
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