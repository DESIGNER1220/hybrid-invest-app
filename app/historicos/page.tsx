"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getUserTransactions } from "../services/authService";
import BottomNav from "../components/BottomNav";

export default function HistoricosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  async function load(uid: string) {
    const data = await getUserTransactions(uid);
    setTransactions(data);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      await load(user.uid);
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  const depositosPendentes = useMemo(
    () => transactions.filter((t) => t.type === "deposito" && t.status === "pendente"),
    [transactions]
  );

  const depositosConcluidos = useMemo(
    () => transactions.filter((t) => t.type === "deposito" && t.status === "aprovado"),
    [transactions]
  );

  const levantamentosPendentes = useMemo(
    () => transactions.filter((t) => t.type === "levantamento" && t.status === "pendente"),
    [transactions]
  );

  const levantamentosConcluidos = useMemo(
    () => transactions.filter((t) => t.type === "levantamento" && t.status === "aprovado"),
    [transactions]
  );

  function Card({ title, items, color }: any) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <h2 className="text-sm text-slate-300">{title}</h2>

        {items.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">Nenhum registo</p>
        ) : (
          <div className="mt-3 space-y-2">
            {items.map((item: any) => (
              <div
                key={item.id}
                className="rounded-lg bg-slate-950/40 p-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">
                    {Number(item.amount || 0).toLocaleString("pt-MZ")} MZN
                  </span>
                  <span className={color}>{item.status}</span>
                </div>
                <p className="mt-1 text-slate-500">{item.method || "M-Pesa"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-4 text-white">
        Carregando...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-3 pb-24 pt-3 text-white">
      <div className="mx-auto max-w-md space-y-3">
        <h1 className="text-xl font-bold">Históricos</h1>

        <Card title="Depósitos pendentes" items={depositosPendentes} color="text-amber-400" />
        <Card title="Depósitos concluídos" items={depositosConcluidos} color="text-emerald-400" />
        <Card title="Levantamentos pendentes" items={levantamentosPendentes} color="text-amber-400" />
        <Card title="Levantamentos concluídos" items={levantamentosConcluidos} color="text-emerald-400" />
      </div>

      <BottomNav />
    </main>
  );
}