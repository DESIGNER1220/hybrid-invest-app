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
import { Coins, TrendingUp, Clock3, Wallet } from "lucide-react";
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

  const activeInvestments = useMemo(() => {
    return investments.filter((item) => item.status === "ativo");
  }, [investments]);

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
            Investimentos alugados em andamento.
          </p>
        </div>

        {activeInvestments.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center shadow-lg">
            <p className="text-xs text-slate-400">
              Ainda não tens investimentos ativos.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeInvestments.map((item) => {
              const image = PLAN_IMAGES[item.planId || ""] || FALLBACK;

              const amount = Number(item.amount ?? 0);
              const accruedProfit = Number(item.accruedProfit ?? 0);
              const finalReturn = Number(item.finalReturn ?? 0);
              const totalProfit = Math.max(0, finalReturn - amount);

              const progress =
                item.durationDays && Number(item.durationDays) > 0
                  ? (Number(item.elapsedDays ?? 0) /
                      Number(item.durationDays)) *
                    100
                  : 0;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 shadow-lg"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate text-[11px] font-bold text-white">
                        {item.planName || "Plano"}
                      </h2>
                      <p className="mt-0.5 text-[9px] text-slate-400">
                        Estado:{" "}
                        <span className="font-semibold text-emerald-400">
                          Activo
                        </span>
                      </p>
                    </div>

                    <div className="shrink-0 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1.5 text-right">
                      <p className="text-[8px] uppercase tracking-wide text-slate-300">
                        Compra
                      </p>
                      <p className="text-[10px] font-bold text-amber-300">
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
                        {item.elapsedDays} pagos • {item.remainingDays} rest.
                      </p>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between text-[9px] text-slate-400">
                      <span>Progresso</span>
                      <span>{Math.round(progress)}%</span>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, progress))}%`,
                        }}
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