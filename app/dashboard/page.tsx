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
  { src: "/dashboard/server.jpg", alt: "Infraestrutura" },
  { src: "/dashboard/finance.jpg", alt: "Investimento" },
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
  const [showPromo, setShowPromo] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const companyLocation = "Montepuez, Cabo Delgado — Moçambique";

  const launchDate = new Date();
  launchDate.setDate(launchDate.getDate() + ((8 - launchDate.getDay()) % 7));
  launchDate.setHours(0, 0, 0, 0);

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
        setShowPromo(true);
        setTimeout(() => setShowPromo(false), 5000);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  // Contagem regressiva
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = launchDate.getTime() - now.getTime();
      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Slider automático
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

  // Spinner elegante inicial
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-16 h-16 rounded-full animate-spin relative shadow-[0_0_20px_#3b82f6,0_0_20px_#10b981,0_0_20px_#f87171]">
          <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-l-transparent border-blue-400 border-r-green-400 border-b-red-400"></div>
        </div>
      </div>
    );
  }

  // Propaganda após login
  if (showPromo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-400 via-green-300 to-red-300 text-white">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 uppercase text-center">
          Novos Planos de Investimento!
        </h2>

        <div className="overflow-hidden w-full sm:max-w-lg rounded-xl p-4 shadow-lg bg-gradient-to-r from-blue-300 via-green-200 to-red-200">
          <div className="whitespace-nowrap animate-marquee text-white font-bold text-base sm:text-lg mb-4 text-center">
            🚀 Prepare-se! Novos planos chegando nesta segunda-feira! Aproveite para investir e multiplicar seus lucros! 💰
          </div>

          <div className="text-white font-bold text-lg sm:text-xl text-center">
            Lançamento em: {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m{" "}
            {timeLeft.seconds}s
          </div>
        </div>

        <button
          className="mt-14 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white text-blue-600 shadow-lg hover:bg-gray-100 transition"
          onClick={() => setShowPromo(false)}
          aria-label="Continuar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6 sm:w-7 sm:h-7"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </button>
      </div>
    );
  }

  // Dashboard completo
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
        {/* Banner */}
        <div
          onClick={handleBannerTap}
          className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/10 py-1.5"
        >
          {showPauseNotice ? (
            <div className="px-3 text-center text-[10px] font-bold text-amber-200">AVISO PARAR</div>
          ) : (
            <div
              className={`whitespace-nowrap px-2 text-[10px] font-bold text-amber-300 ${
                bannerPaused ? "animate-none" : "animate-marquee"
              }`}
            >
              🚫 Não utilizamos grupos de WhatsApp nem Telegram — Para qualquer dúvida entre em contacto aqui na nossa plataforma no ícone verde abaixo no lado direito — Obrigado! 🚀
            </div>
          )}
        </div>

        {/* Saldo */}
        <div className="flex w-full justify-start">
          <div className="w-full text-left leading-tight">
            <div className="mb-1">
              <p className="text-[12px] font-medium uppercase tracking-wide text-slate-400">Saldo total</p>
              <h2 className="text-[9px] font-bold text-emerald-400">{formatMoney(total)} MZN</h2>
            </div>
            <div className="mb-1">
              <p className="text-[15px] font-medium uppercase tracking-wide text-slate-400">Lucro</p>
              <h3 className="text-[7px] font-bold text-cyan-400">{formatMoney(availableProfit)} MZN</h3>
            </div>
            <div className="mb-1">
              <p className="text-[7px] font-medium uppercase tracking-wide text-slate-400">Bónus</p>
              <h3 className="text-[7px] font-bold text-blue-400">{formatMoney(bonus)} MZN</h3>
            </div>
            <div className="text-[7px] text-slate-500">Lucro bruto calculado: {formatMoney(totalProfit)} MZN</div>
          </div>
        </div>

        {/* Botões */}
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => router.push("/deposito")} className="rounded-xl bg-emerald-500 py-2 text-[11px] font-bold text-black">Depositar</button>
          <button type="button" onClick={() => router.push("/levantamento")} className="rounded-xl bg-amber-500 py-2 text-[11px] font-bold text-black">Levantar</button>
          <button type="button" onClick={() => router.push("/chat-global")} className="rounded-xl bg-cyan-500 py-2 text-[11px] font-bold text-black">Suporte</button>
        </div>

        {isAdmin && (
          <div className="flex justify-center">
            <button type="button" onClick={() => router.push("/admin")} className="rounded-xl bg-red-500 px-4 py-2 text-[11px] font-bold text-white shadow-lg hover:bg-red-400">Painel do Administrador</button>
          </div>
        )}

        {/* Carrossel */}
        <div className="relative h-36 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg">
          {dashboardSlides.map((slide, index) => (
            <Image key={slide.src} src={slide.src} alt={slide.alt} fill sizes="(max-width: 768px) 100vw, 384px"
              className={`object-cover transition-opacity duration-700 ${currentSlide === index ? "opacity-100" : "opacity-0"}`}
              priority={index === 0} />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {dashboardSlides.map((_, index) => (
              <button key={index} type="button" onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${currentSlide === index ? "w-6 bg-amber-400" : "w-2 bg-white/60"}`}
                aria-label={`Ver imagem ${index + 1}`}/>
            ))}
          </div>
        </div>

        {/* Localização */}
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 shadow">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
            <MapPin size={18} />
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Nossa localização</p>
            <p className="text-xs font-bold text-emerald-300">{companyLocation}</p>
          </div>
        </div>
      </div>

      {/* Logout confirm */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-72 rounded-xl bg-slate-900 p-4 text-center">
            <p className="mb-3 text-sm">Sair da conta?</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowLogoutConfirm(false)} className="flex-1 rounded bg-gray-700 py-2 text-sm">Cancelar</button>
              <button type="button" onClick={handleLogout} className="flex-1 rounded bg-red-500 py-2 text-sm">Sair</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />

      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-marquee { display: inline-block; min-width: 100%; animation: marquee 15s linear infinite; }
        @media (max-width: 640px) { .animate-marquee { animation: marquee 20s linear infinite; font-size: 1rem; } }
        .animate-none { animation: none !important; }
      `}</style>
    </main>
  );
}