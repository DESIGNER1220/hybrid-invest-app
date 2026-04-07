"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import { getUserInvestments } from "../services/authService";
import BottomNav from "../components/BottomNav";

export default function AtivosPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const data = await getUserInvestments(currentUser.uid);
      setItems(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 px-4 pb-28 pt-6 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">Activos</h1>
        <p className="mt-2 text-slate-300">Aqui aparecem os teus planos ativos.</p>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-slate-400">Carregando...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <p className="text-slate-400">Nenhum activo disponível ainda.</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-amber-400">
                      {item.planName}
                    </p>
                    <p className="text-sm text-slate-400">
                      Investimento: {Number(item.amount ?? 0).toLocaleString("pt-MZ")} MZN
                    </p>
                    <p className="text-sm text-slate-400">
                      Lucro diário: {item.dailyRate}%
                    </p>
                    <p className="text-sm text-slate-400">
                      Dias úteis: {item.durationDays}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-emerald-400">
                      {Number(item.totalProfit ?? 0).toLocaleString("pt-MZ")} MZN
                    </p>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}