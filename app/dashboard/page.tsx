"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase";
import { getUserProfile, logoutUser } from "../services/authService";
import BottomNav from "../components/BottomNav";
import Loader from "../components/Loader";
import { Wallet, Download, Users, Handshake, MapPin, Building2, LogOut } from "lucide-react";

type UserProfile = {
  balance?: number;
  totalProfit?: number;
  availableProfit?: number;
  bonus?: number;
  role?: string;
  referralCode?: string;
};

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("pt-MZ");
}

type MenuCardProps = { label: string; icon: React.ReactNode; onClick: () => void; size?: string };

function MenuCard({ label, icon, onClick, size }: MenuCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-[26px] bg-black/50 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center"
    >
      <div
        className={`flex ${size || "h-16 w-16"} items-center justify-center rounded-2xl 
          bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-600 text-white shadow-lg`}
      >
        {icon}
      </div>
      <span className="text-center text-sm xs:text-[10px] font-medium leading-5 text-white drop-shadow-md mt-2">{label}</span>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const siteLink = "https://www.hybrunimoz.mom";
  const companyLocation = "Montepuez, Cabo Delgado — Moçambique";

  async function load(uid: string) {
    const profile = await getUserProfile(uid);
    setUserData(profile as UserProfile);
  }

  async function handleLogout() {
    await logoutUser();
    router.push("/login");
  }

  function downloadApp() {
    const apkPath = "/app/hybrid-invest.apk";
    const link = document.createElement("a");
    link.href = apkPath;
    link.download = "HybridMining.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleInviteFriends() {
    if (userData?.referralCode) {
      setReferralCode(userData.referralCode);
      setShowReferralModal(true);
    } else {
      alert("Código de convite não disponível.");
    }
  }

  function copyReferralLink() {
    const fullLink = `${siteLink}?ref=${referralCode}`;
    navigator.clipboard.writeText(fullLink).then(() => {
      alert("Link copiado para a área de transferência!");
    });
  }

  function handleCompanyInfo() {
    setShowCompanyModal(true);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) router.push("/login");
      else await load(user.uid).finally(() => setLoading(false));
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => setShowWelcome(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  const balance = Number(userData?.balance ?? 0);
  const totalProfit = Number(userData?.totalProfit ?? 0);
  const availableProfit = Number(userData?.availableProfit ?? 0);
  const bonus = Number(userData?.bonus ?? 0);
  const isAdmin = userData?.role === "admin";
  const total = balance + availableProfit + bonus;

  if (loading) return <Loader message="Carregando dados..." />;

  return (
    <main className="relative min-h-screen pb-24 text-white overflow-hidden">

      {/* Fundo HB escurecido */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/hb_dashboard_background.png"
          alt="HB Background"
          className="w-full h-full object-cover brightness-60"
        />
      </div>

      {/* Gradientes neon sobre a imagem */}
      <div className="absolute inset-0 -z-5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,255,255,0.05)_0%,_transparent_70%)] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,128,0,0.03)_0%,_transparent_70%)] animate-pulse delay-200" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(0,255,128,0.03)_0%,_transparent_70%)] animate-pulse delay-400" />
      </div>

      <div className="mx-auto max-w-md px-4 pt-4">

        {/* Mensagem de boas-vindas */}
        {showWelcome && (
          <div className="mb-5 rounded-2xl bg-black/60 p-4 shadow-lg border border-white/20 animate-fade-in">
            <p className="text-sm font-bold text-amber-200 mb-2 drop-shadow-md">Por favor clique no Suporte em caso de dificuldades.</p>
            <p className="text-sm font-bold text-white drop-shadow-md">Participa nas reuniões para ganhar bônus Segunda e Sexta às 20h.</p>
          </div>
        )}

        {/* Topo HM */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 xs:h-12 xs:w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-400 via-amber-400 to-orange-400 text-white text-3xl font-extrabold shadow-lg drop-shadow-md">HM</div>
            <div>
              <h1 className="text-2xl xs:text-xl font-extrabold tracking-wide text-white drop-shadow-lg">HYBRID MINING</h1>
              <p className="text-xs xs:text-[10px] text-white/90 drop-shadow-sm">HYBRID MINING</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button type="button" onClick={() => router.push("/admin")} className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/80 text-white shadow-lg" title="Painel do Admin">
                <Users size={20} />
              </button>
            )}
            <button type="button" onClick={() => setShowLogoutConfirm(true)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white shadow-lg">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Cards de saldo */}
        <div className="mb-5 rounded-[26px] bg-black/50 p-4 shadow-lg grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-black/70 p-3">
            <p className="text-[11px] xs:text-[10px] text-white/80 drop-shadow-md">Lucro</p>
            <p className="mt-1 text-sm xs:text-xs font-bold text-cyan-300 drop-shadow-md">{formatMoney(availableProfit)} MZN</p>
          </div>
          <div className="rounded-2xl bg-black/70 p-3">
            <p className="text-[11px] xs:text-[10px] text-white/80 drop-shadow-md">Bónus</p>
            <p className="mt-1 text-sm xs:text-xs font-bold text-emerald-300 drop-shadow-md">{formatMoney(bonus)} MZN</p>
          </div>
          <div className="rounded-2xl bg-black/70 p-3">
            <p className="text-[11px] xs:text-[10px] text-white/80 drop-shadow-md">Bruto</p>
            <p className="mt-1 text-sm xs:text-xs font-bold text-amber-300 drop-shadow-md">{formatMoney(totalProfit)} MZN</p>
          </div>
        </div>

        {/* Grid de atalhos */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <MenuCard label="Recharge" icon={<Wallet size={28} />} onClick={() => router.push("/deposito")} />
          <MenuCard label="Withdraw" icon={<Download size={28} />} onClick={() => router.push("/levantamento")} />
          <MenuCard label="App" icon={<Download size={28} />} onClick={downloadApp} />
          <MenuCard label="Company Profile" icon={<Building2 size={28} />} onClick={handleCompanyInfo} />
          <MenuCard label="Invite Friends" icon={<Users size={28} />} onClick={handleInviteFriends} />
          <MenuCard label="Agency Cooperation" icon={<Handshake size={28} />} onClick={handleCompanyInfo} />
        </div>

        {/* Localização */}
        <div className="mt-5 flex items-center gap-3 rounded-[24px] bg-black/60 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/70"><MapPin size={22} className="text-white" /></div>
          <div>
            <p className="text-xs uppercase tracking-wide text-white/80 drop-shadow-sm">Nossa localização</p>
            <p className="text-sm font-semibold text-white drop-shadow-md">{companyLocation}</p>
          </div>
        </div>

      </div>

      <BottomNav />
      {/* Modal de convite */}
      {showReferralModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-[26px] border border-white/20 bg-[#071d20] p-5 text-white shadow-2xl">
            <h2 className="text-xl font-extrabold text-amber-300">
              Invite Friends
            </h2>

            <p className="mt-3 text-sm text-white/80">
              Partilhe o seu link de convite com amigos:
            </p>

            <div className="mt-4 rounded-2xl bg-black/60 p-3">
              <p className="break-all text-sm font-bold text-cyan-300">
                {`${siteLink}?ref=${referralCode}`}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={copyReferralLink}
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg active:scale-[0.98]"
              >
                Copiar link
              </button>

              <button
                type="button"
                onClick={() => setShowReferralModal(false)}
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white shadow-lg active:scale-[0.98]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de empresa / agência */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-[26px] border border-white/20 bg-[#071d20] p-5 text-white shadow-2xl">
            <h2 className="text-xl font-extrabold text-amber-300">
              Hybrid Mining Company
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/85">
              A HYBRID MINING é uma plataforma de Investimentos digitais com foco
              em planos de rendimento, aluguer de máquinas , Ligado ao mundo desde 2020, a plataforma está  em Moçambique desde 02 de abril de 2026. e crescimento por
              convite.
            </p>

            <div className="mt-4 rounded-2xl bg-black/60 p-3">
              <p className="text-xs uppercase tracking-wide text-white/60">
                Website
              </p>
              <p className="mt-1 break-all text-sm font-bold text-cyan-300">
                {siteLink}
              </p>
            </div>

            <div className="mt-3 rounded-2xl bg-black/60 p-3">
              <p className="text-xs uppercase tracking-wide text-white/60">
                Localização
              </p>
              <p className="mt-1 text-sm font-bold text-white">
                {companyLocation}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => window.open(siteLink, "_blank")}
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg active:scale-[0.98]"
              >
                Abrir link
              </button>

              <button
                type="button"
                onClick={() => setShowCompanyModal(false)}
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white shadow-lg active:scale-[0.98]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmação de logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-[26px] border border-white/20 bg-[#071d20] p-5 text-white shadow-2xl">
            <h2 className="text-xl font-extrabold text-red-300">
              Sair da conta
            </h2>

            <p className="mt-3 text-sm text-white/80">
              Tem certeza que deseja terminar a sessão?
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-bold text-white shadow-lg active:scale-[0.98]"
              >
                Sim, sair
              </button>

              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white shadow-lg active:scale-[0.98]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}