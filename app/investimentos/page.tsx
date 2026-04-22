"use client";

import Image from "next/image";
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
  bonus?: number;
  availableProfit?: number;
};

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

  "alto-btc-1": "/plans/alto-btc-1.png",
  "alto-btc-2": "/plans/alto-btc-2.png",
  "alto-btc-3": "/plans/alto-btc-3.png",
  "alto-btc-4": "/plans/alto-btc-4.png",
  "alto-btc-5": "/plans/alto-btc-5.png",
  "alto-btc-6": "/plans/alto-btc-6.png",
  "alto-btc-7": "/plans/alto-btc-7.png",
  "alto-btc-8": "/plans/alto-btc-8.png",
};

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("pt-MZ");
}

export default function InvestimentosPage() {
  const router = useRouter();

  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState("");
  const [footerMessage, setFooterMessage] = useState("");
  const [footerType, setFooterType] = useState<"success" | "error" | "">("");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  async function loadProfile(userId: string) {
    const userProfile = await getUserProfile(userId);
    setProfile((userProfile || null) as UserProfile | null);
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
      setBuyingId(planId);
      setFooterMessage("");
      setFooterType("");

      const result = await buyInvestmentPlan({ uid, planId });
      await loadProfile(uid);

      setFooterType("success");
      setFooterMessage(result?.message || "Alugado com sucesso");

      setTimeout(() => {
        router.push("/ativos");
      }, 1200);
    } catch (error: any) {
      console.error(error);
      setFooterType("error");
      setFooterMessage(error?.message || "Erro ao investir");
    } finally {
      setBuyingId("");
    }
  }

  const availableBalance = useMemo(() => {
    return (
      Number(profile?.balance ?? 0) +
      Number(profile?.bonus ?? 0) +
      Number(profile?.availableProfit ?? 0)
    );
  }, [profile]);

  const altoRendimentoPlans = useMemo(
    () => INVESTMENT_PLANS.filter((p) => p.id.startsWith("alto-btc")),
    []
  );

  const premiumPlans = useMemo(
    () =>
      INVESTMENT_PLANS.filter(
        (p) => p.isPremium && !p.id.startsWith("alto-btc")
      ),
    []
  );

  const normalPlans = useMemo(
    () =>
      INVESTMENT_PLANS.filter(
        (p) => !p.isPremium && !p.id.startsWith("alto-btc")
      ),
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
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black px-4 pt-4 pb-28 text-white">
      <div className="mx-auto max-w-md space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg">
          <h1 className="text-2xl font-bold">HYBR Investimentos</h1>
          <p className="mt-1 text-sm text-slate-400">
            Escolha o plano ideal para o seu perfil.
          </p>

          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="text-xs text-slate-300">Saldo disponível</p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">
              {formatMoney(availableBalance)} MZN
            </p>
          </div>
        </div>

        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <h2 className="text-lg font-bold text-amber-400">
              Alto Rendimento
            </h2>
          </div>

          <p className="text-xs text-slate-400">
            Arraste para direita ou esquerda para ver mais.
          </p>

          <div className="overflow-x-auto pb-2">
            <div className="flex gap-4">
              {altoRendimentoPlans.map((plan) => {
                const finalReturn =
                  plan.finalReturn ??
                  Math.round(
                    plan.amount +
                      plan.amount * (plan.dailyRate / 100) * plan.durationDays
                  );

                const imageSrc = PLAN_IMAGES[plan.id] || FALLBACK_IMAGE;

                return (
                  <div
                    key={plan.id}
                    className="min-w-[280px] flex-shrink-0 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-slate-900 to-black p-4 shadow-[0_0_24px_rgba(245,158,11,0.18)]"
                  >
                    <div className="relative mb-3 h-40 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                      <Image
                        src={imageSrc}
                        alt={plan.name}
                        fill
                        sizes="280px"
                        className="object-cover"
                      />
                    </div>

                    <p className="text-sm font-bold text-amber-300">
                      {plan.name}
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-black/20 p-3">
                        <p className="text-[11px] text-slate-400">Entrada</p>
                        <p className="mt-1 text-sm font-bold text-white">
                          {formatMoney(plan.amount)} MZN
                        </p>
                      </div>

                      <div className="rounded-xl bg-black/20 p-3">
                        <p className="text-[11px] text-slate-400">Lucro/dia</p>
                        <p className="mt-1 text-sm font-bold text-emerald-400">
                          {plan.dailyRate}%
                        </p>
                      </div>

                      <div className="rounded-xl bg-black/20 p-3">
                        <p className="text-[11px] text-slate-400">Duração</p>
                        <p className="mt-1 text-sm font-bold text-white">
                          {plan.durationDays} dias
                        </p>
                      </div>

                      <div className="rounded-xl bg-black/20 p-3">
                        <p className="text-[11px] text-slate-400">Retorno</p>
                        <p className="mt-1 text-sm font-bold text-amber-300">
                          {formatMoney(finalReturn)} MZN
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBuy(plan.id)}
                      disabled={buyingId === plan.id}
                      className="mt-4 w-full rounded-2xl bg-amber-500 py-3 text-sm font-bold text-black transition hover:bg-amber-400 disabled:opacity-70"
                    >
                      {buyingId === plan.id ? "Processando..." : "Alugar"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {premiumPlans.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-blue-400">
              Premium
            </h2>

            {premiumPlans.map((plan) => {
              const imageSrc = PLAN_IMAGES[plan.id] || FALLBACK_IMAGE;
              const finalReturn =
                plan.finalReturn ??
                Math.round(
                  plan.amount +
                    plan.amount * (plan.dailyRate / 100) * plan.durationDays
                );

              return (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-blue-500/20 bg-white/5 p-4"
                >
                  <div className="relative mb-3 h-40 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                    <Image
                      src={imageSrc}
                      alt={plan.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 448px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-blue-400">
                        {plan.name}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-400">Investimento</p>
                      <p className="text-base font-bold text-white">
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
                      <p className="text-[11px] text-slate-400">Retorno</p>
                      <p className="mt-1 text-sm font-bold text-cyan-400">
                        {formatMoney(finalReturn)} MZN
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuy(plan.id)}
                    disabled={buyingId === plan.id}
                    className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-70"
                  >
                    {buyingId === plan.id ? "Processando..." : "Alugar"}
                  </button>
                </div>
              );
            })}
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-300">
            Planos HYBR
          </h2>

          {normalPlans.map((plan) => {
            const imageSrc = PLAN_IMAGES[plan.id] || FALLBACK_IMAGE;
            const finalReturn =
              plan.finalReturn ??
              Math.round(
                plan.amount +
                  plan.amount * (plan.dailyRate / 100) * plan.durationDays
              );

            return (
              <div
                key={plan.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="relative mb-3 h-40 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                  <Image
                    src={imageSrc}
                    alt={plan.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 448px"
                    className="object-cover"
                  />
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-amber-400">
                      {plan.name}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-400">Investimento</p>
                    <p className="text-base font-bold text-white">
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
                    <p className="text-[11px] text-slate-400">Retorno</p>
                    <p className="mt-1 text-sm font-bold text-blue-400">
                      {formatMoney(finalReturn)} MZN
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleBuy(plan.id)}
                  disabled={buyingId === plan.id}
                  className="mt-4 w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-black transition hover:bg-amber-400 disabled:opacity-70"
                >
                  {buyingId === plan.id ? "Processando..." : "Alugar"}
                </button>
              </div>
            );
          })}
        </section>
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