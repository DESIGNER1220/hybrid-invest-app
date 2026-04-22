"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Gift,
  Shield,
  ShieldOff,
  Users,
  Clock3,
  Wallet,
  Sparkles,
} from "lucide-react";
import { auth } from "../lib/firebase";
import BottomNav from "../components/BottomNav";
import {
  getPendingTransactions,
  approveTransaction,
  rejectTransaction,
  generateRandomBonusCode,
  createBonusCode,
  getBonusCodes,
  deactivateBonusCode,
  activateBonusCode,
  getAllUsers,
  setUserBlockedStatus,
  getUserProfile,
} from "../services/authService";

type PendingTransaction = {
  id: string;
  uid: string;
  type: "deposito" | "levantamento";
  method?: string;
  phone?: string;
  amount?: number;
  transactionCode?: string;
  status?: string;
  createdAt?: { seconds?: number };
  weekendBonusPercent?: number;
  weekendBonusAmount?: number;
  isWeekendPromo?: boolean;
};

type BonusCodeItem = {
  id: string;
  code?: string;
  amount?: number;
  isActive?: boolean;
  used?: boolean;
  usedBy?: string | null;
  createdAt?: { seconds?: number };
};

type UserItem = {
  id: string;
  uid?: string;
  phone?: string;
  email?: string;
  role?: string;
  blocked?: boolean;
  balance?: number;
  totalProfit?: number;
  bonus?: number;
  referrals?: number;
  createdAt?: { seconds?: number };
};

type AdminProfile = {
  role?: string;
};

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("pt-MZ");
}

function formatDateTime(timestamp?: { seconds?: number }) {
  if (!timestamp?.seconds) return "—";
  return new Date(timestamp.seconds * 1000).toLocaleString("pt-MZ");
}

