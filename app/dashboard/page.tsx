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
      className="group rounded-[26px] bg-white/5 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center"
    >
      <div className={`flex ${size || "h-16 w-16"} items-center justify-center rounded-2xl bg-gradient-to-br from-teal-300 via-emerald-300 to-cyan-300 text-white shadow-lg`}>
        {icon}
      </div>
      <span className="text-center text-sm xs:text-[10px] font-medium leading-5 text-white mt-2">{label}</span>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // Modais
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const siteLink = "https://hybridmining.com";

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
    const apkPath = "/files/hybridmining.apk";
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
    <main className="relative min-h-screen pb-24 text-white bg-gradient-to-br from-[#0f1e3c] via-[#071224] to-[#0f243f] overflow-hidden">

      {/* Fundo tech */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,255,255,0.05)_0%,_transparent_70%)] animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,128,0,0.03)_0%,_transparent_70%)] animate-pulse delay-200" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(0,255,128,0.03)_0%,_transparent_70%)] animate-pulse delay-400" />
      </div>

      <div className="mx-auto max-w-md px-4 pt-4">

        {/* Mensagem de boas-vindas */}
        {showWelcome && (
          <div className="mb-5 rounded-2xl bg-white/10 p-4 shadow-lg border border-white/20 animate-fade-in">
            <p className="text-sm font-bold text-amber-200 mb-2">Por favor clique no Suporte em caso de dificuldades.</p>
            <p className="text-sm font-bold text-white">Participa nas reuniões para ganhar bônus Segunda e Sexta às 20h.</p>
          </div>
        )}

        {/* Topo HM */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 xs:h-12 xs:w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-400 via-amber-400 to-orange-400 text-white text-3xl font-extrabold shadow-lg">HM</div>
            <div>
              <h1 className="text-2xl xs:text-xl font-extrabold tracking-wide">HYBRID MINING</h1>
              <p className="text-xs xs:text-[10px] text-white/70">HYBRID MINING</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button type="button" onClick={() => router.push("/admin")} className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/80 text-white shadow-lg" title="Painel do Admin">
                <Users size={20} />
              </button>
            )}
            {/* Ícone de logout circular */}
            <button type="button" onClick={() => setShowLogoutConfirm(true)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white shadow-lg">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Cards de saldo */}
        <div className="mb-5 rounded-[26px] bg-white/10 p-4 shadow-lg grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-black/10 p-3">
            <p className="text-[11px] xs:text-[10px] text-white/70">Lucro</p>
            <p className="mt-1 text-sm xs:text-xs font-bold text-cyan-300">{formatMoney(availableProfit)} MZN</p>
          </div>
          <div className="rounded-2xl bg-black/10 p-3">
            <p className="text-[11px] xs:text-[10px] text-white/70">Bónus</p>
            <p className="mt-1 text-sm xs:text-xs font-bold text-emerald-300">{formatMoney(bonus)} MZN</p>
          </div>
          <div className="rounded-2xl bg-black/10 p-3">
            <p className="text-[11px] xs:text-[10px] text-white/70">Bruto</p>
            <p className="mt-1 text-sm xs:text-xs font-bold text-amber-300">{formatMoney(totalProfit)} MZN</p>
          </div>
        </div>

        {/* Grid de atalhos fixo */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <MenuCard label="Recharge" icon={<Wallet size={28} />} onClick={() => router.push("/deposito")} size="h-14 w-14 xs:h-12 xs:w-12"/>
          <MenuCard label="Withdraw" icon={<Download size={28} />} onClick={() => router.push("/levantamento")} size="h-14 w-14 xs:h-12 xs:w-12"/>
          <MenuCard label="App" icon={<Download size={28} />} onClick={downloadApp} size="h-14 w-14 xs:h-12 xs:w-12"/>
          <MenuCard label="Company Profile" icon={<Building2 size={28} />} onClick={handleCompanyInfo} size="h-14 w-14 xs:h-12 xs:w-12"/>
          <MenuCard label="Invite Friends" icon={<Users size={28} />} onClick={handleInviteFriends} size="h-14 w-14 xs:h-12 xs:w-12"/>
          <MenuCard label="Agency Cooperation" icon={<Handshake size={28} />} onClick={handleCompanyInfo} size="h-14 w-14 xs:h-12 xs:w-12"/>
        </div>

        {/* Localização */}
        <div className="mt-5 flex items-center gap-3 rounded-[24px] bg-white/10 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10"><MapPin size={22} /></div>
          <div>
            <p className="text-xs uppercase tracking-wide text-white/60">Nossa localização</p>
            <p className="text-sm font-semibold">{companyLocation}</p>
          </div>
        </div>

      </div>

      <BottomNav />

      {/* Modais */}
      {/* Invite Friends */}
      {showReferralModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white/5 p-6 shadow-xl backdrop-blur animate-fade-in border border-white/20">
            <h2 className="text-center text-lg font-bold text-white mb-4">Compartilhe seu código de convite</h2>
            <p className="text-center text-white mb-2 font-mono text-lg">Código: {referralCode}</p>
            <p className="text-center text-white mb-4 text-sm">Link: {siteLink}?ref={referralCode}</p>
            <button
              onClick={copyReferralLink}
              className="mb-2 w-full rounded-xl bg-amber-400 py-2 text-sm font-bold text-black hover:bg-amber-300 transition"
            >
              Copiar link
            </button>
            <button
              onClick={() => setShowReferralModal(false)}
              className="mt-2 w-full rounded-xl border border-amber-400 py-2 text-sm text-amber-400 hover:bg-white/10 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal Company */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white/5 p-6 shadow-xl backdrop-blur animate-fade-in border border-white/20">
            <h2 className="text-center text-lg font-bold text-white mb-4">Sobre a Empresa</h2>
            <p className="text-center text-white text-sm">
              A empresa moçambicana que veio para ajudar os moçambicanos sobre vida financeira, teve o seu início no dia 02 de Abril de 2026 com um contrato assinado com a administração financeira moçambicana de 5 anos de trabalho, beneficiando os moçambicanos.
            </p>
            <button
              onClick={() => setShowCompanyModal(false)}
              className="mt-4 w-full rounded-xl border border-amber-400 py-2 text-sm text-amber-400 hover:bg-white/10 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

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

    </main>
  );
}