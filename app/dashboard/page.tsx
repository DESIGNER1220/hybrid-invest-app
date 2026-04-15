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

  async function load(uid: string) {
    const profile = await getUserProfile(uid);
    setUserData(profile as UserProfile);
  }

  async function handleLogout() {
    await logoutUser();
    router.push("/login");
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

  const total = balance + totalProfit + bonus;

  if (loading) {
    return <div className="p-4 text-white">Carregando...</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black px-3 pt-5 pb-24 text-white">

      {/* LOGOUT */}
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="fixed top-4 right-4 z-50 rounded-full bg-red-500/20 p-2 text-red-400 shadow"
      >
        <LogOut size={18} />
      </button>

      <div className="mx-auto max-w-sm space-y-4">

        {/* SALDO */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow">
          
          <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
            <p className="text-[10px] text-slate-300">Saldo total</p>
            <h2 className="text-lg font-bold text-emerald-400">
              {formatMoney(total)} MZN
            </h2>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-cyan-500/10 p-3 text-center">
              <p className="text-[10px] text-slate-300">Lucro</p>
              <h3 className="text-sm font-bold text-cyan-400">
                {formatMoney(totalProfit)} MZN
              </h3>
            </div>

            <div className="rounded-xl bg-blue-500/10 p-3 text-center">
              <p className="text-[10px] text-slate-300">Bónus</p>
              <h3 className="text-sm font-bold text-blue-400">
                {formatMoney(bonus)} MZN
              </h3>
            </div>
          </div>
        </div>

        {/* BOTÕES */}
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/deposito")}
            className="flex-1 rounded-xl bg-emerald-500 py-2 text-xs font-bold text-black"
          >
            Depositar
          </button>

          <button
            onClick={() => router.push("/levantamento")}
            className="flex-1 rounded-xl bg-amber-500 py-2 text-xs font-bold text-black"
          >
            Levantar
          </button>
        </div>

        {/* IMAGENS */}
        <div className="space-y-2">
          <div className="relative h-28 w-full overflow-hidden rounded-xl">
            <Image src="/dashboard/server.jpg" alt="" fill className="object-cover" />
          </div>

          <div className="relative h-28 w-full overflow-hidden rounded-xl">
            <Image src="/dashboard/finance.jpg" alt="" fill className="object-cover" />
          </div>
        </div>
      </div>

      {/* CONFIRMAR LOGOUT */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60">
          <div className="w-72 rounded-xl bg-slate-900 p-4 text-center">
            <p className="text-sm mb-3">Sair da conta?</p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-gray-700 py-2 rounded"
              >
                Cancelar
              </button>

              <button
                onClick={handleLogout}
                className="flex-1 bg-red-500 py-2 rounded"
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