type TabKey = "transactions" | "bonus" | "users";

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("transactions");

  const [pendingTransactions, setPendingTransactions] = useState<
    PendingTransaction[]
  >([]);
  const [bonusCodes, setBonusCodes] = useState<BonusCodeItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);

  const [busyTransactionId, setBusyTransactionId] = useState("");
  const [busyBonusId, setBusyBonusId] = useState("");
  const [busyUserId, setBusyUserId] = useState("");

  const [newBonusCode, setNewBonusCode] = useState("");
  const [newBonusAmount, setNewBonusAmount] = useState("");
  const [bonusLoading, setBonusLoading] = useState(false);

  async function loadTransactions() {
    const data = (await getPendingTransactions()) as PendingTransaction[];
    setPendingTransactions(data);
  }

  async function loadBonusCodes() {
    const data = (await getBonusCodes()) as BonusCodeItem[];
    setBonusCodes(data);
  }

  async function loadUsers() {
    const data = (await getAllUsers()) as UserItem[];
    setUsers(data);
  }

  async function loadAll() {
    await Promise.all([loadTransactions(), loadBonusCodes(), loadUsers()]);
  }

  async function handleApprove(transactionId: string) {
    try {
      setBusyTransactionId(transactionId);
      await approveTransaction(transactionId);
      await loadTransactions();
      await loadUsers();
      alert("Transação aprovada com sucesso.");
    } catch (error: any) {
      alert(error?.message || "Erro ao aprovar transação.");
    } finally {
      setBusyTransactionId("");
    }
  }

  async function handleReject(transactionId: string) {
    try {
      setBusyTransactionId(transactionId);
      await rejectTransaction(transactionId);
      await loadTransactions();
      alert("Transação rejeitada com sucesso.");
    } catch (error: any) {
      alert(error?.message || "Erro ao rejeitar transação.");
    } finally {
      setBusyTransactionId("");
    }
  }

  async function handleGenerateRandomCode() {
    try {
      const code = await generateRandomBonusCode();
      setNewBonusCode(code);
    } catch (error: any) {
      alert(error?.message || "Erro ao gerar código.");
    }
  }

  async function handleCreateBonusCode() {
    try {
      if (!newBonusCode.trim()) {
        alert("Informe o código.");
        return;
      }

      if (!newBonusAmount.trim() || Number(newBonusAmount) <= 0) {
        alert("Informe um valor válido.");
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("Sessão inválida.");
        return;
      }

      setBonusLoading(true);

      await createBonusCode({
        code: newBonusCode,
        amount: Number(newBonusAmount),
        createdBy: currentUser.uid,
      });

      setNewBonusCode("");
      setNewBonusAmount("");
      await loadBonusCodes();
      alert("Código de bónus criado com sucesso.");
    } catch (error: any) {
      alert(error?.message || "Erro ao criar código.");
    } finally {
      setBonusLoading(false);
    }
  }

  async function handleToggleBonusCode(item: BonusCodeItem) {
    try {
      setBusyBonusId(item.id);

      if (item.isActive) {
        await deactivateBonusCode(item.code || item.id);
      } else {
        await activateBonusCode(item.code || item.id);
      }

      await loadBonusCodes();
    } catch (error: any) {
      alert(error?.message || "Erro ao atualizar código.");
    } finally {
      setBusyBonusId("");
    }
  }

  async function handleToggleUserBlocked(userId: string, currentBlocked: boolean) {
    try {
      setBusyUserId(userId);
      await setUserBlockedStatus(userId, !currentBlocked);
      await loadUsers();
      alert(
        currentBlocked
          ? "Utilizador desbloqueado com sucesso."
          : "Utilizador bloqueado com sucesso."
      );
    } catch (error: any) {
      alert(error?.message || "Erro ao atualizar utilizador.");
    } finally {
      setBusyUserId("");
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const profile = (await getUserProfile(user.uid)) as AdminProfile | null;

        if (profile?.role !== "admin") {
          router.push("/dashboard");
          return;
        }

        await loadAll();
      } catch (error) {
        console.error("Erro ao carregar admin:", error);
        alert("Erro ao carregar painel admin.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  const transactionSummary = useMemo(() => {
    const deposits = pendingTransactions.filter((t) => t.type === "deposito").length;
    const withdrawals = pendingTransactions.filter(
      (t) => t.type === "levantamento"
    ).length;

    return { deposits, withdrawals };
  }, [pendingTransactions]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black p-4 text-white">
        Carregando painel admin...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black px-3 pt-4 pb-24 text-white">
      <div className="mx-auto max-w-sm space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg">
          <h1 className="text-xl font-bold text-amber-400">
            Painel do Administrador
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Aprovações, códigos de bónus e controlo de utilizadores.
          </p>
        </div>

        <div className="rounded-2xl border border-pink-500/20 bg-pink-500/10 p-4 shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-pink-300" />
            <h2 className="text-sm font-bold text-pink-300">
              Promoção de fim de semana
            </h2>
          </div>
          <p className="mt-2 text-xs text-white">
            Depósitos aprovados no fim de semana recebem bónus automático:
          </p>
          <div className="mt-2 space-y-1 text-[11px] text-slate-200">
            <p>100+ MZN → +10%</p>
            <p>1000+ MZN → +15%</p>
            <p>5000+ MZN → +20%</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("transactions")}
            className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
              activeTab === "transactions"
                ? "bg-amber-400 text-black"
                : "bg-white/5 text-slate-300"
            }`}
          >
            Transações
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bonus")}
            className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
              activeTab === "bonus"
                ? "bg-amber-400 text-black"
                : "bg-white/5 text-slate-300"
            }`}
          >
            Bónus
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
              activeTab === "users"
                ? "bg-amber-400 text-black"
                : "bg-white/5 text-slate-300"
            }`}
          >
            Utilizadores
          </button>
        </div>

        {activeTab === "transactions" && (
          <section className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-[11px] text-slate-400">Depósitos pendentes</p>
                <p className="mt-1 text-lg font-bold text-emerald-400">
                  {transactionSummary.deposits}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-[11px] text-slate-400">
                  Levantamentos pendentes
                </p>
                <p className="mt-1 text-lg font-bold text-amber-400">
                  {transactionSummary.withdrawals}
                </p>
              </div>
            </div>

            {pendingTransactions.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-slate-400">
                Sem transações pendentes.
              </div>
            ) : (
              pendingTransactions.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Wallet size={15} className="text-cyan-400" />
                        <p className="text-sm font-bold text-white">
                          {item.type === "deposito" ? "Depósito" : "Levantamento"}
                        </p>
                      </div>

                      <p className="mt-1 text-[11px] text-slate-400">
                        Telefone: {item.phone || "—"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Método: {item.method || "—"}
                      </p>

                      {item.transactionCode ? (
                        <p className="text-[11px] text-slate-400">
                          ID Transação: {item.transactionCode}
                        </p>
                      ) : null}

                      <p className="mt-1 text-[11px] text-slate-500">
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400">
                        {formatMoney(item.amount ?? 0)} MZN
                      </p>
                    </div>
                  </div>

                  {item.type === "deposito" && item.isWeekendPromo && (
                    <div className="mt-3 rounded-xl border border-pink-400/20 bg-pink-500/10 p-3">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-pink-300" />
                        <p className="text-xs font-bold text-pink-300">
                          Bónus automático de fim de semana
                        </p>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-200">
                        Ao aprovar este depósito, o utilizador recebe mais{" "}
                        <span className="font-bold text-white">
                          {formatMoney(item.weekendBonusAmount ?? 0)} MZN
                        </span>{" "}
                        de bónus ({item.weekendBonusPercent ?? 0}%).
                      </p>
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={busyTransactionId === item.id}
                      onClick={() => handleApprove(item.id)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-black transition hover:bg-emerald-400 disabled:opacity-70"
                    >
                      <CheckCircle2 size={15} />
                      Aprovar
                    </button>

                    <button
                      type="button"
                      disabled={busyTransactionId === item.id}
                      onClick={() => handleReject(item.id)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-400 disabled:opacity-70"
                    >
                      <XCircle size={15} />
                      Rejeitar
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {activeTab === "bonus" && (
          <section className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow">
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-amber-300" />
                <h2 className="text-sm font-bold text-white">
                  Criar código de bónus
                </h2>
              </div>

              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    Código
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBonusCode}
                      onChange={(e) => setNewBonusCode(e.target.value.toUpperCase())}
                      placeholder="BONUS-XXXX"
                      className="w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateRandomCode}
                      className="rounded-xl bg-cyan-500 px-3 py-2 text-xs font-bold text-black"
                    >
                      Gerar
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    Valor
                  </label>
                  <input
                    type="number"
                    value={newBonusAmount}
                    onChange={(e) => setNewBonusAmount(e.target.value)}
                    placeholder="Ex: 100"
                    className="w-full rounded-xl bg-black/30 px-3 py-2 text-sm text-white outline-none"
                  />
                </div>

                <button
                  type="button"
                  disabled={bonusLoading}
                  onClick={handleCreateBonusCode}
                  className="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-amber-300 disabled:opacity-70"
                >
                  {bonusLoading ? "A criar..." : "Criar código"}
                </button>
              </div>
            </div>

            {bonusCodes.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-slate-400">
                Nenhum código encontrado.
              </div>
            ) : (
              bonusCodes.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {item.code || item.id}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Valor: {formatMoney(item.amount ?? 0)} MZN
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Estado:{" "}
                        {item.used
                          ? "Utilizado"
                          : item.isActive
                          ? "Ativo"
                          : "Inativo"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>

                    {!item.used && (
                      <button
                        type="button"
                        disabled={busyBonusId === item.id}
                        onClick={() => handleToggleBonusCode(item)}
                        className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                          item.isActive
                            ? "bg-red-500 text-white hover:bg-red-400"
                            : "bg-emerald-500 text-black hover:bg-emerald-400"
                        } disabled:opacity-70`}
                      >
                        {item.isActive ? "Desativar" : "Ativar"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {activeTab === "users" && (
          <section className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 shadow">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-cyan-300" />
                <h2 className="text-sm font-bold text-white">
                  Gestão de utilizadores
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Utilizador bloqueado continua a entrar, pode depositar e
                investir, mas não pode fazer levantamento.
              </p>
            </div>

            {users.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-slate-400">
                Nenhum utilizador encontrado.
              </div>
            ) : (
              users.map((user) => {
                const isAdmin = user.role === "admin";
                const isBlocked = user.blocked === true;

                return (
                  <div
                    key={user.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">
                          {user.phone || "Sem telefone"}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">
                          {user.email || "Sem email"}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                              isAdmin
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-cyan-500/20 text-cyan-300"
                            }`}
                          >
                            {isAdmin ? "Admin" : "Utilizador"}
                          </span>

                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                              isBlocked
                                ? "bg-red-500/20 text-red-300"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {isBlocked ? "Bloqueado" : "Ativo"}
                          </span>
                        </div>
                      </div>

                      {!isAdmin && (
                        <button
                          type="button"
                          disabled={busyUserId === user.id}
                          onClick={() =>
                            handleToggleUserBlocked(user.id, isBlocked)
                          }
                          className={`flex min-w-[110px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                            isBlocked
                              ? "bg-emerald-500 text-black hover:bg-emerald-400"
                              : "bg-red-500 text-white hover:bg-red-400"
                          } disabled:opacity-70`}
                        >
                          {isBlocked ? (
                            <>
                              <Shield size={14} />
                              Desbloquear
                            </>
                          ) : (
                            <>
                              <ShieldOff size={14} />
                              Bloquear
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-black/20 p-2 text-center">
                        <p className="text-[10px] text-slate-400">Saldo</p>
                        <p className="text-[11px] font-bold text-emerald-400">
                          {formatMoney(user.balance ?? 0)}
                        </p>
                      </div>

                      <div className="rounded-lg bg-black/20 p-2 text-center">
                        <p className="text-[10px] text-slate-400">Lucro</p>
                        <p className="text-[11px] font-bold text-cyan-400">
                          {formatMoney(user.totalProfit ?? 0)}
                        </p>
                      </div>

                      <div className="rounded-lg bg-black/20 p-2 text-center">
                        <p className="text-[10px] text-slate-400">Bónus</p>
                        <p className="text-[11px] font-bold text-amber-300">
                          {formatMoney(user.bonus ?? 0)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                      <Clock3 size={12} />
                      <span>{formatDateTime(user.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}
      </div>

      <BottomNav />
    </main>
  );
}