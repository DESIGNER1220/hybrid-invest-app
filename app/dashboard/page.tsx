"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import { getUserProfile, logoutUser } from "../services/authService";
import BottomNav from "../components/BottomNav";
import DownloadAppButton from "../components/DownloadAppButton";
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
  const [bannerPaused, setBannerPaused] = useState(false);
  const [showPauseNotice, setShowPauseNotice] = useState(false);

  async function load(uid: string) {
    const profile = await getUserProfile(uid);
    setUserData(profile as UserProfile);
  }

  async function handleLogout() {
    await logoutUser();
    router.push("/login");
  }

  function handleBannerTap() {
    setBannerPaused(true);
    setShowPauseNotice(true);

    setTimeout(() => {
      setShowPauseNotice(false);
      setBannerPaused(false);
    }, 5000);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black p-4 text-white">
        Carregando...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black px-3 pt-5 pb-24 text-white">
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="fixed top-4 right-4 z-50 rounded-full bg-red-500/20 p-2 text-red-400 shadow"
      >
        <LogOut size={18} />
      </button>

      <div className="mx-auto max-w-sm space-y-4">
        <div
          onClick={handleBannerTap}
          className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/10 py-2"
        >
          {showPauseNotice ? (
            <div className="px-3 text-center text-[11px] font-bold text-amber-200">
              AVISO PARAR
            </div>
          ) : (
            <div
              className={`whitespace-nowrap px-2 text-[11px] font-bold text-amber-300 ${
                bannerPaused ? "animate-none" : "animate-marquee"
              }`}
            >
              🚫 Não utilizamos grupos de WhatsApp nem Telegram — Para qualquer
              dúvida por favor entre em contacto aqui na nossa plataforma no
              ícone verde abaixo no lado direito — Obrigado, juntos faturamos,
              juntos venceremos 🚀
            </div>
          )}
        </div>

        <DownloadAppButton />

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

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => router.push("/deposito")}
            className="rounded-xl bg-emerald-500 py-2 text-xs font-bold text-black"
          >
            Depositar
          </button>

          <button
            onClick={() => router.push("/levantamento")}
            className="rounded-xl bg-amber-500 py-2 text-xs font-bold text-black"
          >
            Levantar
          </button>

          <button
            onClick={() => router.push("/chat-global")}
            className="rounded-xl bg-cyan-500 py-2 text-xs font-bold text-black"
          >
            Suporte
          </button>
        </div>

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

        <div className="space-y-2">
          <div className="relative h-28 w-full overflow-hidden rounded-xl">
            <Image
              src="/dashboard/server.jpg"
              alt="Infraestrutura"
              fill
              sizes="(max-width: 768px) 100vw, 384px"
              className="object-cover"
            />
          </div>

          <div className="relative h-28 w-full overflow-hidden rounded-xl">
            <Image
              src="/dashboard/finance.jpg"
              alt="Investimento"
              fill
              sizes="(max-width: 768px) 100vw, 384px"
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-72 rounded-xl bg-slate-900 p-4 text-center">
            <p className="mb-3 text-sm">Sair da conta?</p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded bg-gray-700 py-2"
              >
                Cancelar
              </button>

              <button
                onClick={handleLogout}
                className="flex-1 rounded bg-red-500 py-2"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-120%);
          }
        }

        .animate-marquee {
          display: inline-block;
          min-width: max-content;
          animation: marquee 38s linear infinite;
        }

        .animate-none {
          animation: none !important;
        }
      `}</style>
    </main>
  );
}