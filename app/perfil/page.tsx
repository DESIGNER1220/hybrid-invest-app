"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import {
  getUserProfile,
  logoutUser,
  getReferralEarnings,
} from "../services/authService";
import BottomNav from "../components/BottomNav";

type UserProfile = {
  phone?: string;
  referralCode?: string;
  referrals?: number;
  bonus?: number;
  role?: string;
};

type ReferralEarning = {
  id: string;
  commissionAmount?: number;
  depositAmount?: number;
  createdAt?: { seconds?: number };
};

function formatDate(timestamp?: { seconds?: number }) {
  if (!timestamp?.seconds) return "Data indisponível";

  return new Date(timestamp.seconds * 1000).toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function PerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [earnings, setEarnings] = useState<ReferralEarning[]>([]);

  async function loadAll(uid: string) {
    const [profile, earningsData] = await Promise.all([
      getUserProfile(uid),
      getReferralEarnings(uid),
    ]);

    setUserData((profile as UserProfile) || null);
    setEarnings((earningsData as ReferralEarning[]) || []);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      try {
        await loadAll(currentUser.uid);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        alert("Erro ao carregar os dados do perfil.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const phone = userData?.phone || "Não disponível";
  const referralCode = userData?.referralCode || "Sem código";
  const referrals = Number(userData?.referrals ?? 0);
  const bonus = Number(userData?.bonus ?? 0);
  const role = userData?.role || "user";
  const roleLabel = role === "admin" ? "Administrador" : "Utilizador";

  const inviteLink = useMemo(() => {
    if (!referralCode || referralCode === "Sem código") return "";
    return `https://www.hybrunimoz.mom/register?ref=${referralCode}`;
  }, [referralCode]);

  const totalReferralEarnings = useMemo(() => {
    return earnings.reduce(
      (sum, item) => sum + Number(item.commissionAmount ?? 0),
      0
    );
  }, [earnings]);

  async function handleCopyLink() {
    if (!inviteLink) {
      alert("Link indisponível.");
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      alert("Não foi possível copiar o link.");
    }
  }

  async function handleCopyCode() {
    if (!referralCode || referralCode === "Sem código") {
      alert("Código indisponível.");
      return;
    }

    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      console.error("Erro ao copiar código:", error);
      alert("Não foi possível copiar o código.");
    }
  }

  async function handleLogout() {
    try {
      await logoutUser();
      router.push("/login");
    } catch (error) {
      console.error("Erro ao terminar sessão:", error);
      alert("Não foi possível terminar sessão.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-4 text-white">
        <p>Carregando perfil...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-3 pb-24 pt-3 text-white">
      <div className="mx-auto max-w-md space-y-3">
        <div>
          <h1 className="text-xl font-bold">Perfil</h1>
          <p className="mt-1 text-xs text-slate-400">
            Veja as informações da sua conta.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg">
            <p className="text-[11px] text-slate-400">Telefone</p>
            <h3 className="mt-1 text-sm font-bold text-white">{phone}</h3>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg">
            <p className="text-[11px] text-slate-400">Tipo de conta</p>
            <h3 className="mt-1 text-sm font-bold text-amber-400">
              {roleLabel}
            </h3>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg">
            <p className="text-[11px] text-slate-400">Código de referência</p>
            <h3 className="mt-1 break-all text-sm font-bold text-amber-400">
              {referralCode}
            </h3>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg">
            <p className="text-[11px] text-slate-400">Total de convites</p>
            <h3 className="mt-1 text-base font-bold text-white">{referrals}</h3>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg">
            <p className="text-[11px] text-slate-400">Bónus acumulado</p>
            <h3 className="mt-1 text-base font-bold text-emerald-400">
              {bonus.toLocaleString("pt-MZ")} MZN
            </h3>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg">
            <p className="text-[11px] text-slate-400">Ganhos por afiliados</p>
            <h3 className="mt-1 text-base font-bold text-cyan-400">
              {totalReferralEarnings.toLocaleString("pt-MZ")} MZN
            </h3>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg">
          <h2 className="text-sm font-semibold text-white">Seu link de convite</h2>

          <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/40 p-3">
            <p className="break-all text-xs text-slate-300">
              {inviteLink || "Link indisponível"}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              onClick={handleCopyLink}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              {copiedLink ? "Link copiado!" : "Copiar link"}
            </button>

            <button
              onClick={handleCopyCode}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
            >
              {copiedCode ? "Código copiado!" : "Copiar código"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg">
          <h2 className="text-sm font-semibold text-white">
            Histórico de ganhos por afiliados
          </h2>

          {earnings.length === 0 ? (
            <p className="mt-3 text-xs text-slate-400">
              Ainda não existem ganhos registados.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {earnings.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-white/10 bg-slate-950/40 p-3"
                >
                  <p className="text-xs text-slate-300">Comissão recebida</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Depósito base:{" "}
                    {Number(item.depositAmount ?? 0).toLocaleString("pt-MZ")}{" "}
                    MZN
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {formatDate(item.createdAt)}
                  </p>
                  <p className="mt-2 text-sm font-bold text-emerald-400">
                    +
                    {Number(item.commissionAmount ?? 0).toLocaleString("pt-MZ")}{" "}
                    MZN
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
        >
          Terminar sessão
        </button>
      </div>

      <BottomNav />
    </main>
  );
}