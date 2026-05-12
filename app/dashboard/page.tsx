"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LogOut, MapPin } from "lucide-react";
import { auth } from "../lib/firebase";
import { getUserProfile, logoutUser } from "../services/authService";
import BottomNav from "../components/BottomNav";
import DownloadAppButton from "../components/DownloadAppButton";

type UserProfile = {
  balance?: number;
  totalProfit?: number;
  availableProfit?: number;
  bonus?: number;
  role?: string;
};

const dashboardSlides = [
  {
    src: "/dashboard/server.jpg",
    alt: "Infraestrutura",
  },
  {
    src: "/dashboard/finance.jpg",
    alt: "Investimento",
  },
];

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
  const [currentSlide, setCurrentSlide] = useState(0);

  const companyLocation = "Montepuez, Cabo Delgado — Moçambique";

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % dashboardSlides.length);
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const balance = Number(userData?.balance ?? 0);
  const totalProfit = Number(userData?.totalProfit ?? 0);
  const availableProfit = Number(userData?.availableProfit ?? 0);
  const bonus = Number(userData?.bonus ?? 0);
  const isAdmin = userData?.role === "admin";
  const total = balance + availableProfit + bonus;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black p-4 text-white">
        Carregando...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black px-3 pt-5 pb-24 text-white">
      <div className="fixed left-4 top-4 z-50">
        <DownloadAppButton className="shadow-lg" />
      </div>

      <button
        type="button"
        onClick={() => setShowLogoutConfirm(true)}
        className="fixed top-4 right-4 z-50 rounded-full bg-red-500/20 p-2 text-red-400 shadow"
      >
        <LogOut size={18} />
      </button>

      <div className="mx-auto max-w-sm space-y-3 pt-12">
        <div
          onClick={handleBannerTap}
          className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/10 py-1.5"
        >
          {showPauseNotice ? (
            <div className="px-3 text-center text-[10px] font-bold text-amber-200">
              AVISO PARAR
            </div>
          ) : (
            <div
              className={`whitespace-nowrap px-2 text-[10px] font-bold text-amber-300 ${
                bannerPaused ? "animate-none" : "animate-marquee"
              }`}
            >
              🚫 Não utilizamos grupos de WhatsApp nem Telegram — Para qualquer
              dúvida por favor entre em contacto aqui na nossa plataforma no
              ícone verde abaixo no lado direito prestar atenciosamente —
              Obrigado, juntos faturamos, juntos venceremos 🚀
            </div>
          )}
        </div>

        <div className="flex w-full justify-start">
          <div className="w-full text-left leading-tight">
            <div className="mb-1">
              <p className="text-[12px] font-medium uppercase tracking-wide text-slate-400">
                Saldo total
              </p>
              <h2 className="text-[9px] font-bold text-emerald-400">
                {formatMoney(total)} MZN
              </h2>
            </div>

            <div className="mb-1">
              <p className="text-[8px] font-medium uppercase tracking-wide text-slate-400">
                Lucro
              </p>
              <h3 className="text-[7px] font-bold text-cyan-400">
                {formatMoney(availableProfit)} MZN
              </h3>
            </div>

            <div className="mb-1">
              <p className="text-[7px] font-medium uppercase tracking-wide text-slate-400">
                Bónus
              </p>
              <h3 className="text-[7px] font-bold text-blue-400">
                {formatMoney(bonus)} MZN
              </h3>
            </div>

            <div className="text-[7px] text-slate-500">
              Lucro bruto calculado: {formatMoney(totalProfit)} MZN
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => router.push("/deposito")}
            className="rounded-xl bg-emerald-500 py-2 text-[11px] font-bold text-black"
          >
            Depositar
          </button>

          <button
            type="button"
            onClick={() => router.push("/levantamento")}
            className="rounded-xl bg-amber-500 py-2 text-[11px] font-bold text-black"
          >
            Levantar
          </button>

          <button
            type="button"
            onClick={() => router.push("/chat-global")}
            className="rounded-xl bg-cyan-500 py-2 text-[11px] font-bold text-black"
          >
            Suporte
          </button>
        </div>

        {isAdmin && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="rounded-xl bg-red-500 px-4 py-2 text-[11px] font-bold text-white shadow-lg hover:bg-red-400"
            >
              Painel do Administrador
            </button>
          </div>
        )}

        <div className="relative h-36 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg">
          {dashboardSlides.map((slide, index) => (
            <Image
              key={slide.src}
              src={slide.src}
              alt={slide.alt}
              fill
              sizes="(max-width: 768px) 100vw, 384px"
              className={`object-cover transition-opacity duration-700 ${
                currentSlide === index ? "opacity-100" : "opacity-0"
              }`}
              priority={index === 0}
            />
          ))}

          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />

          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {dashboardSlides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === index
                    ? "w-6 bg-amber-400"
                    : "w-2 bg-white/60"
                }`}
                aria-label={`Ver imagem ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 shadow">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
            <MapPin size={18} />
          </div>

          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              Nossa localização
            </p>
            <p className="text-xs font-bold text-emerald-300">
              {companyLocation}
            </p>
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-72 rounded-xl bg-slate-900 p-4 text-center">
            <p className="mb-3 text-sm">Sair da conta?</p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded bg-gray-700 py-2 text-sm"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 rounded bg-red-500 py-2 text-sm"
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
