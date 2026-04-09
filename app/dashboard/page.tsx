"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import {
  buyInvestmentPlan,
  getUserProfile,
  getUserTransactions,
  INVESTMENT_PLANS,
} from "../services/authService";
import BottomNav from "../components/BottomNav";

const FALLBACK_IMAGE = "/plans/hybr-1-new.png";

const PLAN_IMAGES: Record<string, string> = {
  "premium-1": "/plans/premium-1.png",
  "premium-2": "/plans/premium-2.png",
  "premium-3": "/plans/premium-3.png",
  "premium-4": "/plans/premium-4.png",
  "hybr-1": "/plans/hybr-1-new.png",
  "hybr-2": "/plans/hybr-2-new.png",
  "hybr-3": "/plans/hybr-3-new.png",
  "hybr-4": "/plans/hybr-4-new.png",
  "hybr-5": "/plans/hybr-5-new.png",
};

type TransactionItem = {
  id: string;
  type: "deposito" | "levantamento";
  amount: number;
  status: string;
  createdAt?: {
    seconds?: number;
  };
};

type UserProfile = {
  balance?: number;
  totalProfit?: number;
  role?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingPlanId, setBuyingPlanId] = useState<string | null>(null);

  async function loadDashboardData(uid: string) {
    const [profile, userTransactions] = await Promise.all([
      getUserProfile(uid),
      getUserTransactions(uid),
    ]);

    setUserData((profile as UserProfile) || null);
    setTransactions((userTransactions as TransactionItem[]) || []);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        await loadDashboardData(user.uid);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        alert("Erro ao carregar dados da conta.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const balance = Number(userData?.balance ?? 0);
  const totalProfit = Number(userData?.totalProfit ?? 0);
  const isAdmin = userData?.role === "admin";

  const totalDeposits = useMemo(() => {
    return transactions
      .filter((item) => item.type === "deposito" && item.status === "aprovado")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [transactions]);

  const totalWithdrawals = useMemo(() => {
    return transactions
      .filter(
        (item) => item.type === "levantamento" && item.status === "aprovado"
      )
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [transactions]);

  const visibleBalance = useMemo(() => {
    return balance + totalProfit;
  }, [balance, totalProfit]);

  async function handleRentPlan(planId: string) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.push("/login");
      return;
    }

    const plan = INVESTMENT_PLANS.find((item) => item.id === planId);

    if (!plan) {
      alert("Plano não encontrado.");
      return;
    }

    if (balance < plan.amount) {
      alert("Saldo insuficiente");
      router.push("/deposito");
      return;
    }

    try {
      setBuyingPlanId(planId);

      await buyInvestmentPlan({
        uid: currentUser.uid,
        planId,
      });

      await loadDashboardData(currentUser.uid);
      alert("Alugado com sucesso.");
    } catch (error: any) {
      const message = error?.message || "Erro ao processar o aluguer.";
      alert(message);
    } finally {
      setBuyingPlanId(null);
    }
  }

  const premiumPlans = INVESTMENT_PLANS.filter((plan) => plan.isPremium);
  const normalPlans = INVESTMENT_PLANS.filter((plan) => !plan.isPremium);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-6 text-white">
        <p>Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-3 pb-24 pt-3 text-white">
      <div className="mx-auto max-w-md">
        {isAdmin && (
          <div className="mb-3">
            <button
              onClick={() => router.push("/admin")}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Abrir painel do administrador
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg">
            <p className="text-xs text-slate-400">Saldo</p>
            <h3 className="mt-1 text-lg font-bold text-white">
              {visibleBalance.toLocaleString("pt-MZ")} MZN
            </h3>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg">
            <p className="text-xs text-slate-400">Lucro</p>
            <h3 className="mt-1 text-lg font-bold text-cyan-400">
              {totalProfit.toLocaleString("pt-MZ")} MZN
            </h3>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg">
            <p className="text-xs text-slate-400">Depósitos</p>
            <h3 className="mt-1 text-lg font-bold text-emerald-400">
              {totalDeposits.toLocaleString("pt-MZ")} MZN
            </h3>

            <button
              onClick={() => router.push("/deposito")}
              className="mt-2 w-full rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-black transition hover:bg-emerald-400"
            >
              Depositar
            </button>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg">
            <p className="text-xs text-slate-400">Levantamentos</p>
            <h3 className="mt-1 text-lg font-bold text-amber-400">
              {totalWithdrawals.toLocaleString("pt-MZ")} MZN
            </h3>

            <button
              onClick={() => router.push("/levantamento")}
              className="mt-2 w-full rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-black transition hover:bg-amber-400"
            >
              Levantar
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <h2 className="mb-2 text-sm font-bold text-blue-400">
              Investimentos Premium
            </h2>

            <div className="space-y-4">
              {premiumPlans.map((plan) => {
                const imageSrc =
                  PLAN_IMAGES[plan.id] && PLAN_IMAGES[plan.id].trim() !== ""
                    ? PLAN_IMAGES[plan.id]
                    : FALLBACK_IMAGE;

                return (
                  <div
                    key={plan.id}
                    className="overflow-hidden rounded-xl border border-blue-500/20 bg-white/5 shadow-lg"
                  >
                    <div className="relative h-32 w-full">
                      <Image
                        src={imageSrc}
                        alt={plan.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
                      <div className="absolute left-3 top-3 flex w-[calc(100%-1.5rem)] items-center justify-between">
                        <h3 className="text-base font-bold text-blue-300">
                          {plan.name}
                        </h3>

                        <span className="rounded-full bg-blue-600/80 px-2 py-1 text-[10px] text-white">
                          Premium
                        </span>
                      </div>
                    </div>

                    <div className="p-3 text-sm">
                      <div className="space-y-1 text-slate-300">
                        <p>
                          Valor de aluguer:{" "}
                          <span className="font-semibold text-white">
                            {plan.amount.toLocaleString("pt-MZ")} MZN
                          </span>
                        </p>

                        <p>
                          Duração:{" "}
                          <span className="font-semibold text-white">
                            {plan.durationDays} dias
                          </span>
                        </p>

                        <p>
                          Retorno:{" "}
                          <span className="font-semibold text-emerald-400">
                            {Number(plan.finalReturn ?? 0).toLocaleString("pt-MZ")} MZN
                          </span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleRentPlan(plan.id)}
                        disabled={buyingPlanId === plan.id}
                        className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-70"
                      >
                        {buyingPlanId === plan.id ? "Processando..." : "Alugar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-bold text-amber-400">
              Investimentos Normais
            </h2>

            <div className="space-y-4">
              {normalPlans.map((plan) => {
                const imageSrc =
                  PLAN_IMAGES[plan.id] && PLAN_IMAGES[plan.id].trim() !== ""
                    ? PLAN_IMAGES[plan.id]
                    : FALLBACK_IMAGE;

                return (
                  <div
                    key={plan.id}
                    className="overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-lg"
                  >
                    <div className="relative h-32 w-full">
                      <Image
                        src={imageSrc}
                        alt={plan.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
                      <div className="absolute left-3 top-3 flex w-[calc(100%-1.5rem)] items-center justify-between">
                        <h3 className="text-base font-bold text-amber-400">
                          {plan.name}
                        </h3>

                        <span className="rounded-full bg-black/40 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
                          {plan.durationDays} dias
                        </span>
                      </div>
                    </div>

                    <div className="p-3 text-sm">
                      <div className="space-y-1 text-slate-300">
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
                            ).toLocaleString("pt-MZ")} MZN
                          </span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleRentPlan(plan.id)}
                        disabled={buyingPlanId === plan.id}
                        className="mt-3 w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-70"
                      >
                        {buyingPlanId === plan.id ? "Processando..." : "Alugar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}