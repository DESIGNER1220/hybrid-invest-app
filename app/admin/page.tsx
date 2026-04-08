"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import {
  approveTransaction,
  getPendingTransactions,
  getUserProfile,
  rejectTransaction,
} from "../services/authService";
import BottomNav from "../components/BottomNav";

type TransactionItem = {
  id: string;
  uid: string;
  type: "deposito" | "levantamento";
  method?: string;
  phone?: string;
  amount: number;
  status: string;
  transactionCode?: string;
  createdAt?: {
    seconds?: number;
  };
};

function formatDateTime(timestamp?: { seconds?: number }) {
  if (!timestamp?.seconds) return "Data indisponível";

  return new Date(timestamp.seconds * 1000).toLocaleString("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadPending() {
    const data = await getPendingTransactions();
    setTransactions((data as TransactionItem[]) || []);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const profile: any = await getUserProfile(user.uid);

        if (profile?.role !== "admin") {
          alert("Acesso restrito ao administrador.");
          router.push("/dashboard");
          return;
        }

        setIsAdmin(true);
        await loadPending();
      } catch (error) {
        console.error("Erro ao carregar admin:", error);
        alert("Erro ao carregar área administrativa.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function handleApprove(id: string) {
    try {
      setProcessingId(id);
      await approveTransaction(id);
      await loadPending();
      alert("Transação aprovada com sucesso.");
    } catch (error: any) {
      console.error("Erro ao aprovar:", error);
      alert(error?.message || "Erro ao aprovar transação.");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    try {
      setProcessingId(id);
      await rejectTransaction(id);
      await loadPending();
      alert("Transação rejeitada com sucesso.");
    } catch (error: any) {
      console.error("Erro ao rejeitar:", error);
      alert(error?.message || "Erro ao rejeitar transação.");
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-4 text-white">
        Carregando...
      </main>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-3 pb-24 pt-3 text-white">
      <div className="mx-auto max-w-md space-y-3">
        <div>
          <h1 className="text-xl font-bold">Administrador</h1>
          <p className="mt-1 text-xs text-slate-400">
            Aprovar ou rejeitar depósitos e levantamentos pendentes.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs text-slate-400">Pendentes</p>
          <h2 className="mt-1 text-lg font-bold text-amber-400">
            {transactions.length}
          </h2>
        </div>

        {transactions.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-sm text-slate-300">
              Não há transações pendentes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-lg"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3
                      className={`text-sm font-bold ${
                        item.type === "deposito"
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {item.type === "deposito"
                        ? "Depósito pendente"
                        : "Levantamento pendente"}
                    </h3>

                    <p className="mt-1 text-[11px] text-slate-500">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </div>

                  <span className="rounded-full bg-amber-500/20 px-2 py-1 text-[10px] text-amber-400">
                    {item.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-300">
                  <p>
                    Valor:{" "}
                    <span className="font-semibold text-white">
                      {Number(item.amount || 0).toLocaleString("pt-MZ")} MZN
                    </span>
                  </p>

                  <p>
                    Método:{" "}
                    <span className="font-semibold text-white">
                      {item.method || "Não informado"}
                    </span>
                  </p>

                  <p>
                    Número:{" "}
                    <span className="font-semibold text-white">
                      {item.phone || "Não informado"}
                    </span>
                  </p>

                  {item.type === "deposito" && (
                    <p>
                      ID transação:{" "}
                      <span className="font-semibold text-white">
                        {item.transactionCode || "Não informado"}
                      </span>
                    </p>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleApprove(item.id)}
                    disabled={processingId === item.id}
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-70"
                  >
                    {processingId === item.id ? "Processando..." : "Aprovar"}
                  </button>

                  <button
                    onClick={() => handleReject(item.id)}
                    disabled={processingId === item.id}
                    className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-70"
                  >
                    {processingId === item.id ? "Processando..." : "Rejeitar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}