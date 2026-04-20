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
  Crown,
  Percent,
} from "lucide-react";
import { auth } from "../lib/firebase";
import {
  getTodayHistory,
  getUserProfile,
  logoutUser,
  redeemBonusCode,
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
  vipLevel?: string;
  withdrawalFeePercent?: number;
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

  const [bonusCode, setBonusCode] = useState("");
  const [redeemingBonus, setRedeemingBonus] = useState(false);
  const [bonusSuccess, setBonusSuccess] = useState("");
  const [bonusError, setBonusError] = useState("");

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

  async function handleRedeemBonus() {
    const uid = auth.currentUser?.uid;

    if (!uid) {
      setBonusError("Usuário não autenticado.");
      return;
    }

    if (!bonusCode.trim()) {
      setBonusError("Digite o código de bónus.");
      return;
    }

    try {
      setRedeemingBonus(true);
      setBonusSuccess("");
      setBonusError("");

      await redeemBonusCode(uid, bonusCode);

      await loadAll(uid);

      setBonusCode("");
      setBonusSuccess("Bónus resgatado com sucesso!");
    } catch (error: any) {
      setBonusError(error?.message || "Erro ao resgatar bónus.");
    } finally {
      setRedeemingBonus(false);
    }
  }

  async function copyText(
    e: React.MouseEvent<HTMLButtonElement>,
    value: string,
    field: "code" | "link"
  ) {
    e.preventDefault();
    e.stopPropagation();

    if (!value.trim()) return;

    try {
      await navigator.clipboard.writeText(value.trim());
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

  const inviteCode = useMemo(() => {
    return (profile?.referralCode || "").trim().toUpperCase();
  }, [profile?.referralCode]);

  const inviteLink = useMemo(() => {
    if (!inviteCode) return "";
    return `https://www.hybrunimoz.mom/register?ref=${inviteCode}`;
  }, [inviteCode]);

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
            Dados da conta, convite, VIP e histórico das últimas 24 horas.
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

            <div className="flex justify-between gap-3">
              <span className="flex items-center gap-1 text-slate-400">
                <Crown size={14} />
                Nível VIP
              </span>
              <span className="font-semibold text-violet-300">
                {profile?.vipLevel || "VIP1"}
              </span>
            </div>

            <div className="flex justify-between gap-3">
              <span className="flex items-center gap-1 text-slate-400">
                <Percent size={14} />
                Taxa de levantamento
              </span>
              <span className="font-semibold text-orange-300">
                {Number(profile?.withdrawalFeePercent ?? 12)}%
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/10 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Crown size={15} className="text-violet-300" />
              <h2 className="text-sm font-bold text-violet-300">
                Tabela VIP de levantamento
              </h2>
            </div>

            <div className="space-y-2 text-[11px] text-white">
              <div className="flex justify-between rounded-lg bg-black/20 px-3 py-2">
                <span>VIP1</span>
                <span>0 a 2 convidados • 12%</span>
              </div>
              <div className="flex justify-between rounded-lg bg-black/20 px-3 py-2">
                <span>VIP2</span>
                <span>3 convidados • 10%</span>
              </div>
              <div className="flex justify-between rounded-lg bg-black/20 px-3 py-2">
                <span>VIP3</span>
                <span>5 convidados • 6%</span>
              </div>
              <div className="flex justify-between rounded-lg bg-black/20 px-3 py-2">
                <span>VIP4</span>
                <span>8 convidados • 4%</span>
              </div>
              <div className="flex justify-between rounded-lg bg-black/20 px-3 py-2">
                <span>VIP5</span>
                <span>10+ convidados • 0%</span>
              </div>
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
                <input
                  type="text"
                  readOnly
                  value={inviteCode}
                  className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white outline-none"
                />

                <button
                  type="button"
                  onClick={(e) => copyText(e, inviteCode, "code")}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-black transition hover:bg-amber-400"
                  aria-label="Copiar código"
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

              <textarea
                readOnly
                value={inviteLink}
                rows={3}
                className="w-full resize-none rounded-lg bg-slate-900 px-3 py-2 text-[11px] text-white outline-none"
              />

              <button
                type="button"
                onClick={(e) => copyText(e, inviteLink, "link")}
                className="mt-3 w-full rounded-lg bg-cyan-500 py-2 text-xs font-bold text-black transition hover:bg-cyan-400"
              >
                {copiedField === "link" ? "Link copiado" : "Copiar link"}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Gift size={15} className="text-emerald-300" />
              <h2 className="text-sm font-bold text-emerald-300">
                Resgatar bónus
              </h2>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-[11px] text-slate-400">Código de bónus</p>

              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={bonusCode}
                  onChange={(e) => setBonusCode(e.target.value.toUpperCase())}
                  placeholder="Digite o código de bónus"
                  className="w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white outline-none"
                />

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleRedeemBonus}
                    disabled={redeemingBonus}
                    className="rounded-lg bg-emerald-500 px-6 py-2 text-xs font-bold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {redeemingBonus ? "..." : "Resgatar"}
                  </button>
                </div>
              </div>

              {bonusSuccess ? (
                <p className="mt-2 text-[11px] text-emerald-300">
                  {bonusSuccess}
                </p>
              ) : null}

              {bonusError ? (
                <p className="mt-2 text-[11px] text-red-400">{bonusError}</p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
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