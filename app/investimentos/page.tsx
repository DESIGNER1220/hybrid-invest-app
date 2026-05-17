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
  type InvestmentPlan,
} from "../services/authService";
import BottomNav from "../components/BottomNav";
import Loader from "../components/Loader";

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

const NORMAL_PLANS_EXPIRY_KEY = "hybr_normal_plans_expire_at";
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("pt-MZ");
}

function getNormalPlansExpireAt() {
  if (typeof window === "undefined") {
    return Date.now() + THREE_DAYS_MS;
  }

  const savedExpireAt = Number(localStorage.getItem(NORMAL_PLANS_EXPIRY_KEY));

  if (savedExpireAt && savedExpireAt > 0) {
    return savedExpireAt;
  }

  const expireAt = Date.now() + THREE_DAYS_MS;
  localStorage.setItem(NORMAL_PLANS_EXPIRY_KEY, String(expireAt));

  return expireAt;
}

function formatCountdown(ms: number) {
  const safeMs = Math.max(0, ms);

  const totalSeconds = Math.floor(safeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  return `${hours}h ${minutes}m ${seconds}s`;
}

export default function InvestimentosPage() {
  const router = useRouter();

  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState("");
  const [footerMessage, setFooterMessage] = useState("");
  const [footerType, setFooterType] = useState<"success" | "error" | "">("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [normalPlansExpireAt, setNormalPlansExpireAt] = useState<number | null>(
    null
  );
  const [now, setNow] = useState(Date.now());

  async function loadProfile(userId: string) {
    const userProfile = await getUserProfile(userId);
    setProfile((userProfile || null) as UserProfile | null);
  }

  useEffect(() => {
    const expireAt = getNormalPlansExpireAt();
    setNormalPlansExpireAt(expireAt);
    setNow(Date.now());

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

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

    const planIsNormal = INVESTMENT_PLANS.some(
      (plan) =>
        plan.id === planId && !plan.isPremium && !plan.id.startsWith("alto-btc")
    );

    if (
      planIsNormal &&
      normalPlansExpireAt !== null &&
      normalPlansExpireAt <= Date.now()
    ) {
      setFooterType("error");
      setFooterMessage("Este plano já está esgotado.");
      return;
    }

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

  const normalPlansTimeLeft = useMemo(() => {
    if (normalPlansExpireAt === null) return THREE_DAYS_MS;
    return Math.max(0, normalPlansExpireAt - now);
  }, [normalPlansExpireAt, now]);

  const normalPlansAreAvailable = normalPlansTimeLeft > 0;

  const visibleNormalPlans = useMemo(() => {
    if (!normalPlansAreAvailable) return [];
    return normalPlans;
  }, [normalPlans, normalPlansAreAvailable]);

  function renderPlanCard(
    plan: InvestmentPlan,
    options?: {
      badge?: string;
      accent?: "green" | "blue" | "gold";
      buttonClassName?: string;
      disableByExpiry?: boolean;
      showCountdown?: boolean;
    }
  ) {
    const imageSrc = PLAN_IMAGES[plan.id] || FALLBACK_IMAGE;
    const finalReturn =
      plan.finalReturn ??
      Math.round(
        plan.amount + plan.amount * (plan.dailyRate / 100) * plan.durationDays
      );

    const accent = options?.accent || "green";

    const accentClasses =
      accent === "gold"
        ? {
            wrapper:
              "border-[#85aeb0]/40 bg-gradient-to-br from-[#3f6668] via-[#35585a] to-[#29484a]",
            title: "text-white",
            rate: "text-[#4CE087]",
            amount: "text-[#FF7B7B]",
            returnText: "text-white",
            button:
              options?.buttonClassName ||
              "bg-[#19c8d4] text-white hover:bg-[#14b7c2]",
          }
        : accent === "blue"
        ? {
            wrapper:
              "border-[#84a8b0]/40 bg-gradient-to-br from-[#3d6568] via-[#325659] to-[#294649]",
            title: "text-white",
            rate: "text-[#4CE087]",
            amount: "text-[#FF7B7B]",
            returnText: "text-white",
            button:
              options?.buttonClassName ||
              "bg-[#2c83ff] text-white hover:bg-[#1e73ef]",
          }
        : {
            wrapper:
              "border-[#84a8b0]/40 bg-gradient-to-br from-[#3d6568] via-[#325659] to-[#294649]",
            title: "text-white",
            rate: "text-[#4CE087]",
            amount: "text-[#FF7B7B]",
            returnText: "text-white",
            button:
              options?.buttonClassName ||
              "bg-[#19c8d4] text-white hover:bg-[#14b7c2]",
          };

    const isDisabled =
      buyingId === plan.id ||
      (!!options?.disableByExpiry && !normalPlansAreAvailable);

    return (
      <div
        key={plan.id}
        className={`overflow-hidden rounded-[30px] border p-3 shadow-[0_10px_30px_rgba(0,0,0,0.22)] ${accentClasses.wrapper}`}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className={`text-lg font-extrabold leading-tight ${accentClasses.title}`}>
              {plan.name}
            </p>
            <p className="mt-1 text-[11px] text-white/70">
              Duração: {plan.durationDays} dias
            </p>
          </div>

          {options?.badge && (
            <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              {options.badge}
            </span>
          )}
        </div>

        <div className="relative mb-4 h-36 w-full overflow-hidden rounded-[28px] border border-white/15 bg-white p-3 shadow-inner">
          <Image
            src={imageSrc}
            alt={plan.name}
            fill
            sizes="(max-width: 768px) 50vw, 260px"
            className="object-contain p-3"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className={`text-[14px] font-black leading-none ${accentClasses.rate}`}>
              {plan.dailyRate}%
            </p>
            <p className="mt-1 text-[12px] leading-tight text-white/70">
              Lucro diário
            </p>
          </div>

          <div className="text-right">
            <p className={`text-[14px] font-black leading-none ${accentClasses.amount}`}>
              {formatMoney(plan.amount)} MZN
            </p>
            <p className="mt-1 text-[12px] leading-tight text-white/70">
              Preço
            </p>
          </div>

          <div>
            <p className={`text-[14px] font-black leading-none ${accentClasses.returnText}`}>
              {formatMoney(finalReturn)} MZN
            </p>
            <p className="mt-1 text-[12px] leading-tight text-white/70">
              Retorno
            </p>
          </div>

          <div className="text-right">
            <p className="text-[14px] font-black leading-none text-white">
              {plan.durationDays}
            </p>
            <p className="mt-1 text-[12px] leading-tight text-white/70">
              Dias
            </p>
          </div>
        </div>

        {options?.showCountdown && normalPlansAreAvailable && (
          <div className="mt-3 rounded-2xl bg-black/15 px-3 py-2">
            <p className="text-center text-[11px] font-semibold text-white/85">
              Esgota em {formatCountdown(normalPlansTimeLeft)}
            </p>
          </div>
        )}

        <button
          onClick={() => handleBuy(plan.id)}
          disabled={isDisabled}
          className={`mt-4 w-full rounded-2xl py-3 text-sm font-bold transition disabled:opacity-60 ${accentClasses.button}`}
        >
          {buyingId === plan.id
            ? "Processando..."
            : isDisabled && options?.disableByExpiry
            ? "Esgotado"
            : "Alugar"}
        </button>
      </div>
    );
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <main className="min-h-screen bg-[#033b40] px-4 pt-4 pb-28 text-white">
      <div className="mx-auto max-w-md space-y-6">
        <div className="overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#365c60] to-[#28474a] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                HYBRID
              </h1>
              <p className="mt-1 text-sm text-white/70">
                Escolha o plano ideal para o seu perfil
              </p>
            </div>

            <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/90">
              Investimentos
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-white/10 bg-black/10 p-4">
            <p className="text-xs uppercase tracking-wide text-white/70">
              Saldo disponível
            </p>
            <p className="mt-2 text-3xl font-black text-[#4CE087]">
              {formatMoney(availableBalance)} MZN
            </p>
          </div>
        </div>

        {altoRendimentoPlans.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-extrabold uppercase tracking-wide text-white">
                Alto rendimento
              </h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white/80">
                BTC
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {altoRendimentoPlans.map((plan) =>
                renderPlanCard(plan, {
                  badge: "Hot",
                  accent: "gold",
                })
              )}
            </div>
          </section>
        )}

        {premiumPlans.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-extrabold uppercase tracking-wide text-white">
                Premium
              </h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white/80">
                VIP
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {premiumPlans.map((plan) =>
                renderPlanCard(plan, {
                  badge: "Premium",
                  accent: "blue",
                })
              )}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-extrabold uppercase tracking-wide text-white">
              Planos HYBR
            </h2>

            {normalPlansAreAvailable && (
              <div className="rounded-full bg-white/10 px-3 py-1 text-right">
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
                  Esgota em
                </p>
                <p className="text-xs font-black text-[#FF7B7B]">
                  {formatCountdown(normalPlansTimeLeft)}
                </p>
              </div>
            )}
          </div>

          {normalPlansAreAvailable ? (
            <div className="grid grid-cols-2 gap-3">
              {visibleNormalPlans.map((plan) =>
                renderPlanCard(plan, {
                  badge: plan.isBacklog ? "Back" : "HYBR",
                  accent: "green",
                  disableByExpiry: true,
                  showCountdown: true,
                })
              )}
            </div>
          ) : (
            <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[#365c60] to-[#28474a] p-5 text-center">
              <p className="text-base font-bold text-white">
                Planos HYBR esgotados
              </p>
              <p className="mt-2 text-sm text-white/70">
                Novos planos estarão disponíveis em breve.
              </p>
            </div>
          )}
        </section>
      </div>

      {footerMessage && (
        <div
          className={`fixed bottom-20 left-1/2 z-40 w-[92%] max-w-md -translate-x-1/2 rounded-2xl px-4 py-3 text-center shadow-lg backdrop-blur-sm ${
            footerType === "success"
              ? "border border-emerald-500/30 bg-emerald-500/15"
              : "border border-red-500/30 bg-red-500/10"
          }`}
        >
          <p
            className={`text-sm font-bold ${
              footerType === "success" ? "text-emerald-300" : "text-red-300"
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
