"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  Gift,
  Link as LinkIcon,
  LogOut,
  Shield,
  Users,
  Percent,
  Copy,
} from "lucide-react";

import { auth } from "../lib/firebase";
import {
  getUserProfile,
  logoutUser,
  redeemBonusCode,
} from "../services/authService";
import BottomNav from "../components/BottomNav";

type UserProfile = {
  uid: string;
  phone?: string;
  email?: string;
  balance?: number;
  bonus?: number;
  totalProfit?: number;
  referralCode?: string;
  referrals?: number;
  activeReferralInvestors?: number;
  vipLevel?: string;
  withdrawalFeePercent?: number;
};

function money(value?: number) {
  return `${Number(value ?? 0).toFixed(2)} MZN`;
}

export default function PerfilPage() {
  const router = useRouter();

  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bonusCode, setBonusCode] = useState("");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUid(user.uid);

      try {
        const data = await getUserProfile(user.uid);
        setProfile(data as UserProfile);
      } catch (error: any) {
        setErrorMsg(error?.message || "Erro ao carregar perfil.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  const inviteLink = useMemo(() => {
    const ref = String(profile?.referralCode || "").trim();
    if (!ref) return "";
    return `https://www.hybrunimoz.mom/register?ref=${ref}`;
  }, [profile?.referralCode]);

  async function refreshProfile() {
    if (!uid) return;

    try {
      const data = await getUserProfile(uid);
      setProfile(data as UserProfile);
    } catch (error: any) {
      setErrorMsg(error?.message || "Erro ao atualizar perfil.");
    }
  }

  async function handleCopy(text: string, successText: string) {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setMessage(successText);
      setErrorMsg("");
      setTimeout(() => setMessage(""), 2500);
    } catch {
      setErrorMsg("Não foi possível copiar.");
    }
  }

  async function handleRedeemBonus() {
    if (!uid) return;

    if (!bonusCode.trim()) {
      setErrorMsg("Digite o código de bónus.");
      return;
    }

    try {
      setRedeeming(true);
      setErrorMsg("");
      setMessage("");

      await redeemBonusCode(uid, bonusCode);
      setMessage("Bónus resgatado com sucesso.");
      setBonusCode("");
      await refreshProfile();
    } catch (error: any) {
      setErrorMsg(error?.message || "Erro ao resgatar bónus.");
    } finally {
      setRedeeming(false);
    }
  }

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await logoutUser();
      router.push("/login");
    } catch (error: any) {
      setErrorMsg(error?.message || "Erro ao terminar sessão.");
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020817] p-4 text-white">
        Carregando...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020817] px-3 pt-3 pb-28 text-white">
      <div className="mx-auto max-w-sm space-y-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg">
          <h1 className="text-lg font-bold">Perfil</h1>
          <p className="mt-1 text-xs text-slate-400">
            Gerencie a sua conta, convite e bónus.
          </p>
        </div>

        {(message || errorMsg) && (
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              errorMsg
                ? "border border-red-400 bg-red-500/20 text-red-300"
                : "border border-emerald-400 bg-emerald-500/20 text-emerald-300"
            }`}
          >
            {errorMsg || message}
          </div>
        )}

        <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-black/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-cyan-300">
                <Shield size={18} />
                <span className="text-sm font-bold">VIP atual</span>
              </div>
              <p className="text-2xl font-extrabold text-white">
                {profile?.vipLevel || "VIP1"}
              </p>
            </div>

            <div className="rounded-2xl bg-black/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-amber-300">
                <Percent size={18} />
                <span className="text-sm font-bold">Taxa atual</span>
              </div>
              <p className="text-2xl font-extrabold text-white">
                {Number(profile?.withdrawalFeePercent ?? 12)}%
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-black/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-fuchsia-300">
                <Users size={18} />
                <span className="text-sm font-bold">Convidados</span>
              </div>
              <p className="text-xl font-bold text-white">
                {Number(profile?.referrals ?? 0)}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Total registados com o teu código
              </p>
            </div>

            <div className="rounded-2xl bg-black/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-emerald-300">
                <Gift size={18} />
                <span className="text-sm font-bold">Válidos VIP</span>
              </div>
              <p className="text-xl font-bold text-white">
                {Number(profile?.activeReferralInvestors ?? 0)}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Com depósito aprovado
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-500/20 bg-white/5 p-4">
          <p className="mb-3 text-sm font-bold text-amber-300">
            Código de referência
          </p>

          <div className="flex gap-2">
            <div className="flex-1 rounded-2xl bg-[#07122b] px-4 py-4 text-base font-bold tracking-wide text-white">
              {profile?.referralCode || "Sem código"}
            </div>

            <button
              type="button"
              onClick={() =>
                handleCopy(profile?.referralCode || "", "Código copiado.")
              }
              className="flex h-[56px] w-[56px] items-center justify-center rounded-2xl bg-amber-500 text-black shadow-lg transition hover:bg-amber-400"
            >
              <Copy size={20} />
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-500/20 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-cyan-300">
            <LinkIcon size={18} />
            <span className="text-sm font-bold">Link de convite</span>
          </div>

          <div className="rounded-2xl bg-[#07122b] px-4 py-4 text-sm text-white break-all">
            {inviteLink || "Sem link disponível"}
          </div>

          <button
            type="button"
            onClick={() => handleCopy(inviteLink, "Link copiado.")}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-4 font-bold text-black shadow-lg transition hover:bg-cyan-400"
          >
            <Copy size={18} />
            Copiar link
          </button>
        </div>

        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="mb-3 flex items-center gap-2 text-emerald-300">
            <Gift size={18} />
            <span className="text-sm font-bold">Resgatar bónus</span>
          </div>

          <input
            type="text"
            value={bonusCode}
            onChange={(e) => setBonusCode(e.target.value.toUpperCase())}
            placeholder="Digite o código de bónus"
            className="w-full rounded-2xl border border-white/10 bg-[#07122b] px-4 py-4 text-white outline-none placeholder:text-slate-500"
          />

          <button
            type="button"
            onClick={handleRedeemBonus}
            disabled={redeeming}
            className="mt-3 flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-4 py-4 font-bold text-black shadow-lg transition hover:bg-emerald-400 disabled:opacity-60"
          >
            {redeeming ? "Resgatando..." : "Resgatar"}
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-black/20 p-3">
              <p className="text-xs text-slate-400">Saldo</p>
              <p className="mt-1 text-sm font-bold text-cyan-300">
                {money(profile?.balance)}
              </p>
            </div>

            <div className="rounded-2xl bg-black/20 p-3">
              <p className="text-xs text-slate-400">Lucro</p>
              <p className="mt-1 text-sm font-bold text-emerald-300">
                {money(profile?.totalProfit)}
              </p>
            </div>

            <div className="rounded-2xl bg-black/20 p-3">
              <p className="text-xs text-slate-400">Bónus</p>
              <p className="mt-1 text-sm font-bold text-amber-300">
                {money(profile?.bonus)}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-4 font-bold text-white shadow-lg transition hover:bg-red-400 disabled:opacity-60"
        >
          <LogOut size={18} />
          {loggingOut ? "Saindo..." : "Terminar sessão"}
        </button>
      </div>

      <BottomNav />
    </main>
  );
}