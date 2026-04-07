"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import {
  buyInvestmentPlan,
  getUserProfile,
  INVESTMENT_PLANS,
} from "../services/authService";
import BottomNav from "../components/BottomNav";

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [buyingPlanId, setBuyingPlanId] = useState<string | null>(null);

  async function loadProfile(uid: string) {
    const profile = await getUserProfile(uid);
    setUserData(profile);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      await loadProfile(currentUser.uid);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const visibleBalance = useMemo(() => {
    const balance = Number(userData?.balance ?? 0);
    const totalProfit = Number(userData?.totalProfit ?? 0);
    return balance + totalProfit;
  }, [userData]);

  const bonus = Number(userData?.bonus ?? 0);
  const totalProfit = Number(userData?.totalProfit ?? 0);

  async function handleBuyPlan(planId: string) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.push("/login");
      return;
    }

    try {
      setBuyingPlanId(planId);
      await buyInvestmentPlan({
        uid: currentUser.uid,
        planId,
      });
      await loadProfile(currentUser.uid);
      alert("Plano adquirido com sucesso.");
    } catch (error: any) {
      alert(error?.message || "Erro ao adquirir plano");
    } finally {
      setBuyingPlanId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-6 text-white">
        <p>Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-4 pb-28 pt-4 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
            <p className="text-xs text-slate-400">Saldo</p>
            <h3 className="mt-1 text-2xl font-bold text-white">
              {visibleBalance.toLocaleString("pt-MZ")} MZN
            </h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
            <p className="text-xs text-slate-400">Bónus</p>
            <h3 className="mt-1 text-2xl font-bold text-white">
              {bonus.toLocaleString("pt-MZ")} MZN
            </h3>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
            <p className="text-xs text-slate-400">Lucros Totais</p>
            <h3 className="mt-1 text-2xl font-bold text-emerald-400">
              {totalProfit.toLocaleString("pt-MZ")} MZN
            </h3>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold">Planos de Investimento</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {INVESTMENT_PLANS.map((plan) => (
              <div
                key={plan.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-amber-400">{plan.name}</h3>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                    {plan.durationDays} dias
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <p>
                    Valor:{" "}
                    <span className="font-semibold text-white">
                      {plan.amount.toLocaleString("pt-MZ")} MZN
                    </span>
                  </p>
                  <p>
                    Lucro diário:{" "}
                    <span className="font-semibold text-emerald-400">
                      {plan.dailyRate}%
                    </span>
                  </p>
                  <p>
                    Dias úteis:{" "}
                    <span className="font-semibold text-white">
                      {plan.durationDays}
                    </span>
                  </p>
                  <p>
                    Lucro total estimado:{" "}
                    <span className="font-semibold text-white">
                      {(
                        plan.amount *
                        (plan.dailyRate / 100) *
                        plan.durationDays
                      ).toLocaleString("pt-MZ")}{" "}
                      MZN
                    </span>
                  </p>
                </div>

                <button
                  onClick={() => handleBuyPlan(plan.id)}
                  disabled={buyingPlanId === plan.id}
                  className="mt-5 w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-70"
                >
                  {buyingPlanId === plan.id ? "Processando..." : "Investir"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}