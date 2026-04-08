"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getUserInvestments } from "../services/authService";
import BottomNav from "../components/BottomNav";

type InvestmentItem = {
  id: string;
  planName: string;
  amount: number;
  dailyRate: number;
  durationDays: number;
  totalProfit: number;
  status: string;
  createdAt?: { seconds?: number };
};

function formatDate(timestamp?: { seconds?: number }) {
  if (!timestamp?.seconds) return "Data indisponível";

  return new Date(timestamp.seconds * 1000).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function calculateDaysPassed(timestamp?: { seconds?: number }) {
  if (!timestamp?.seconds) return 0;
  const created = new Date(timestamp.seconds * 1000).getTime();
  return Math.max(0, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24)));
}

export default function AtivosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState<InvestmentItem[]>([]);

  async function loadInvestments(uid: string) {
    const data = await getUserInvestments(uid);
    setInvestments((data as InvestmentItem[]) || []);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        await loadInvestments(user.uid);
      } catch (error) {
        console.error(error);
        alert("Erro ao carregar ativos.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const activeInvestments = useMemo(
    () => investments.filter((item) => item.status === "ativo"),
    [investments]
  );

  const totalInvested = useMemo(
    () => activeInvestments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [activeInvestments]
  );

  const totalEstimatedProfit = useMemo(
    () => activeInvestments.reduce((sum, item) => sum + Number(item.totalProfit || 0), 0),
    [activeInvestments]
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-4 text-white">
        Carregando ativos...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-3 pb-24 pt-3 text-white">
      <div className="mx-auto max-w-md space-y-3">
        <h1 className="text-xl font-bold">Ativos</h1>

        <div className="grid grid-cols-1 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-slate-400">Planos ativos</p>
            <h3 className="mt-1 text-lg font-bold text-white">
              {activeInvestments.length}
            </h3>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-slate-400">Total investido</p>
            <h3 className="mt-1 text-lg font-bold text-white">
              {totalInvested.toLocaleString("pt-MZ")} MZN
            </h3>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-slate-400">Lucro estimado</p>
            <h3 className="mt-1 text-lg font-bold text-emerald-400">
              {totalEstimatedProfit.toLocaleString("pt-MZ")} MZN
            </h3>
          </div>
        </div>

        {activeInvestments.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-sm text-slate-300">Ainda não alugaste nenhum plano.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-3 w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black"
            >
              Ir ao dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeInvestments.map((item) => {
              const daysPassed = calculateDaysPassed(item.createdAt);
              const daysRemaining = Math.max(0, Number(item.durationDays || 0) - daysPassed);
              const accumulatedProfit = Math.min(
                Number(item.totalProfit || 0),
                Number(
                  (
                    Number(item.amount || 0) *
                    (Number(item.dailyRate || 0) / 100) *
                    daysPassed
                  ).toFixed(2)
                )
              );

              const progressPercent =
                Number(item.durationDays || 0) > 0
                  ? Math.min(100, Math.round((daysPassed / Number(item.durationDays)) * 100))
                  : 0;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-amber-400">{item.planName}</h3>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] text-emerald-400">
                      Ativo
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-300">
                    <p>Valor: <span className="font-semibold text-white">{Number(item.amount).toLocaleString("pt-MZ")} MZN</span></p>
                    <p>Lucro diário: <span className="font-semibold text-emerald-400">{Number(item.dailyRate)}%</span></p>
                    <p>Duração: <span className="font-semibold text-white">{Number(item.durationDays)} dias</span></p>
                    <p>Início: <span className="font-semibold text-white">{formatDate(item.createdAt)}</span></p>
                    <p>Dias decorridos: <span className="font-semibold text-white">{daysPassed}</span></p>
                    <p>Dias restantes: <span className="font-semibold text-white">{daysRemaining}</span></p>
                    <p>Lucro acumulado: <span className="font-semibold text-emerald-400">{accumulatedProfit.toLocaleString("pt-MZ")} MZN</span></p>
                    <p>Lucro total: <span className="font-semibold text-white">{Number(item.totalProfit).toLocaleString("pt-MZ")} MZN</span></p>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Progresso</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}