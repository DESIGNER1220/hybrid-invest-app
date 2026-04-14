"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getUserProfile } from "../services/authService";
import BottomNav from "../components/BottomNav";

type UserProfile = {
  balance?: number;
  totalProfit?: number;
  bonus?: number;
  role?: string;
};

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("pt-MZ");
}

export default function DashboardPage() {
  const router = useRouter();

  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(uid: string) {
    const profile = await getUserProfile(uid);
    setUserData(profile as UserProfile);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        await load(user.uid);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  const balance = Number(userData?.balance ?? 0);
  const totalProfit = Number(userData?.totalProfit ?? 0);
  const bonus = Number(userData?.bonus ?? 0);
  const isAdmin = userData?.role === "admin";

  const total = balance + totalProfit + bonus;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black p-6 text-white">
        Carregando...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black px-4 pt-4 pb-28 text-white">
      <div className="mx-auto max-w-md space-y-5">
        {/* BOTÕES */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push("/deposito")}
            className="w-36 rounded-2xl bg-emerald-500 py-3 text-sm font-bold text-black shadow-lg transition hover:bg-emerald-400"
          >
            Depositar
          </button>

          <button
            onClick={() => router.push("/levantamento")}
            className="w-36 rounded-2xl bg-amber-500 py-3 text-sm font-bold text-black shadow-lg transition hover:bg-amber-400"
          >
            Levantar
          </button>
        </div>

        {/* BOTÃO ADMIN */}
        {isAdmin && (
          <div className="flex justify-center">
            <button
              onClick={() => router.push("/admin")}
              className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-lg transition hover:bg-red-400"
            >
              Painel do Administrador
            </button>
          </div>
        )}

        {/* SALDO + LUCRO */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center shadow-lg">
            <p className="text-[11px] uppercase tracking-wide text-slate-300">
              Saldo total
            </p>
            <h3 className="mt-1 text-lg font-bold text-emerald-400">
              {formatMoney(total)} MZN
            </h3>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-center shadow-lg">
            <p className="text-[11px] uppercase tracking-wide text-slate-300">
              Lucro
            </p>
            <h3 className="mt-1 text-lg font-bold text-cyan-400">
              {formatMoney(totalProfit)} MZN
            </h3>
          </div>
        </div>

        {/* BÓNUS */}
        <div className="flex justify-center">
          <div className="w-36 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-center shadow-lg">
            <p className="text-[11px] uppercase tracking-wide text-slate-300">
              Bónus
            </p>
            <h3 className="mt-1 text-base font-bold text-blue-400">
              {formatMoney(bonus)} MZN
            </h3>
          </div>
        </div>

        {/* IMAGENS */}
        <div className="space-y-3">
          <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-white/10 shadow-lg">
            <Image
              src="/dashboard/server.jpg"
              alt="Infraestrutura"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-sm font-bold text-white">
                Infraestrutura tecnológica moderna
              </p>
            </div>
          </div>

          <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-white/10 shadow-lg">
            <Image
              src="/dashboard/finance.jpg"
              alt="Investimento"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-sm font-bold text-white">
                Crescimento financeiro com visão de futuro
              </p>
            </div>
          </div>
        </div>

        {/* TEXTO EMPRESA */}
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-slate-900 p-5 text-center shadow-lg">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="text-xl">🏢</span>
            <h2 className="text-lg font-bold text-amber-400">Sobre a HYBR</h2>
          </div>

          <p className="text-sm leading-relaxed text-slate-200">
            O{" "}
            <span className="font-bold text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.45)]">
              HYBR
            </span>{" "}
            é um sistema de rendimento financeiro projectado para ajudar muitos
            Moçambicanos desde{" "}
            <span className="font-bold text-white">1 de Abril de 2026</span>,
            criando evolução financeira e novas oportunidades para o futuro.
          </p>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-sm text-slate-300">
              <span className="mr-1">📍</span>
              Estamos localizados em{" "}
              <span className="font-bold text-white">Nampula</span>, onde se
              encontra a nossa sede.
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}