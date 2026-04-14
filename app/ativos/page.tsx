"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import {
  INVESTMENT_PLANS,
  buyInvestmentPlan,
  getUserProfile,
} from "../services/authService";
import BottomNav from "../components/BottomNav";

type UserProfile = {
  balance?: number;
};

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("pt-MZ");
}

export default function AtivosPage() {
  const router = useRouter();

  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState("");
  const [footerMessage, setFooterMessage] = useState("");
  const [footerType, setFooterType] = useState<"success" | "error" | "">("");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  async function loadProfile(userId: string) {
    const userProfile = (await getUserProfile(userId)) as UserProfile | null;
    setProfile(userProfile);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUid(user.uid);

      try {
        await loadProfile(user.uid);
      } catch (error) {
        console.error(error);
        setFooterType("error");
        setFooterMessage("Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleBuy(planId: string) {
    if (!uid || buyingId) return;

    try {
      setFooterMessage("");
      setFooterType("");
      setBuyingId(planId);

      const result = await buyInvestmentPlan({ uid, planId });
      await loadProfile(uid);

      setFooterType("success");
      setFooterMessage(result?.message || "Alugado com sucesso");

      setTimeout(() => {
        router.push("/ativos");
      }, 1200);
    } catch (error: any) {
      setFooterType("error");
      setFooterMessage(error?.message || "Erro ao investir.");
    } finally {
      setBuyingId("");
    }
  }

  const normalPlans = useMemo(
    () => INVESTMENT_PLANS.filter((p) => !p.id.startsWith("alto-btc")),
    []
  );

  const altoRendimentoPlans = useMemo(
    () => INVESTMENT_PLANS.filter((p) => p.id.startsWith("alto-btc")),
    []
  );

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
        <h1 className="text-center text-xl font-bold">Investimentos</h1>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-xs text-slate-400">Saldo disponível</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {formatMoney(Number(profile?.balance ?? 0))} MZN
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-300">
            Planos disponíveis
          </h2>

          {normalPlans.map((plan) => {
            const finalReturn =
              plan.finalReturn ??
              Math.round(
                plan.amount + plan.amount * (plan.dailyRate / 100) * plan.durationDays
              );

            return (
              <div
                key={plan.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">{plan.name}</p>
                    {plan.isPremium && (
                      <span className="mt-1 inline-block rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-400">
                        PREMIUM
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-400">Entrada</p>
                    <p className="text-base font-bold text-amber-400">
                      {formatMoney(plan.amount)} MZN
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-slate-950/40 p-3">
                    <p className="text-[11px] text-slate-400">Lucro diário</p>
                    <p className="mt-1 text-sm font-bold text-emerald-400">
                      {plan.dailyRate}%
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/40 p-3">
                    <p className="text-[11px] text-slate-400">Duração</p>
                    <p className="mt-1 text-sm font-bold text-white">
                      {plan.durationDays} dias
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-950/40 p-3">
                    <p className="text-[11px] text-slate-400">Retorno total</p>
                    <p className="mt-1 text-sm font-bold text-blue-400">
                      {formatMoney(finalReturn)} MZN
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleBuy(plan.id)}
                  disabled={buyingId === plan.id}
                  className="mt-4 w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {buyingId === plan.id ? "Processando..." : "Investir agora"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-amber-400">
              🔥 Alto Rendimento
            </h2>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-300">
              Máquinas Bitcoin
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Arraste para a direita e esquerda para ver todos os planos.
          </p>

          <div className="-mx-1 overflow-x-auto pb-2">
            <div className="flex gap-4 px-1">
              {altoRendimentoPlans.map((plan) => {
                const finalReturn =
                  plan.finalReturn ??
                  Math.round(
                    plan.amount + plan.amount * (plan.dailyRate / 100) * plan.durationDays
                  );

                return (
                  <div
                    key={plan.id}
                    className="min-w-[285px] flex-shrink-0 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-slate-900 to-black p-4 shadow-[0_0_24px_rgba(245,158,11,0.18)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-amber-300">
                          {plan.name}
                        </p>
                        <span className="mt-2 inline-block rounded-full bg-amber-400/15 px-2 py-1 text-[10px] font-bold text-amber-300">
                          ALTO RENDIMENTO
                        </span>
                      </div>

                      <div className="rounded-xl bg-black/30 px-3 py-2 text-right">
                        <p className="text-[10px] text-slate-400">Entrada</p>
                        <p className="text-sm font-bold text-white">
                          {formatMoney(plan.amount)} MZN
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="rounded-2xl bg-black/25 p-3">
                        <p className="text-[11px] text-slate-400">Lucro por dia</p>
                        <p className="mt-1 text-lg font-bold text-emerald-400">
                          {plan.dailyRate}%
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-black/25 p-3">
                          <p className="text-[11px] text-slate-400">Duração</p>
                          <p className="mt-1 text-sm font-bold text-white">
                            {plan.durationDays} dias
                          </p>
                        </div>

                        <div className="rounded-2xl bg-black/25 p-3">
                          <p className="text-[11px] text-slate-400">Retorno total</p>
                          <p className="mt-1 text-sm font-bold text-amber-300">
                            {formatMoney(finalReturn)} MZN
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBuy(plan.id)}
                      disabled={buyingId === plan.id}
                      className="mt-4 w-full rounded-2xl bg-amber-500 py-3 text-sm font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {buyingId === plan.id ? "Processando..." : "Investir agora"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {footerMessage && (
        <div
          className={`fixed bottom-20 left-1/2 z-40 w-[92%] max-w-md -translate-x-1/2 rounded-xl px-4 py-3 text-center shadow-lg backdrop-blur-sm ${
            footerType === "success"
              ? "border border-emerald-500/30 bg-emerald-500/15"
              : "border border-red-500/30 bg-red-500/10"
          }`}
        >
          <p
            className={`text-sm font-bold ${
              footerType === "success" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {footerMessage}
          </p>
        </div>
      )}

      <BottomNav />
    </main>
  );
}