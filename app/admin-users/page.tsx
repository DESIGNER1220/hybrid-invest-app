"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Shield, ShieldOff, Users } from "lucide-react";
import { auth } from "../lib/firebase";
import {
  getAllUsers,
  getUserProfile,
  setUserBlockedStatus,
} from "../services/authService";
import BottomNav from "../components/BottomNav";

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
  createdAt?: { seconds?: number };
};

type UserProfile = {
  role?: string;
};

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("pt-MZ");
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [togglingId, setTogglingId] = useState("");

  async function loadUsers() {
    const data = (await getAllUsers()) as UserItem[];
    setUsers(data);
  }

  async function handleToggleBlock(userId: string, currentBlocked: boolean) {
    try {
      setTogglingId(userId);
      await setUserBlockedStatus(userId, !currentBlocked);
      await loadUsers();
    } catch (error) {
      console.error("Erro ao atualizar bloqueio:", error);
      alert("Erro ao atualizar utilizador.");
    } finally {
      setTogglingId("");
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const profile = (await getUserProfile(user.uid)) as UserProfile | null;

        if (profile?.role !== "admin") {
          router.push("/dashboard");
          return;
        }

        await loadUsers();
      } catch (error) {
        console.error("Erro ao carregar admin:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

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
          <div className="flex items-center gap-2">
            <Users size={18} className="text-amber-300" />
            <h1 className="text-lg font-bold">Gestão de Utilizadores</h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            O bloqueio impede apenas levantamento. Depósitos e investimentos continuam ativos.
          </p>
        </div>

        {users.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-slate-400">
            Nenhum utilizador encontrado.
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => {
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
                        onClick={() => handleToggleBlock(user.id, isBlocked)}
                        disabled={togglingId === user.id}
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}