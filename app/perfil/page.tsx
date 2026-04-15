"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  Clock3,
  Gift,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Trophy,
  Copy,
  Check,
  Link2,
} from "lucide-react";
import { auth } from "../lib/firebase";
import {
  getTodayHistory,
  getUserProfile,
  logoutUser,
} from "../services/authService";
import BottomNav from "../components/BottomNav";

type UserProfile = {
  phone?: string;
  email?: string;
  balance?: number;
  bonus?: number;
  totalProfit?: number;
  referralCode?: string;
  referrals?: number;
  role?: string;
};

type HistoryItem = {
  id: string;
  sourceType: "transaction" | "referral" | "wheel";
  type?: string;
  method?: string;
  amount?: number;
  status?: string;
  commissionAmount?: number;
  depositAmount?: number;
  reward?: number;
  label?: string;
  createdAt?: { seconds?: number };
};

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("pt-MZ");
}

function formatTime(timestamp?: { seconds?: number }) {
  if (!timestamp?.seconds) return "--:--";

  return new Date(timestamp.seconds * 1000).toLocaleTimeString("pt-MZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PerfilPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copiedField, setCopiedField] = useState<"" | "code" | "link">("");

  async function loadAll(uid: string) {
    const [profileData, todayHistory] = await Promise.all([
      getUserProfile(uid),
      getTodayHistory(uid),
    ]);

    setProfile((profileData || null) as UserProfile | null);
    setHistory((todayHistory || []) as HistoryItem[]);
  }

  async function handleLogout() {
    await logoutUser();
    router.push("/login");
  }

  async function copyText(value: string, field: "code" | "link") {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);

      setTimeout(() => {
        setCopiedField("");
      }, 2000);
    } catch (error) {
      console.error("Erro ao copiar:", error);
      alert("Não foi possível copiar.");
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        await loadAll(user.uid);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  const inviteLink = useMemo(() => {
    const code = profile?.referralCode || "";
    if (!code) return "";

    return `https://hybrunimoz.mom/register?ref=${code}`;
  }, [profile?.referralCode]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black p-4 text-white">
        Carregando...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black px-3 pt-3 pb-24 text-white">
      <div className="mx-auto max-w-sm space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
          <h1 className="text-lg font-bold">Perfil</h1>
          <p className="mt-1 text-xs text-slate-400">
            Dados da conta, convite e histórico das últimas 24 horas.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Telefone</span>
              <span className="font-semibold text-white">
                {profile?.phone || "—"}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Email</span>
              <span className="truncate font-semibold text-white">
                {profile?.email || "—"}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Saldo</span>
              <span className="font-semibold text-emerald-400">
                {formatMoney(profile?.balance ?? 0)} MZN
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Lucro</span>
              <span className="font-semibold text-cyan-400">
                {formatMoney(profile?.totalProfit ?? 0)} MZN
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Bónus</span>
              <span className="font-semibold text-amber-300">
                {formatMoney(profile?.bonus ?? 0)} MZN
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="text-slate-400">Convidados</span>
              <span className="font-semibold text-white">
                {Number(profile?.referrals ?? 0)}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Gift size={15} className="text-amber-300" />
              <h2 className="text-sm font-bold text-amber-300">
                Convide amigos
              </h2>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] text-slate-400">Código de convite</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">
                  {profile?.referralCode || "—"}
                </div>

                <button
                  onClick={() =>
                    profile?.referralCode &&
                    copyText(profile.referralCode, "code")
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-black transition hover:bg-amber-400"
                >
                  {copiedField === "code" ? (
                    <Check size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Link2 size={14} className="text-cyan-400" />
                <p className="text-[11px] text-slate-400">Link de convite</p>
              </div>

              <div className="rounded-lg bg-slate-900 px-3 py-2 text-[11px] text-white break-all">
                {inviteLink || "—"}
              </div>

              <button
                onClick={() => inviteLink && copyText(inviteLink, "link")}
                className="mt-3 w-full rounded-lg bg-cyan-500 py-2 text-xs font-bold text-black transition hover:bg-cyan-400"
              >
                {copiedField === "link" ? "Link copiado" : "Copiar link"}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-4 w-full rounded-xl bg-red-500 py-3 text-sm font-bold text-white transition hover:bg-red-400"
          >
            Terminar sessão
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
          <div className="mb-3 flex items-center gap-2">
            <History size={16} className="text-amber-300" />
            <h2 className="text-sm font-bold text-white">
              Histórico de Hoje
            </h2>
          </div>

          <p className="mb-3 text-[11px] text-slate-400">
            Mostra só os movimentos das últimas 24 horas.
          </p>

          {history.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-center text-xs text-slate-400">
              Ainda não há movimentos nas últimas 24 horas.
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item) => {
                if (item.sourceType === "transaction") {
                  const isDeposit = item.type === "deposito";
                  const isWithdraw = item.type === "levantamento";

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-white/10 bg-black/20 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          {isDeposit ? (
                            <ArrowDownCircle
                              size={16}
                              className="mt-0.5 text-emerald-400"
                            />
                          ) : (
                            <ArrowUpCircle
                              size={16}
                              className="mt-0.5 text-red-400"
                            />
                          )}

                          <div>
                            <p className="text-xs font-bold text-white">
                              {isDeposit ? "Depósito" : "Levantamento"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {item.method || "Método"} • {item.status || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p
                            className={`text-xs font-bold ${
                              isDeposit ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {isDeposit ? "+" : "-"}
                            {formatMoney(item.amount ?? 0)} MZN
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatTime(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (item.sourceType === "referral") {
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-white/10 bg-black/20 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <Gift size={16} className="mt-0.5 text-amber-300" />

                          <div>
                            <p className="text-xs font-bold text-white">
                              Bónus de Afiliado
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Comissão sobre depósito
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-bold text-amber-300">
                            +{formatMoney(item.commissionAmount ?? 0)} MZN
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatTime(item.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/10 bg-black/20 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <Trophy size={16} className="mt-0.5 text-cyan-400" />

                        <div>
                          <p className="text-xs font-bold text-white">
                            Sorteio / Roda
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {item.label || "Recompensa"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-bold text-cyan-400">
                          +{formatMoney(item.reward ?? 0)} MZN
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatTime(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
            <Clock3 size={12} />
            <span>
              O histórico mostra apenas os movimentos recentes de 24 horas.
            </span>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}