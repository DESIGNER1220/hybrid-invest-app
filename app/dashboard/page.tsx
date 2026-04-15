"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getUserProfile, logoutUser } from "../services/authService";
import BottomNav from "../components/BottomNav";
import { LogOut } from "lucide-react";

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function load(uid: string) {
    const profile = await getUserProfile(uid);
    setUserData(profile as UserProfile);
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await logoutUser();
      router.push("/login");
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
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
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black px-4 pt-6 pb-28 text-white">

      {/* 🔴 LOGOUT FIXO */}
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="fixed top-5 right-5 z-50 rounded-full bg-red-500/20 p-3 text-red-400 shadow-lg backdrop-blur transition hover:bg-red-500/30 active:scale-95"
      >
        <LogOut size={20} />
      </button>

      <div className="mx-auto max-w-md space-y-5">

        {/* SALDO */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur">
          <div className="space-y-3">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
              <p className="text-[11px] uppercase text-slate-300">
                Saldo total
              </p>
              <h2 className="mt-1 text-xl font-bold text-emerald-400">
                {formatMoney(total)} MZN
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-center">
                <p className="text-[11px] text-slate-300">Lucro</p>
                <h3 className="mt-1 text-base font-bold text-cyan-400">
                  {formatMoney(totalProfit)} MZN
                </h3>
              </div>

              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-center">
                <p className="text-[11px] text-slate-300">Bónus</p>
                <h3 className="mt-1 text-base font-bold text-blue-400">
                  {formatMoney(bonus)} MZN
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* BOTÕES */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push("/deposito")}
            className="w-36 rounded-2xl bg-emerald-500 py-3 text-sm font-bold text-black shadow-lg hover:bg-emerald-400"
          >
            Depositar
          </button>

          <button
            onClick={() => router.push("/levantamento")}
            className="w-36 rounded-2xl bg-amber-500 py-3 text-sm font-bold text-black shadow-lg hover:bg-amber-400"
          >
            Levantar
          </button>
        </div>

        {/* ADMIN */}
        {isAdmin && (
          <div className="flex justify-center">
            <button
              onClick={() => router.push("/admin")}
              className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-red-400"
            >
              Painel do Administrador
            </button>
          </div>
        )}

        {/* IMAGENS */}
        <div className="space-y-3">
          <div className="relative h-40 w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg">
            <Image src="/dashboard/server.jpg" alt="Infraestrutura" fill className="object-cover" />
          </div>

          <div className="relative h-40 w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg">
            <Image src="/dashboard/finance.jpg" alt="Investimento" fill className="object-cover" />
          </div>
        </div>
      </div>

      {/* CONFIRMAÇÃO */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 p-5">
            <h3 className="text-lg font-bold">Terminar sessão?</h3>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl bg-gray-700 py-3"
              >
                Cancelar
              </button>

              <button
                onClick={handleLogout}
                className="flex-1 rounded-xl bg-red-500 py-3"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}