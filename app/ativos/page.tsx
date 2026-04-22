"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import {
  getUserInvestments,
  getUserProfile,
} from "../services/authService";
import {
  Coins,
  TrendingUp,
  Clock3,
  Wallet,
  CheckCircle2,
  TimerReset,
  Hourglass,
} from "lucide-react";
import BottomNav from "../components/BottomNav";

type UserProfile = {
  balance?: number;
};

type UserInvestment = {
  id: string;
  planId?: string;
  planName?: string;
  amount?: number;
  dailyRate?: number;
  durationDays?: number;
  elapsedDays?: number;
  remainingDays?: number;
  accruedProfit?: number;
  status?: string;
  finalReturn?: number;
};

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

const FALLBACK = "/plans/hybr-1-new.png";

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("pt-MZ");
}

function isInvestmentCompleted(item: UserInvestment) {
  const elapsedDays = Number(item.elapsedDays ?? 0);
  const durationDays = Number(item.durationDays ?? 0);
  const remainingDays = Number(item.remainingDays ?? 0);

  if (durationDays <= 0) return false;

  return remainingDays <= 0 || elapsedDays >= durationDays;
}

function hasPaidDailyProfit(item: UserInvestment) {
  return Number(item.elapsedDays ?? 0) >= 1;
}

function InvestmentCard({
  item,
  variant,
}: {
  item: UserInvestment;
  variant: "waiting24h" | "dailyPaid" | "completed";
}) {
  const image = PLAN_IMAGES[item.planId || ""] || FALLBACK;

  const amount = Number(item.amount ?? 0);
  const accruedProfit = Number(item.accruedProfit ?? 0);
  const finalReturn = Number(item.finalReturn ?? 0);
  const totalProfit = Math.max(0, finalReturn - amount);

  const progress =
    item.durationDays && Number(item.durationDays) > 0
      ? (Number(item.elapsedDays ?? 0) / Number(item.durationDays)) * 100
      : 0;

  const isCompleted = variant === "completed";

  const cardClass =
    variant === "completed"
      ? "border-cyan-500/20 bg-cyan-500/10"
      : variant === "dailyPaid"
      ? "border-emerald-500/20 bg-emerald-500/10"
      : "border-amber-500/20 bg-amber-500/10";

  const statusColor =
    variant === "completed"
      ? "text-cyan-400"
      : variant === "dailyPaid"
      ? "text-emerald-400"
      : "text-amber-300";

  const statusLabel =
    variant === "completed"
      ? "Concluído"
      : variant === "dailyPaid"
      ? "Já pagou lucro diário"
      : "À espera das primeiras 24h";

  return (
    <div className={`rounded-xl border p-2.5 shadow-lg ${cardClass}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-[11px] font-bold text-white">
            {item.planName || "Plano"}
          </h2>
          <p className="mt-0.5 text-[9px] text-slate-400">
            Estado: <span className={`font-semibold ${statusColor}`}>{statusLabel}</span>
          </p>
        </div>

        <div className="shrink-0 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-right">
          <p className="text-[8px] uppercase tracking-wide text-slate-300">
            Compra
          </p>
          <p className="text-[10px] font-bold text-white">
            {formatMoney(amount)} MZN
          </p>
        </div>
      </div>

      <div className="relative mb-2 h-20 w-full overflow-hidden rounded-lg">
        <Image
          src={image}
          alt={item.planName || "Plano"}
          fill
          sizes="(max-width: 768px) 100vw, 384px"
          className="object-cover"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-black/20 p-2">
          <div className="mb-1 flex items-center gap-1">
            <TrendingUp size={11} className="text-emerald-400" />
            <p className="text-[9px] text-slate-400">Lucro atual</p>
          </div>
          <p className="text-[10px] font-bold text-emerald-400">
            {formatMoney(accruedProfit)} MZN
          </p>
        </div>

        <div className="rounded-lg bg-black/20 p-2">
          <div className="mb-1 flex items-center gap-1">
            <Wallet size={11} className="text-cyan-400" />
            <p className="text-[9px] text-slate-400">Lucro total</p>
          </div>
          <p className="text-[10px] font-bold text-cyan-400">
            {formatMoney(totalProfit)} MZN
          </p>
        </div>

        <div className="rounded-lg bg-black/20 p-2">
          <div className="mb-1 flex items-center gap-1">
            <Coins size={11} className="text-amber-400" />
            <p className="text-[9px] text-slate-400">Retorno final</p>
          </div>
          <p className="text-[10px] font-bold text-amber-300">
            {formatMoney(finalReturn)} MZN
          </p>
        </div>

        <div className="rounded-lg bg-black/20 p-2">
          <div className="mb-1 flex items-center gap-1">
            <Clock3 size={11} className="text-cyan-400" />
            <p className="text-[9px] text-slate-400">Prazo</p>
          </div>
          <p className="text-[10px] font-bold text-white">
            {isCompleted
              ? `${item.durationDays ?? 0} dias concluídos`
              : `${item.elapsedDays ?? 0} pagos • ${item.remainingDays ?? 0} rest.`}
          </p>
        </div>
      </div>

      <div className="mt-2">
        <div className="mb-1 flex items-center justify-between text-[9px] text-slate-400">
          <span>Progresso</span>
          <span>{isCompleted ? "100%" : `${Math.round(progress)}%`}</span>
        </div>

        <div className="h-1.5 w-full rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full ${
              isCompleted
                ? "bg-cyan-500"
                : variant === "dailyPaid"
                ? "bg-emerald-500"
                : "bg-amber-400"
            }`}
            style={{
              width: `${isCompleted ? 100 : Math.min(100, Math.max(0, progress))}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AtivosPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [investments, setInvestments] = useState<UserInvestment[]>([]);

  async function loadAll(uid: string) {
    const [profileData, investmentData] = await Promise.all([
      getUserProfile(uid),
      getUserInvestments(uid),
    ]);

    setProfile(profileData as UserProfile);
    setInvestments(investmentData as UserInvestment[]);
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
        console.error("Erro ao carregar ativos:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const visibleInvestments = useMemo(() => {
    return investments.filter((item) => item.status === "ativo");
  }, [investments]);

  const completedInvestments = useMemo(() => {
    return visibleInvestments.filter((item) => isInvestmentCompleted(item));
  }, [visibleInvestments]);

  const dailyPaidInvestments = useMemo(() => {
    return visibleInvestments.filter(
      (item) => !isInvestmentCompleted(item) && hasPaidDailyProfit(item)
    );
  }, [visibleInvestments]);

  const waiting24hInvestments = useMemo(() => {
    return visibleInvestments.filter(
      (item) => !isInvestmentCompleted(item) && !hasPaidDailyProfit(item)
    );
  }, [visibleInvestments]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black px-3 pt-3 pb-24 text-white">
        <div className="mx-auto max-w-sm">
          <p className="text-sm">Carregando...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black px-2.5 pt-3 pb-24 text-white">
      <div className="mx-auto max-w-sm space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-lg">
          <h1 className="text-base font-bold">Ativos</h1>
          <p className="mt-1 text-[11px] text-slate-400">
            Investimentos separados por fase de pagamento.
          </p>
        </div>

        {visibleInvestments.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center shadow-lg">
            <p className="text-xs text-slate-400">
              Ainda não tens investimentos ativos.
            </p>
          </div>
        ) : (
          <>
            <section className="space-y-2.5">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                <div className="flex items-center gap-2">
                  <Hourglass size={15} className="text-amber-300" />
                  <h2 className="text-sm font-bold text-white">
                    Ainda não pagaram 24h
                  </h2>
                </div>
                <p className="mt-1 text-[11px] text-slate-300">
                  Investimentos que ainda não completaram o primeiro ciclo diário.
                </p>
              </div>

              {waiting24hInvestments.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center shadow-lg">
                  <p className="text-xs text-slate-400">
                    Nenhum investimento nesta fase.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {waiting24hInvestments.map((item) => (
                    <InvestmentCard
                      key={item.id}
                      item={item}
                      variant="waiting24h"
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2.5">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                <div className="flex items-center gap-2">
                  <TimerReset size={15} className="text-emerald-400" />
                  <h2 className="text-sm font-bold text-white">
                    Já pagaram lucro diário
                  </h2>
                </div>
                <p className="mt-1 text-[11px] text-slate-300">
                  Investimentos que já completaram pelo menos 24h e já renderam lucro diário.
                </p>
              </div>

              {dailyPaidInvestments.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center shadow-lg">
                  <p className="text-xs text-slate-400">
                    Nenhum investimento já pagou lucro diário ainda.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dailyPaidInvestments.map((item) => (
                    <InvestmentCard
                      key={item.id}
                      item={item}
                      variant="dailyPaid"
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2.5">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-cyan-400" />
                  <h2 className="text-sm font-bold text-white">Já concluídos</h2>
                </div>
                <p className="mt-1 text-[11px] text-slate-300">
                  Investimentos cujo prazo já terminou.
                </p>
              </div>

              {completedInvestments.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center shadow-lg">
                  <p className="text-xs text-slate-400">
                    Ainda não tens investimentos concluídos.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {completedInvestments.map((item) => (
                    <InvestmentCard
                      key={item.id}
                      item={item}
                      variant="completed"
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}