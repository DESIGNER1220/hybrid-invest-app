"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import {
  approveTransaction,
  getPendingTransactions,
  getUserProfile,
  rejectTransaction,
} from "../services/authService";
import BottomNav from "../components/BottomNav";

export default function AdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadData() {
    const data = await getPendingTransactions();
    setItems(data);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const profile = await getUserProfile(currentUser.uid);

      if (profile?.role !== "admin") {
        alert("Acesso negado.");
        router.push("/dashboard");
        return;
      }

      await loadData();
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function handleApprove(id: string) {
    try {
      setProcessingId(id);
      await approveTransaction(id);
      await loadData();
      alert("Transação aprovada.");
    } catch (error: any) {
      alert(error?.message || "Erro ao aprovar transação");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    try {
      setProcessingId(id);
      await rejectTransaction(id);
      await loadData();
      alert("Transação rejeitada.");
    } catch (error: any) {
      alert(error?.message || "Erro ao rejeitar transação");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-4 pb-28 pt-6 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="mt-2 text-slate-300">
          Aprovação de depósitos e levantamentos.
        </p>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-slate-400">Carregando...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-slate-400">Sem transações pendentes.</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold capitalize">{item.type}</p>
                    <p className="text-sm text-slate-400">{item.method}</p>
                    <p className="text-sm text-slate-400">{item.phone}</p>
                    <p className="text-xs text-slate-500">UID: {item.uid}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold">
                      {Number(item.amount ?? 0).toLocaleString("pt-MZ")} MZN
                    </p>
                    <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs text-yellow-300">
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => handleApprove(item.id)}
                    disabled={processingId === item.id}
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-70"
                  >
                    Aprovar
                  </button>

                  <button
                    onClick={() => handleReject(item.id)}
                    disabled={processingId === item.id}
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-70"
                  >
                    Rejeitar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}