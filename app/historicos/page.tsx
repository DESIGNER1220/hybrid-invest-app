"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import {
  getReferralEarnings,
  getUserTransactions,
  getWheelSpinHistory,
} from "../services/authService";
import BottomNav from "../components/BottomNav";

type TransactionItem = {
  id: string;
  type?: string;
  method?: string;
  phone?: string;
  amount?: number;
  status?: string;
  createdAt?: { seconds?: number };
};

type ReferralItem = {
  id: string;
  commissionAmount?: number;
  depositAmount?: number;
  createdAt?: { seconds?: number };
};

type WheelItem = {
  id: string;
  reward?: number;
  label?: string;
  createdAt?: { seconds?: number };
};

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("pt-MZ");
}

function formatDateTime(timestamp?: { seconds?: number }) {
  if (!timestamp?.seconds) return "Data indisponível";

  return new Date(timestamp.seconds * 1000).toLocaleString("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoricoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [wheelHistory, setWheelHistory] = useState<WheelItem[]>([]);

  async function loadAll(userId: string) {
    const [transactionsData, referralsData, wheelData] = await Promise.all([
      getUserTransactions(userId),
      getReferralEarnings(userId),
      getWheelSpinHistory(userId),
    ]);

    setTransactions((transactionsData || []) as TransactionItem[]);
    setReferrals((referralsData || []) as ReferralItem[]);
    setWheelHistory((wheelData || []) as WheelItem[]);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        await loadAll(user.uid);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-4 text-white">
        Carregando...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pt-4 pb-28 text-white">
      <div className="mx-auto max-w-md space-y-5">
        <h1 className="text-center text-xl font-bold">Histórico</h1>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-emerald-400">
              Ganhos por afiliado
            </h2>
            <span className="text-xs text-slate-400">
              {referrals.length} registos
            </span>
          </div>

          {referrals.length === 0 ? (
            <p className="text-xs text-slate-400">
              Nenhum ganho de afiliado registado.
            </p>
          ) : (
            <div className="space-y-2">
              {referrals.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-slate-950/40 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">
                        Comissão recebida
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Depósito base: {formatMoney(Number(item.depositAmount ?? 0))} MZN
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400">
                        +{formatMoney(Number(item.commissionAmount ?? 0))} MZN
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-amber-400">
              Histórico de sorteios
            </h2>
            <span className="text-xs text-slate-400">
              {wheelHistory.length} giros
            </span>
          </div>

          {wheelHistory.length === 0 ? (
            <p className="text-xs text-slate-400">
              Nenhum sorteio registado.
            </p>
          ) : (
            <div className="space-y-2">
              {wheelHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-slate-950/40 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {item.label || "Resultado"}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Prémio: {formatMoney(Number(item.reward ?? 0))} MZN
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-blue-400">
              Histórico de transações
            </h2>
            <span className="text-xs text-slate-400">
              {transactions.length} registos
            </span>
          </div>

          {transactions.length === 0 ? (
            <p className="text-xs text-slate-400">
              Nenhuma transação registada.
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((item) => {
                const isDeposit = item.type === "deposito";

                return (
                  <div
                    key={item.id}
                    className="rounded-xl bg-slate-950/40 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-white">
                          {isDeposit ? "Depósito" : "Levantamento"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {item.method || "Método"} • {item.phone || "Sem número"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Estado: {item.status || "pendente"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${
                            isDeposit ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {isDeposit ? "+" : "-"}
                          {formatMoney(Number(item.amount ?? 0))} MZN
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {formatDateTime(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </main>
  );
}