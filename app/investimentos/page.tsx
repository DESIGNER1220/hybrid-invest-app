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

    const badgeClass =
      accent === "gold"
        ? "bg-yellow-400/20 text-yellow-200 border-yellow-300/30"
        : accent === "blue"
        ? "bg-sky-400/20 text-sky-200 border-sky-300/30"
        : "bg-emerald-400/20 text-emerald-200 border-emerald-300/30";

    const buttonClass =
      accent === "gold"
        ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-[#102b32]"
        : accent === "blue"
        ? "bg-gradient-to-r from-sky-400 to-blue-600 text-white"
        : "bg-gradient-to-r from-emerald-400 to-cyan-500 text-[#102b32]";

    const isDisabled =
      buyingId === plan.id ||
      (!!options?.disableByExpiry && !normalPlansAreAvailable);

    return (
      <div
        key={plan.id}
        className="relative w-[188px] shrink-0 snap-start overflow-hidden rounded-[18px] border border-cyan-200/10 bg-[#126080]/80 p-3 shadow-[0_10px_25px_rgba(0,0,0,0.35)] backdrop-blur-md"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />

        <div className="relative z-10">
          <div className="relative h-[110px] w-full overflow-hidden rounded-[14px] border border-white/10 bg-gradient-to-br from-[#dffbff] to-[#6aa5b6] p-2 shadow-inner">
            <Image
              src={imageSrc}
              alt={plan.name}
              fill
              sizes="188px"
              className="object-contain p-2"
            />
          </div>

          <div className="mt-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="break-words text-[5px] font-extrabold leading-[7px] text-white drop-shadow">
                {plan.name}
              </h3>

              <p className="mt-2 text-[19px] font-black leading-none text-[#48e07a]">
                {formatMoney(plan.amount)} MT
              </p>
            </div>

            {options?.badge && (
              <span
                className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase ${badgeClass}`}
              >
                {options.badge}
              </span>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[#073948]/70 px-2 py-2">
              <p className="text-[10px] font-semibold text-white/60">
                Lucro diário
              </p>
              <p className="text-[13px] font-black text-[#ffe071]">
                {plan.dailyRate}%
              </p>
            </div>

            <div className="rounded-xl bg-[#073948]/70 px-2 py-2 text-right">
              <p className="text-[10px] font-semibold text-white/60">
                Duração
              </p>
              <p className="text-[13px] font-black text-white">
                {plan.durationDays} dias
              </p>
            </div>
          </div>

          <div className="mt-2 rounded-xl bg-[#073948]/70 px-2 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold text-white/60">
                Retorno
              </p>
              <p className="text-[13px] font-black text-[#48e07a]">
                {formatMoney(finalReturn)} MT
              </p>
            </div>
          </div>

          {options?.showCountdown && normalPlansAreAvailable && (
            <div className="mt-2 rounded-xl border border-red-300/20 bg-red-500/10 px-2 py-2">
              <p className="text-center text-[10px] font-bold text-red-100">
                Esgota em {formatCountdown(normalPlansTimeLeft)}
              </p>
            </div>
          )}

          <button
            onClick={() => handleBuy(plan.id)}
            disabled={isDisabled}
            className={`mt-3 w-full rounded-xl py-2.5 text-[13px] font-black shadow-lg transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${buttonClass}`}
          >
            {buyingId === plan.id
              ? "Processando..."
              : isDisabled && options?.disableByExpiry
              ? "Esgotado"
              : "Alugar"}
          </button>
        </div>
      </div>
    );
  }

  function renderSection(
    title: string,
    plans: InvestmentPlan[],
    options?: {
      badge?: string;
      accent?: "green" | "blue" | "gold";
      disableByExpiry?: boolean;
      showCountdown?: boolean;
      rightLabel?: string;
    }
  ) {
    if (plans.length <= 0) return null;

    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <h2 className="text-[23px] font-black text-[#ffd25c] drop-shadow">
            {title}
          </h2>

          {options?.rightLabel && (
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-[#ffd25c] backdrop-blur"
            >
              {options.rightLabel}
              <span className="text-xl leading-none">›</span>
            </button>
          )}
        </div>

        <div className="investment-scroll flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-5 pr-8">
          {plans.map((plan) =>
            renderPlanCard(plan, {
              badge: options?.badge,
              accent: options?.accent,
              disableByExpiry: options?.disableByExpiry,
              showCountdown: options?.showCountdown,
            })
          )}
        </div>
      </section>
    );
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#052b38] pb-28 text-white">
      <style jsx global>{`
        .investment-scroll {
          scrollbar-width: auto;
          scrollbar-color: rgba(103, 232, 249, 0.9) rgba(255, 255, 255, 0.14);
        }

        .investment-scroll::-webkit-scrollbar {
          height: 9px;
        }

        .investment-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.14);
          border-radius: 999px;
        }

        .investment-scroll::-webkit-scrollbar-thumb {
          background: rgba(103, 232, 249, 0.9);
          border-radius: 999px;
        }

        .investment-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 1);
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#17839d_0%,transparent_32%),linear-gradient(135deg,rgba(42,220,255,0.16)_0%,transparent_35%),linear-gradient(180deg,#052b38_0%,#073648_45%,#052b38_100%)]" />

      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute left-[-80px] top-[230px] h-[360px] w-[360px] rounded-full border-[28px] border-cyan-300/10" />
        <div className="absolute right-[-90px] top-[160px] h-[270px] w-[270px] rounded-full border-[24px] border-emerald-300/10" />
        <div className="absolute left-1/2 top-[360px] h-[420px] w-[420px] -translate-x-1/2 rounded-full border-[1px] border-cyan-200/20" />
      </div>

      <div className="relative z-10 mx-auto max-w-md px-3 pt-3">
        <div className="overflow-hidden rounded-[22px] border border-cyan-100/10 bg-[#0b4053]/80 shadow-[0_12px_35px_rgba(0,0,0,0.35)] backdrop-blur-md">
          <div className="relative h-[150px] overflow-hidden bg-gradient-to-br from-[#7ed3e5] via-[#2e7f96] to-[#123d50]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.6),transparent_22%),linear-gradient(135deg,rgba(255,255,255,0.2),transparent_40%)]" />

            <div className="absolute left-4 top-4">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/80">
                Hybrid Mining
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white drop-shadow">
                Investimentos
              </h1>
              <p className="mt-1 text-sm font-semibold text-white/80">
                Escolha o seu plano e comece a lucrar
              </p>
            </div>

            <div className="absolute bottom-4 right-4 rounded-2xl border border-white/20 bg-black/25 px-4 py-3 text-right backdrop-blur">
              <p className="text-[10px] font-bold uppercase text-white/60">
                Saldo disponível
              </p>
              <p className="text-xl font-black text-[#49ee85]">
                {formatMoney(availableBalance)} MT
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-6">
          {renderSection(
            "Produtos",
            normalPlansAreAvailable ? visibleNormalPlans : [],
            {
              badge: "HYBR",
              accent: "green",
              disableByExpiry: true,
              showCountdown: true,
              rightLabel: "Mais",
            }
          )}

          {!normalPlansAreAvailable && (
            <div className="rounded-[22px] border border-white/10 bg-[#126080]/70 p-5 text-center shadow-[0_10px_25px_rgba(0,0,0,0.28)] backdrop-blur-md">
              <p className="text-lg font-black text-white">
                Planos HYBR esgotados
              </p>
              <p className="mt-2 text-sm font-semibold text-white/70">
                Novos planos estarão disponíveis em breve.
              </p>
            </div>
          )}

          {renderSection("Premium", premiumPlans, {
            badge: "VIP",
            accent: "blue",
            rightLabel: "Mais",
          })}

          {renderSection("Alto rendimento", altoRendimentoPlans, {
            badge: "HOT",
            accent: "gold",
            rightLabel: "BTC",
          })}
        </div>
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
