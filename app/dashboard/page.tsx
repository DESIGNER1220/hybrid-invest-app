"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Globe,
  Wallet,
  Download,
  Building2,
  Users,
  Handshake,
  MapPin,
  Bell,
  Headset,
} from "lucide-react";

import { auth } from "../lib/firebase";
import { getUserProfile, logoutUser } from "../services/authService";
import BottomNav from "../components/BottomNav";
import Loader from "../components/Loader";

type UserProfile = {
  balance?: number;
  totalProfit?: number;
  availableProfit?: number;
  bonus?: number;
  role?: string;
};

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("pt-MZ");
}

const dashboardSlides = [
  { src: "/dashboard/server.jpg", alt: "Infraestrutura" },
  { src: "/dashboard/finance.jpg", alt: "Investimento" },
];

type MenuCardProps = { label: string; icon: React.ReactNode; onClick: () => void };

function MenuCard({ label, icon, onClick }: MenuCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-[18px] bg-white/5 p-3 shadow-[0_06px_10px_rgba(0,0,0,0.25)] transition hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-300 via-emerald-300 to-cyan-300 text-white shadow-lg">
          {icon}
        </div>
        <span className="text-center text-sm font-medium leading-5 text-white">{label}</span>
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) router.push("/login");
      else await load(user.uid).finally(() => setLoading(false));
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % dashboardSlides.length), 3500);
    return () => clearInterval(timer);
  }, []);

  const balance = Number(userData?.balance ?? 0);
  const totalProfit = Number(userData?.totalProfit ?? 0);
  const availableProfit = Number(userData?.availableProfit ?? 0);
  const bonus = Number(userData?.bonus ?? 0);
  const isAdmin = userData?.role === "admin";
  const total = balance + availableProfit + bonus;

  if (loading) return <Loader message="Carregando dados..." />;

  return (
    <main className="relative min-h-screen pb-24 text-white
      bg-gradient-to-br from-[#0f1e3c] via-[#071224] to-[#0f243f] overflow-hidden">

      {/* Fundo tech/raios em CSS */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,255,255,0.05)_0%,_transparent_70%)] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,128,0,0.03)_0%,_transparent_70%)] animate-pulse delay-200" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(0,255,128,0.03)_0%,_transparent_70%)] animate-pulse delay-400" />
      </div>

      {/* Topo */}
      <div className="mx-auto max-w-md px-4 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-400 via-amber-400 to-orange-400 text-white text-3xl font-extrabold shadow-lg">HM</div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-wide">HYBRID MINING</h1>
              <p className="text-xs text-white/70">HYBRID MINING</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/80 text-white shadow-lg"
                title="Painel do Admin"
              >
                <Users size={20} />
              </button>
            )}
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10"><Wallet size={20} /></button>
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10" onClick={() => router.push("/chat-global")}><Headset size={20} /></button>
            <button className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 text-sm"><Globe size={18}/>English</button>
          </div>
        </div>

        {/* Faixa info */}
        <div className="mb-5 flex items-center gap-3 rounded-full bg-white/10 px-4 py-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10"><Bell size={20} /></div>
          <p className="line-clamp-1 text-lg font-medium">NG’s latest mining project is recruiting</p>
        </div>

        {/* Cartão de saldo */}
        <div className="mb-5 rounded-[26px] bg-white/10 p-4 shadow-lg">
          <p className="text-sm text-white/70">Saldo Total</p>
          <h2 className="mt-1 text-3xl font-extrabold text-white">{formatMoney(total)} MZN</h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-black/10 p-3">
              <p className="text-[11px] text-white/70">Lucro</p>
              <p className="mt-1 text-sm font-bold text-cyan-300">{formatMoney(availableProfit)} MZN</p>
            </div>
            <div className="rounded-2xl bg-black/10 p-3">
              <p className="text-[11px] text-white/70">Bónus</p>
              <p className="mt-1 text-sm font-bold text-emerald-300">{formatMoney(bonus)} MZN</p>
            </div>
            <div className="rounded-2xl bg-black/10 p-3">
              <p className="text-[11px] text-white/70">Bruto</p>
              <p className="mt-1 text-sm font-bold text-amber-300">{formatMoney(totalProfit)} MZN</p>
            </div>
          </div>
        </div>

        {/* Grid de atalhos */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <MenuCard label="Recharge" icon={<Wallet size={28} />} onClick={() => router.push("/deposito")} />
          <MenuCard label="Withdraw" icon={<Download size={28} />} onClick={() => router.push("/levantamento")} />
          <MenuCard label="App" icon={<Download size={28} />} onClick={() => router.push("/app")} />
          <MenuCard label="Company Profile" icon={<Building2 size={28} />} onClick={() => router.push("/company-profile")} />
          <MenuCard label="Invite Friends" icon={<Users size={28} />} onClick={() => router.push("/invite")} />
          <MenuCard label="Agency Cooperation" icon={<Handshake size={28} />} onClick={() => router.push("/agency")} />
        </div>

        {/* Slider/Carousel movido para antes da localização */}
        <div className="relative mb-5 overflow-hidden rounded-[28px]">
          <div className="relative h-72 w-full">
            {dashboardSlides.map((slide, index) => (
              <img key={index} src={slide.src} alt={slide.alt} className={`absolute inset-0 object-cover transition-opacity duration-700 ${currentSlide === index ? "opacity-100" : "opacity-0"}`} />
            ))}
          </div>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {dashboardSlides.map((_, index) => (
              <button key={index} onClick={() => setCurrentSlide(index)} className={`h-2 rounded-full transition-all ${currentSlide === index ? "w-8 bg-white" : "w-2 bg-white/50"}`} />
            ))}
          </div>
        </div>

        {/* Localização */}
        <div className="mt-5 flex items-center gap-3 rounded-[24px] bg-white/10 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10"><MapPin size={22} /></div>
          <div>
            <p className="text-xs uppercase tracking-wide text-white/60">Nossa localização</p>
            <p className="text-sm font-semibold">{companyLocation}</p>
          </div>
        </div>

        {/* Logout */}
        <div className="mt-5">
          <button type="button" onClick={() => setShowLogoutConfirm(true)} className="w-full rounded-2xl bg-red-500/80 py-4 text-sm font-bold">Terminar sessão</button>
        </div>
      </div>

      {/* Modal logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-72 rounded-2xl bg-slate-900 p-4 text-center">
            <p className="mb-4 text-sm">Sair da conta?</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowLogoutConfirm(false)} className="flex-1 rounded-xl bg-gray-700 py-2 text-sm">Cancelar</button>
              <button type="button" onClick={handleLogout} className="flex-1 rounded-xl bg-red-500 py-2 text-sm">Sair</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}